const bcrypt = require("bcrypt");
const userRouter = require("express").Router();
const User = require("../models/User");

const PASSWORD_RULES = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

userRouter.post("/", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: "username, email and password required" });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: "username must be at least 3 characters" });
  }

  if (!PASSWORD_RULES.test(password)) {
    return res.status(400).json({ error: "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character" });
  }

  const userExist = await User.findOne({ email });

  if (userExist) {
    return res.status(400).json({ error: "username and email must be unique" });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  const user = new User({ username, email, passwordHash });
  const savedUser = await user.save();

  res.status(201).json(savedUser);
});


module.exports = userRouter;
