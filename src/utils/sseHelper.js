/**
 * Sets up SSE headers and returns cleanup function
 * @param {Response} res - Express response object
 */
export function setupSSE(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
}

/**
 * Sends data as SSE event
 * @param {Response} res - Express response object
 * @param {any} data - Data to send (will be JSON stringified)
 */
export function sendSSEData(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Creates a polling SSE endpoint
 * @param {Function} getDataFn - Function that returns current data
 * @param {number} interval - Polling interval in ms
 * @param {Function} beforeSend - Optional async function to call before sending (e.g., wait for pending updates)
 */
export function createPollingSSE(getDataFn, interval, beforeSend = null) {
  return async (req, res) => {
    setupSSE(res);

    // Send initial data
    sendSSEData(res, getDataFn());

    // Set up polling interval
    const intervalId = setInterval(async () => {
      if (beforeSend) {
        await beforeSend();
      }
      sendSSEData(res, getDataFn());
    }, interval);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(intervalId);
    });
  };
}

/**
 * Creates a one-shot SSE endpoint (sends data once and closes)
 * @param {Function} getDataFn - Async function that returns data to send
 */
export function createOneShotSSE(getDataFn) {
  return async (req, res) => {
    setupSSE(res);
    const data = await getDataFn();
    sendSSEData(res, data);
    res.end();
  };
}
