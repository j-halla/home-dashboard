document.addEventListener('DOMContentLoaded', function () {

	// EventSource for stationboard data
	const eventSourceDeparture = new EventSource('/sse/stationboard');

	eventSourceDeparture.onmessage = function(event) {
		const data = JSON.parse(event.data);
		const tbody = document.querySelector('#stationboard-container tbody');
		tbody.innerHTML = '';
		let now = new Date();

		data.stationboard.forEach(entry => {
			let stationboard = new Date(entry.stop.departure);
			let prognosis = (entry.stop.prognosis.departure) ? new Date(entry.stop.prognosis.departure) : stationboard;
			let minCell = Math.max(0, Math.floor((prognosis - now) / 60000));
			let delay = Math.floor((prognosis - stationboard) / 60000);
			minCell = delay > 0 ? `${minCell} (+${delay})` : `${minCell}`;

			const row = `
			    <tr>
				<td>${entry.number || entry.category}</td>
				<td>${entry.to}</td>
				<td>${minCell}</td>
			    </tr>`;

			tbody.insertAdjacentHTML('beforeend', row);
		});
	};

	eventSourceDeparture.onerror = function(err) {
		console.error('EventSource failed:', err);
		eventSourceDeparture.close();
	};

	// EventSource for light groups
	const eventSourceLightGroups = new EventSource('/sse/groups');

	eventSourceLightGroups.onmessage = function(event) {
		const groups = JSON.parse(event.data);

		const container = document.getElementById('lights-container');
		container.innerHTML = '';

		Object.keys(groups).forEach(groupId => {
			container.insertAdjacentHTML('beforeend', `
				<div class="card light-card">
				    <div class="card-body">
					<p class="card-title text-center">${groups[groupId].name}</p>
					<div class="form-check form-switch">
					    <input class="form-check-input" type="checkbox" role="switch" id="switch-${groupId}" data-group-id="${groupId}" ${(groups[groupId].action.on) ? 'checked' : ''}>
					    <label class="form-check-label" for="switch-${groupId}"></label>
					</div>
				    </div>
				</div>`);
		});

		document.querySelectorAll('.form-check-input').forEach(input => {
			input.addEventListener('change', async (e) => {
				// Mark switch as having pending update
				e.target.dataset.pendingUpdate = 'true';

				await fetch('/api/trigger-light', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ on: e.target.checked, id: e.target.dataset.groupId })
				});

				// Clear pending update flag after API call completes
				e.target.dataset.pendingUpdate = 'false';
			});
		});
	};

	// EventSource for light groups
	const eventSourceLight = new EventSource('/sse/light');

	eventSourceLight.onmessage = function(event) {
		const groups = JSON.parse(event.data);

		Object.keys(groups).forEach(groupId => {
			const switchElement = document.getElementById(`switch-${groupId}`);
			// Only update if there's no pending update
			if (switchElement && switchElement.dataset.pendingUpdate !== 'true') {
				switchElement.checked = groups[groupId].action.on;
			}
		});
	};

	eventSourceLight.onerror = function(err) {
		console.error('EventSource failed:', err);
		eventSourceLight.close();
	};

	// EventSource for calendar data
	const eventSourceCalendar = new EventSource('/sse/calendar');

	eventSourceCalendar.onmessage = function(event) {

		// Helper function to convert date format
		const convertDateFormat = (dateStr) => {
			const [year, month, day] = dateStr.split('-');
			return `${day}.${month}.`;
		};

		const data = JSON.parse(event.data);

		Object.keys(data).forEach(type => {
			data[type].forEach((date, index) => {
				document.querySelector(`#${type}-next-${index}`).innerHTML = convertDateFormat(date);
			});
		});
	};

	eventSourceCalendar.onerror = function(err) {
		console.error('EventSource failed:', err);
		eventSourceCalendar.close();
	};

	// EventSource for wifi data
	const eventSourceWifi = new EventSource("/sse/wifi");

	eventSourceWifi.onmessage = (event) => {
		const data = JSON.parse(event.data);
		document.getElementById("wifi-ssid").textContent = `SSID: ${data.ssid}`;
		document.getElementById("wifi-password").textContent = `PW: ${data.pass}`;
		document.getElementById("wifi-qr-code").src = data.qrCodeDataUrl;
		eventSourceWifi.close(); // close once we got the data
	};

	eventSourceWifi.onerror = function(err) {
		console.error('EventSource failed:', err);
		eventSourceWifi.close();
	};
})
