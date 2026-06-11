const { MongoClient } = require("mongodb");
const config = require('../utils/config');
const logger = require('../utils/logger');

const client = new MongoClient(config.MONGODB_URI);

let db;

const connectDB = async () => {
  if (!db) {
    await client.connect();
    db = client.db("authDB");
    logger.info("MongoDB Connected");
  }
  return db;
};

module.exports = connectDB
