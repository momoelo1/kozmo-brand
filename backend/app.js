const config = require("./utils/config");
const express = require("express");
const app = express();
require("express-async-errors");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const userRouter = require("./controllers/users");
const loginRouter = require("./controllers/login");
const productRouter = require("./controllers/product");
const cartRouter = require("./controllers/cart");
const checkoutRouter = require("./controllers/checkout");
const middleware = require("./utils/middleware");
const logger = require("./utils/logger");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
mongoose.set("strictQuery", false);

logger.info("connecting to ", config.MONGODB_URI);

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info("connected to mongoDB");
  })
  .catch((e) => {
    logger.error("error connecting to mongoDB", e);
    process.exit(1);
  });

const toOrigin = (url) => {
  try { return new URL(url).origin; } catch { return null; }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowed = [process.env.CLIENT_URL, process.env.CLIENT_URL_ALT]
        .filter(Boolean)
        .map(toOrigin)
        .filter(Boolean);

      if (allowed.includes(origin)) return callback(null, true);
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
      if (/^http:\/\/(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+:5173$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }),
);

// Security middlewares
app.use(helmet());
// Stripe webhook needs raw bytes — must come before express.json()
app.use("/api/checkout/webhook", express.raw({ type: "application/json" }));
app.use(
  express.json({
    limit: "10kb",
  }),
);
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);
app.use(middleware.requestLogger);

app.use(cookieParser());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/cart", cartRouter);
app.use("/api/users", userRouter);
app.use("/api/login", loginRouter);
app.use("/api/products", productRouter);
app.use("/api/checkout", checkoutRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
