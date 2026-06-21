const jwt = require("jsonwebtoken");

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.SECRET, { expiresIn: "15m" });

const isProduction = process.env.NODE_ENV === "production";

const setCookies = (res, accessToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "strict",
    secure: isProduction,
    maxAge: 15 * 60 * 1000,
  });
};

module.exports = { generateToken, setCookies };