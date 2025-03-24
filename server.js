const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const PORT = 3000;
const stationboardApi = 'https://transport.opendata.ch/v1/stationboard?station=Wetlistrasse&limit=10';

// Serve static files
app.use(express.static(path.join(__dirname, './')));

// SSE endpoint
app.get('/sse', (req, res) => {
    
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    
    // Fetch departure data and send it as an SSE event
    const fetchAndSendData = () => {
        fetch(stationboardApi)
            .then(response => response.json())
            .then(data => {

                // Format the data and send it as an SSE event
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            })
            .catch(error => console.error('Error:', error));
    };
    
    // Execute immediately
    fetchAndSendData();
    
    // Set up interval
    const interval = setInterval(fetchAndSendData, 30000);
    
    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(interval);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});