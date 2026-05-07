const IORedis = require('ioredis');

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

// maxRetriesPerRequest is required to be null for BullMQ
const connection = new IORedis({
  host: redisHost,
  port: redisPort,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

module.exports = { connection };
