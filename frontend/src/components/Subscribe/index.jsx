import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { setNotification } from "../../reducers/notificationReducer";
import { createUser } from "../../reducers/usersReducer";
import Notification from "../Notification";
import "./index.scss";

const Subscribe = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Sign Up – KoZmo";
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setCardReady(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const passwordValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);

  const addUser = async (e) => {
    e.preventDefault();
    if (!passwordValid) {
      dispatch(setNotification("Password does not meet the requirements below", "error"));
      return;
    }
    try {
      await dispatch(createUser({ username, email, password }));
      navigate("/login");
      dispatch(setNotification("Account created — you can now log in", "success"));
    } catch {
      dispatch(setNotification("Username or email already in use", "error"));
      setUsername("");
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="auth-view subscribe-view">
      <Notification />
      <div className={`login-card${cardReady ? " card-ready" : ""}`}>
        <div className="login-header">
          <h1 className="login-heading">Create account</h1>
          <p className="login-sub">Join KoZmo</p>
        </div>

        <form onSubmit={addUser} className="login-form">
          <div className="login-field">
            <label htmlFor="sub-username">Username</label>
            <input
              id="sub-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="sub-email">Email</label>
            <input
              id="sub-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="sub-password">Password</label>
            <div className="password-wrapper">
              <input
                id="sub-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "hide" : "show"}
              </button>
            </div>
            <p className="password-hint">Min 8 characters · uppercase &amp; lowercase · a number · a special character (!@#$%…)</p>
          </div>

          <button type="submit" className="login-btn">Create account</button>
        </form>

        <p className="login-register">
          Already have an account?{" "}
          <Link to="/login" className="login-register-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Subscribe;
