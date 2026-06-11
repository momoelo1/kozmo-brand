import { useSelector } from "react-redux";
import { createPortal } from "react-dom";
import "./index.scss";

const Notification = ({ className = "" }) => {
  const notification = useSelector((state) => state.notification);

  if (notification.message) {
    return createPortal(
      <div className={`${notification.type === "success" ? "valid" : "error"} ${className}`}>
        <h2>{notification.message}</h2>
      </div>,
      document.body
    );
  }

  return null;
};

export default Notification;
