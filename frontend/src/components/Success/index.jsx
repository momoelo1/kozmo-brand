import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setNotification } from "../../reducers/notificationReducer";
import Notification from "../Notification";
import "./index.scss";

const Success = () => {
  const [cardReady, setCardReady] = useState(false);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const dispatch = useDispatch();

  useEffect(() => {
    document.title = "Order Confirmed – AFD Milano";
    dispatch(setNotification("Payment successful! Your order is confirmed.", "success"));
  }, [dispatch]);

  useEffect(() => {
    const t = setTimeout(() => setCardReady(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="success-view">
      <Notification />
      <div className={`success-card${cardReady ? " card-ready" : ""}`}>
        <div className="success-icon-wrap">
          <svg className="success-icon" viewBox="0 0 52 52" fill="none" aria-hidden="true">
            <circle cx="26" cy="26" r="25" stroke="#ffb84d" strokeWidth="1.5" />
            <path d="M15 26.5l8 8 14-16" stroke="#ffb84d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="success-header">
          <h1 className="success-heading">Order Confirmed</h1>
          <p className="success-sub">Thank you for your purchase.</p>
        </div>

        {sessionId && (
          <p className="success-ref">
            Ref: <span>{sessionId.slice(-12).toUpperCase()}</span>
          </p>
        )}

        <p className="success-note">
          You will receive a confirmation email shortly. If you have any questions, contact us via the social channels.
        </p>

        <Link to="/" className="success-btn">
          Back to Shop
        </Link>
      </div>
    </div>
  );
};

export default Success;
