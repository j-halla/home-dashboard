const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const PORT = 3000;

// Departure
let departureData = {};
const departureLimit = 7;
const stationName = 'Wetlistrasse';
const stationboardApi = `https://transport.opendata.ch/v1/stationboard?station=${stationName}&limit=${departureLimit}`;

// Lights
let bridgeAddress = '';
let groupsApi = '';
let groups = {};
const bridgeAddressFallback = '192.168.1.117';
const bridgeDiscoveryApi = 'http://discovery.meethue.com/';
const bridgeAddressKey = 'internalipaddress';

// Function to update bridge address
const updateBridgeAddress = async () => {
    try {
        const response = await fetch(bridgeDiscoveryApi);
        if (!response.ok) {
            bridgeAddress = bridgeAddressFallback;
            groupsApi = `http://${bridgeAddress}/api/lI7sNFC7oAdlJ-b9OkZfEXB0If4u2pAVnlg7VUxW/groups/`;
            console.log(`Bridge address fallback used: ${bridgeAddress}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let data = await response.json();
        
        if (Array.isArray(data) && data.length > 0 && data[0][bridgeAddressKey]) {
            bridgeAddress = data[0][bridgeAddressKey];
            groupsApi = `http://${bridgeAddress}/api/lI7sNFC7oAdlJ-b9OkZfEXB0If4u2pAVnlg7VUxW/groups/`;
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

// Initial calls
(async () => {
    await updateBridgeAddress();
    await updateGroups();
    await updateDepartureData();
})();

// Set up update intervals
setInterval(updateBridgeAddress, 86400000); // 24 hours
setInterval(updateGroups, 30000); // 30 seconds
setInterval(updateDepartureData, 30000); // 30 seconds


// This middleware parses JSON bodies
app.use(express.json());

// This middleware logs the request method and URL
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// This endpoint triggers a light action
app.post('/api/trigger-light', async (req, res) => {
    
    // Validate request body
    try {
        const response = await fetch(`http://${bridgeAddress}/api/lI7sNFC7oAdlJ-b9OkZfEXB0If4u2pAVnlg7VUxW/groups/${req.body.id}/action/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ on: req.body.on })
        });
        
        const data = await response.json();
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
app.get('/sse/light', (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    
    // Send current groups data immediately
    res.write(`data: ${JSON.stringify(groups)}\n\n`);
    
    // Set up interval to send cached groups data
    const interval = setInterval(() => {
        res.write(`data: ${JSON.stringify(groups)}\n\n`);
    }, 30000);
    
    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(interval);
    });
});

// SSE endpoint
app.get('/sse/departure', (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    
    // Send current departure data immediately
    res.write(`data: ${JSON.stringify(departureData)}\n\n`);
    
    // Set up interval to send cached departure data
    const interval = setInterval(() => {
        res.write(`data: ${JSON.stringify(departureData)}\n\n`);
    }, 30000);
    
    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(interval);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});