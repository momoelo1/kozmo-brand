import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import loginService from "../../services/login";
import { setUser } from "../../reducers/loggedUserReducer";
import { setNotification } from "../../reducers/notificationReducer";
import { cartProducts } from "../../reducers/cartReducer";
import Notification from "../Notification";
import "./index.scss";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cardReady, setCardReady] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = "Login – AFD Milano";
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setCardReady(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const logUser = await loginService.login({ username, password });
      window.localStorage.setItem("loggedUser", JSON.stringify(logUser));
      dispatch(setUser(logUser));
      await dispatch(cartProducts());
      dispatch(setNotification("Successfully logged in!", "success"));
      const from = location.state?.from?.pathname || "/";
      navigate(from);
    } catch {
      dispatch(setNotification("Invalid username or password", "error"));
    }
  };

  return (
    <div className="auth-view">
      <Notification />
      <div className={`login-card${cardReady ? " card-ready" : ""}`}>
        <div className="login-header">
          <h1 className="login-heading">Welcome back</h1>
          <p className="login-sub">Sign in to your AFD account</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className="password-wrapper">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
          </div>

          <button type="submit" className="login-btn">Sign in</button>
        </form>

        <p className="login-register">
          No account yet?{" "}
          <Link to="/subscribe" className="login-register-link">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
