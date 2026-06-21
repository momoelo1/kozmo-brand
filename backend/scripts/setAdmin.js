// Usage: node scripts/setAdmin.js <username>
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const run = async () => {
  const username = process.argv[2];
  if (!username) {
    console.error("Usage: node scripts/setAdmin.js <username>");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOneAndUpdate(
    { username },
    { isAdmin: true },
    { new: true },
  );
  console.log(user ? `${username} is now an admin` : `user not found: ${username}`);
  await mongoose.disconnect();
};

run();
