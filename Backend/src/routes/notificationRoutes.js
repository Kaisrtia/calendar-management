const express = require('express');
const notificationHub = require('../notifications/notificationHub');

const router = express.Router();

router.get('/stream', (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  notificationHub.addClient(userId, res);
  res.write('data: {"type":"CONNECTED"}\n\n');

  const keepAlive = setInterval(() => {
    res.write('event: ping\ndata: {}\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    notificationHub.removeClient(userId, res);
  });
});

module.exports = router;
