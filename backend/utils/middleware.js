const jwt = require("jsonwebtoken");
const logger = require("./logger");
const User = require("../models/User");

const getTokenFrom = async (req) => {
  const accessCookie = req.cookies?.accessToken;
  const authHeader = req.headers?.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const token = accessCookie || bearerToken;

  if (!token) {
    return null;
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);

    if (!decodedToken || !decodedToken.userId) {
      return null;
    }

    const user = await User.findById(decodedToken.userId);
    return user || null;
  } catch (error) {
    logger.error("Failed to verify access token", error);
    return null;
  }
};

const requestLogger = (req, res, next) => {
  logger.info("Method:", req.method, "Path:", req.path);
  next();
};

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (error, req, res, next) => {
  if (error.name === "CastError") {
    return res.status(400).send({ error: error.message });
  } else if (error.name === "ValidationError") {
    res.status(400).json({ error: error.message });
  } else if (
    error.name === "MongoServerError" &&
    error.message.includes("E11000 duplicate key error")
  ) {
    return res.status(400).json({ error });
  } else if (error.name === "JsonWebTokenError") {
    return res.status(401).json({ error });
  }

  next(error);
};

const tokenExtractor = async (req, res, next) => {
  const user = await getTokenFrom(req);

  if (!user) {
    return res.status(401).json({ error: "authentication required" });
  }

  req.user = user;
  next();
};

// Optional token extractor - doesn't fail if no token, just sets req.user to null
const optionalTokenExtractor = async (req, res, next) => {
  const user = await getTokenFrom(req);
  req.user = user || null;
  next();
};

// A user is an admin if the DB flag is set OR their username is in the
// ADMIN_USERNAMES env allowlist (comma-separated). The allowlist grants admin
// without touching the DB; set it in .env and on the host (e.g. Render).
const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || "")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);

const isAdminUser = (user) =>
  !!user && (user.isAdmin || ADMIN_USERNAMES.includes(user.username));

// Requires an authenticated admin. Must run AFTER tokenExtractor.
const adminOnly = (req, res, next) => {
  if (!isAdminUser(req.user)) {
    return res.status(403).json({ error: "admin access required" });
  }
  next();
};

module.exports = {
  requestLogger,
  errorHandler,
  unknownEndpoint,
  tokenExtractor,
  optionalTokenExtractor,
  adminOnly,
  isAdminUser,
  getTokenFrom,
};
