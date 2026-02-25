const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from project root
app.use(express.static(path.join(__dirname)));

// Proxy endpoint to bypass CORS
app.get('/api/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  let targetUrl;
  try {
    targetUrl = decodeURIComponent(url);
    new URL(targetUrl); // validate
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; finance-chart/1.0)',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const contentType = response.headers.get('content-type') || 'application/json';
    const body = await response.text();
    res.set('Content-Type', contentType);
    res.set('Access-Control-Allow-Origin', '*');
    res.status(response.status).send(body);
  } catch (e) {
    res.status(502).json({ error: 'Proxy fetch failed', detail: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`finance-chart server running on port ${PORT}`);
});
