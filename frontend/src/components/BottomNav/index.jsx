import "./index.scss";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { removeUser } from "../../reducers/loggedUserReducer";
import { clearCart } from "../../reducers/cartReducer";
import { clearProducts } from "../../reducers/productsReducer";
import { setNotification } from "../../reducers/notificationReducer";

const TermsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const MediaIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94" />
  </svg>
);

const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BottomNav = () => {
  const loggedUser = useSelector((s) => s.loggedUser);
  const cart = useSelector((s) => s.cart);
  const currency = useSelector((s) => s.currency.selected);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPanel, setShowPanel] = useState(false);

  const cartCount = cart.reduce((t, i) => t + (i.quantity || 1), 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const path = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem("loggedUser");
    dispatch(removeUser());
    dispatch(clearCart());
    dispatch(clearProducts());
    dispatch(setNotification("You have been logged out.", "info"));
    setShowPanel(false);
    navigate("/");
  };

  useEffect(() => {
    if (!showPanel) return;
    const close = (e) => {
      if (!e.target.closest(".bnav-panel") && !e.target.closest(".bnav-account-btn")) {
        setShowPanel(false);
      }
    };
    document.addEventListener("touchstart", close);
    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("touchstart", close);
      document.removeEventListener("mousedown", close);
    };
  }, [showPanel]);

  useEffect(() => { setShowPanel(false); }, [path]);

  return (
    <>
      {loggedUser && (
        <div className={`bnav-panel${showPanel ? " is-open" : ""}`} role="menu" aria-hidden={!showPanel}>
          <div className="bnav-panel-user">
            <div className="bnav-panel-avatar" aria-hidden="true">
              {loggedUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="bnav-panel-identity">
              <span className="bnav-panel-name">{loggedUser.username}</span>
              {loggedUser.email && (
                <span className="bnav-panel-email">{loggedUser.email}</span>
              )}
              {loggedUser._id && (
                <span className="bnav-panel-id">
                  {String(loggedUser._id).slice(0, 8)}…{String(loggedUser._id).slice(-4)}
                </span>
              )}
            </div>
          </div>

          <div className="bnav-panel-cart">
            <span className="bnav-panel-cart-label">Cart</span>
            {cartCount > 0
              ? <span className="bnav-panel-cart-summary">{cartCount} {cartCount === 1 ? "item" : "items"} · {currency.symbol}{(cartTotal / 100 * currency.rate).toFixed(2)}</span>
              : <span className="bnav-panel-cart-empty">Empty</span>
            }
          </div>

          <button className="bnav-panel-logout" onClick={handleLogout} role="menuitem">
            Logout
          </button>
        </div>
      )}
      <nav className="bottom-nav" aria-label="Navigation">
        <Link
          className={`bnav-item${path === "/terms" ? " active" : ""}`}
          to="/terms"
          onClick={() => setShowPanel(false)}
        >
          <TermsIcon />
          <span>Terms</span>
        </Link>

        <Link
          className={`bnav-item${path === "/social" ? " active" : ""}`}
          to="/social"
          onClick={() => setShowPanel(false)}
        >
          <MediaIcon />
          <span>Media</span>
        </Link>

        <Link
          className={`bnav-item${path === "/cart" ? " active" : ""}`}
          to="/cart"
          onClick={() => setShowPanel(false)}
        >
          <span className="bnav-icon-wrap">
            <CartIcon />
            {cartCount > 0 && (
              <span className="bnav-badge" aria-label={`${cartCount} items in cart`}>
                {cartCount}
              </span>
            )}
          </span>
          <span>Cart</span>
        </Link>

        {loggedUser ? (
          <button
            className={`bnav-item bnav-account-btn${showPanel ? " active" : ""}`}
            onClick={() => setShowPanel((v) => !v)}
            aria-expanded={showPanel}
            aria-label="Account menu"
          >
            <UserIcon />
            <span className="bnav-label-truncate">{loggedUser.username}</span>
          </button>
        ) : (
          <Link
            className={`bnav-item${path === "/login" || path === "/subscribe" ? " active" : ""}`}
            to="/login"
          >
            <UserIcon />
            <span>Account</span>
          </Link>
        )}
      </nav>
    </>
  );
};

export default BottomNav;
