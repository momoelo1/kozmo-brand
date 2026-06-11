import "./index.scss";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { removeUser } from "../../reducers/loggedUserReducer";
import { clearCart } from "../../reducers/cartReducer";
import { clearProducts } from "../../reducers/productsReducer";
import { setNotification } from "../../reducers/notificationReducer";
import CurrencySelector from "../CurrencySelector";
import userIcon from "../../images/user-icon.png";
import carrelloIcon from "../../images/carrello-icon.png";
import kozmoLogoSrc from "../../images/kozmo-logo.png";

const Sidebar = () => {
  const loggedUser = useSelector((state) => state.loggedUser);
  const cart = useSelector((state) => state.cart);
  const currency = useSelector((state) => state.currency.selected);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const cartItemsCount = cart.reduce(
    (total, item) => total + (item.quantity || 1),
    0,
  );
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleLogout = () => {
    window.localStorage.removeItem("loggedUser");
    dispatch(removeUser());
    dispatch(clearCart());
    dispatch(clearProducts());
    dispatch(setNotification("You have been logged out.", "info"));
    setShowUserMenu(false);
    navigate("/");
  };

  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest(".navbar-user")) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  return (
    <nav className="navbar">
      <Link className="navbar-logo" to="/" aria-label="Home">
        <svg
          viewBox="0 -50 598 700"
          xmlns="http://www.w3.org/2000/svg"
          className="navbar-svg-logo"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="afd-nav-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#ffb84d" stopOpacity="0.32" />
              <stop offset="0.5" stopColor="#ffb84d" stopOpacity="0.08" />
              <stop offset="0.72" stopColor="#ffb84d" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse
            cx="299"
            cy="300"
            rx="300"
            ry="300"
            fill="url(#afd-nav-glow)"
          />
          <image href={kozmoLogoSrc} x="0" y="0" width="598" height="600" />
        </svg>
      </Link>

      <div className="navbar-actions">
        <CurrencySelector />

        <Link className="navbar-icon-btn" to="/cart" aria-label="Cart">
          <img src={carrelloIcon} alt="Cart" />
          {cartItemsCount > 0 && (
            <span className="cart-badge">{cartItemsCount}</span>
          )}
        </Link>

        <div className="navbar-user">
          {loggedUser ? (
            <>
              <button
                className="navbar-icon-btn logged-in"
                onClick={() => setShowUserMenu((v) => !v)}
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                <img src={userIcon} alt="User" />
              </button>
              <div className={`user-menu${showUserMenu ? " is-open" : ""}`} role="menu" aria-hidden={!showUserMenu}>
                  <div className="user-menu-header">
                    <div className="user-menu-avatar" aria-hidden="true">
                      {loggedUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-menu-identity">
                      <p className="user-menu-name">{loggedUser.username}</p>
                      {loggedUser.email && (
                        <p className="user-menu-email">{loggedUser.email}</p>
                      )}
                      {loggedUser._id && (
                        <p className="user-menu-id">
                          {String(loggedUser._id).slice(0, 8)}…
                          {String(loggedUser._id).slice(-4)}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    to="/cart"
                    className="user-menu-cart-section"
                    onClick={() => setShowUserMenu(false)}
                    role="menuitem"
                  >
                    <div className="user-menu-cart-top">
                      <span className="user-menu-cart-label">Cart</span>
                      {cartItemsCount > 0 ? (
                        <span className="user-menu-cart-summary">
                          {cartItemsCount}{" "}
                          {cartItemsCount === 1 ? "item" : "items"} ·{" "}
                          {currency.symbol}
                          {((cartTotal / 100) * currency.rate).toFixed(2)}
                        </span>
                      ) : (
                        <span className="user-menu-cart-empty">Empty</span>
                      )}
                    </div>
                    {cartItemsCount > 0 && (
                      <div className="user-menu-cart-items">
                        {cart.slice(0, 2).map((item) => (
                          <span key={item.id} className="user-menu-cart-item">
                            · {item.name}
                          </span>
                        ))}
                        {cart.length > 2 && (
                          <span className="user-menu-cart-more">
                            +{cart.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </Link>

                  <button
                    className="user-menu-logout"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
            </>
          ) : (
            <Link className="navbar-icon-btn" to="/login" aria-label="Login">
              <img src={userIcon} alt="Login" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
