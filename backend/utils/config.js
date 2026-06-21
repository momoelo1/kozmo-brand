require("dotenv").config();

// Vars the app cannot run correctly without. Validated at boot so we fail
// fast with a clear message instead of crashing later with obscure errors.
const REQUIRED_ENV = [
  "MONGODB_URI",
  "SECRET",
  "STRIPE_SECRET",
  "STRIPE_WEBHOOK_SECRET",
  "CLIENT_URL",
];

const validateEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `See .env.example for the full list.`,
    );
  }
};

// Tests provide their own minimal env (in-memory Mongo, mocked Stripe), so
// skip the strict boot check there.
if (process.env.NODE_ENV !== "test") {
  validateEnv();
}

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const SECRET = process.env.SECRET;

module.exports = {
  PORT,
  MONGODB_URI,
  SECRET,
};
