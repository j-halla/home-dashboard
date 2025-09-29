import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import QRCode from "qrcode";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const PORT = 3000;

// Departure
let departureData = {};
const departureLimit = 5;
const stationName = process.env.STATION_NAME;
const stationboardApi = `https://transport.opendata.ch/v1/stationboard?station=${stationName}&limit=${departureLimit}`;

// Lights
let bridgeAddress = '';
let groupsApi = '';
let groups = {};
let bridgeAddressFallback = process.env.HUE_BRIDGE_ADDRESS;
const user = process.env.HUE_USER;
const bridgeDiscoveryApi = 'http://discovery.meethue.com/';
const bridgeAddressKey = 'internalipaddress';

// Calendar
const zip = process.env.ZIP;
const types = ['cardboard', 'paper'];
const mrGreenType = 'Monthly';
const limit = 6;
let calendarData = { "cardboard": [], "paper": [] , "mrgreen": [] };
const germanMonths = {
	'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04',
	'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08',
	'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
};

const convertGermanDate = (dateStr) => {
	const [day, month, year] = dateStr.split(' ');
	const paddedDay = day.replace('.', '').padStart(2, '0');
	const monthNum = germanMonths[month];
	return `${year}-${monthNum}-${paddedDay}`;
};

// Function to update bridge address
const updateBridgeAddress = async () => {
	try {
		const response = await fetch(bridgeDiscoveryApi);
		if (!response.ok) {
			bridgeAddress = bridgeAddressFallback;
			groupsApi = `http://${bridgeAddress}/api/${user}/groups/`;
			console.log(`Bridge address fallback used: ${bridgeAddress}`);
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		let data = await response.json();

		if (Array.isArray(data) && data.length > 0 && data[0][bridgeAddressKey]) {
			bridgeAddress = data[0][bridgeAddressKey];
			bridgeAddressFallback = bridgeAddress;
			groupsApi = `http://${bridgeAddress}/api/${user}/groups/`;
			console.log(`Bridge address found: ${bridgeAddress}`);
		} else {
			console.error("No bridge address found in discovery response:", data);
		}
	} catch (error) {
		console.error("Error:", error.message);
	}
};

// Function to update groups
const updateGroups = async () => {
	try {
		const response = await fetch(groupsApi);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		groups = await response.json();
		console.log('Groups updated successfully');
	} catch (error) {
		console.error("Error updating groups:", error.message);
	}
};

// Function to update departure data
const updateDepartureData = async () => {
	try {
		const response = await fetch(stationboardApi);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		departureData = await response.json();
		console.log('Departure data updated successfully');
	} catch (error) {
		console.error("Error updating departure data:", error.message);
	}
};

// Function to update calendar data
const updateCalendarData = async () => {

	let today = new Date();
	let start = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
	let openerzApi = `https://openerz.metaodi.ch/api/calendar.json?zip=${zip}&types=${types.join('&types=')}&start=${start}&sort=date&offset=0&limit=${limit}`;
	let mrGreenApi = `https://api.mr-green.ch/api/get-pickup-dates-new-main`;
	let mrGreenBody = { "zip": zip, "type": mrGreenType };

	try {
		const response = await fetch(openerzApi);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		let erzData = await response.json();

		calendarData = { "cardboard": [], "paper": [], "mrgreen": [] };

		// Iterate through results and store dates in appropriate arrays
		erzData.result.forEach(item => {
			if (calendarData.hasOwnProperty(item.waste_type)) {
				calendarData[item.waste_type].push(item.date);
			}
		});

		// Second API call for Mr. Green
		const mrGreenResponse = await fetch(mrGreenApi, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(mrGreenBody)
		});

		if (!mrGreenResponse.ok) {
			throw new Error(`HTTP error! status: ${mrGreenResponse.status}`);
		}

		let mrGreenData = await mrGreenResponse.json();

		calendarData['mrgreen'] = mrGreenData.dates_data[0].date
			.slice(0, 3)
			.map(date => convertGermanDate(date));

		console.log('Calendar data updated successfully');
	} catch (error) {
		console.error("Error updating calendar data:", error.message);
	}
};

// Initial calls
(async () => {
	await updateBridgeAddress();
	await updateGroups();
	await updateDepartureData();
	await updateCalendarData();
})();

// Set up update intervals
setInterval(updateBridgeAddress, 86400000); // 24 hours
setInterval(updateGroups, 1000); // 1 second
setInterval(updateDepartureData, 30000); // 30 seconds
setInterval(updateCalendarData, 86400000); // 24 hours

// This middleware parses JSON bodies
app.use(express.json());

// This middleware logs the request method and URL
app.use((req, res, next) => {
	console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
	next();
});

let lastLightUpdate = Promise.resolve();

// This endpoint triggers a light action
app.post('/api/trigger-light', async (req, res) => {

	// Validate request body
	try {
		const response = await fetch(`http://${bridgeAddress}/api/${user}/groups/${req.body.id}/action/`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ on: req.body.on })
		});

		const data = await response.json();

		// Update lastLightUpdate promise
		lastLightUpdate = new Promise(resolve => {
			setTimeout(async () => {
				await updateGroups();
				resolve();
			}, 200); // 200ms delay to allow bridge to update
		});

		res.json(data);

		// Handle errors
	} catch (err) {
		console.error('Light API error:', err);
		res.status(500).json({ error: 'Failed to call light API', details: err.message });
	}
});

// Serve static files
app.use(express.static(path.join(__dirname, './')));

// SSE endpoint
app.get('/sse/groups', (req, res) => {
	// Set SSE headers
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
	});

	// Send current groups data immediately
	res.write(`data: ${JSON.stringify(groups)}\n\n`);

	// Set up interval to send cached groups data
	const interval = setInterval(() => {
		res.write(`data: ${JSON.stringify(groups)}\n\n`);
	}, 3600000);

	// Clean up on client disconnect
	req.on('close', () => {
		clearInterval(interval);
	});
});

// SSE endpoint
app.get('/sse/light', (req, res) => {
	// Set SSE headers
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
	});

	// Send current groups data immediately
	res.write(`data: ${JSON.stringify(groups)}\n\n`);

	// Set up interval to send cached groups data
	const interval = setInterval(async () => {
		await lastLightUpdate; // Wait for any pending updates
		res.write(`data: ${JSON.stringify(groups)}\n\n`);
	}, 1000);

	// Clean up on client disconnect
	req.on('close', () => {
		clearInterval(interval);
	});
});

// SSE endpoint
app.get('/sse/stationboard', (req, res) => {
	// Set SSE headers
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
	});

	// Send current departure data immediately
	res.write(`data: ${JSON.stringify(departureData)}\n\n`);

	// Set up interval to send cached departure data
	const interval = setInterval(() => {
		res.write(`data: ${JSON.stringify(departureData)}\n\n`);
	}, 10000);

	// Clean up on client disconnect
	req.on('close', () => {
		clearInterval(interval);
	});
});

// SSE endpoint
app.get('/sse/calendar', (req, res) => {
	// Set SSE headers
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
	});

	// Send current calendar data immediately
	res.write(`data: ${JSON.stringify(calendarData)}\n\n`);

	// Set up interval to send cached calendar data
	const interval = setInterval(() => {
		res.write(`data: ${JSON.stringify(calendarData)}\n\n`);
	}, 86400000);

	// Clean up on client disconnect
	req.on('close', () => {
		clearInterval(interval);
	});
});

// SSE endpoint
app.get("/sse/wifi", async (req, res) => {
	// Set SSE headers
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
	});
	const ssid = process.env.WIFI_SSID;
	const pass = process.env.WIFI_PASSWORD;

	// Format Wi-Fi QR code string
	const wifiString = `WIFI:T:WPA;S:${ssid};P:${pass};;`;
	const qrCodeDataUrl = await QRCode.toDataURL(wifiString);

	// Push JSON payload to client
	res.write(`data: ${JSON.stringify({ ssid, pass, qrCodeDataUrl })}\n\n`);

	// Close immediately (since this isn’t a live stream)
	res.end();
});

// Start server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
