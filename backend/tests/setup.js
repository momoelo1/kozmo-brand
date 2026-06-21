// Per-test-file hooks. The in-memory MongoDB and MONGODB_URI are set up in
// globalSetup.js before any module (including app.js) is imported.
const mongoose = require("mongoose");

afterEach(async () => {
  // Wipe all collections between tests for isolation.
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});
