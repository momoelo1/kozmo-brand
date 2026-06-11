const bcrypt = require("bcrypt");
const loginRouter = require("express").Router();
const User = require("../models/User");
const { generateToken, storeRefreshToken, setCookies } = require("./auth");
const logger = require("../utils/logger");

loginRouter.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { accessToken, refreshToken } = generateToken(user._id);
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

      res.status(200).json({
        accessToken,
        _id: user._id,
        username: user.username,
        email: user.email,
        cartItems: user.cartItems,
      });
    } else {
      return res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = loginRouter;
