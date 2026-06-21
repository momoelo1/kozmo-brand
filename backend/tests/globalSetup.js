// Runs once, in the main process, BEFORE any test module is imported.
// Boots an ephemeral in-memory MongoDB and points MONGODB_URI at it.
// dotenv (loaded later by config.js) never overrides an already-set var,
// so this URI wins while SECRET / STRIPE_SECRET still come from .env.
const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = async () => {
  const instance = await MongoMemoryServer.create();
  global.__MONGOINSTANCE = instance;
  process.env.MONGODB_URI = instance.getUri();
};
