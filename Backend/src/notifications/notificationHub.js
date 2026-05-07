const clientsByUser = new Map();

const addClient = (userId, res) => {
  if (!clientsByUser.has(userId)) {
    clientsByUser.set(userId, new Set());
  }
  clientsByUser.get(userId).add(res);
};

const removeClient = (userId, res) => {
  const clients = clientsByUser.get(userId);
  if (!clients) return;
  clients.delete(res);
  if (clients.size === 0) {
    clientsByUser.delete(userId);
  }
};

const notifyUser = (userId, payload) => {
  const clients = clientsByUser.get(userId);
  if (!clients) return;

  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    res.write(data);
  }
};

module.exports = {
  addClient,
  removeClient,
  notifyUser
};
