import "./index.scss";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  cartProducts,
  updateProduct,
  deleteProduct,
  updateLocalQuantity,
  removeLocalItem,
} from "../../reducers/cartReducer";
import { setNotification } from "../../reducers/notificationReducer";
import checkout from "../../services/checkout";
import Notification from "../Notification";

const MIN_QTY = 1;
const MAX_QTY = 10;

const Cart = ({ user, cartProds }) => {
  const [total, setTotal] = useState(0);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const dispatch = useDispatch();
  const currency = useSelector((state) => state.currency.selected);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.title = "Cart – AFD Milano";
  }, []);

  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      dispatch(setNotification("Payment cancelled. Your cart is still saved.", "error"));
    }
  }, [dispatch, searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setCardReady(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const cartTotal = cartProds.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotal(cartTotal);
  }, [cartProds]);

  const handleQuantityChange = async (prod, delta) => {
    const newQty = Math.min(MAX_QTY, Math.max(MIN_QTY, prod.quantity + delta));
    if (newQty === prod.quantity) return;
    if (user) {
      try {
        await dispatch(updateProduct(prod.id, newQty));
        dispatch(cartProducts());
      } catch {
        dispatch(setNotification("Failed to update cart", "error"));
      }
    } else {
      dispatch(updateLocalQuantity({ id: prod.id, quantity: newQty }));
    }
  };

  const handleDelete = async (prod) => {
    if (user) {
      try {
        await dispatch(deleteProduct({ productId: prod.productId }));
        dispatch(cartProducts());
        dispatch(setNotification(`${prod.name} removed from cart`, "success"));
      } catch {
        dispatch(setNotification("Failed to remove item", "error"));
      }
    } else {
      dispatch(removeLocalItem(prod.id));
      dispatch(setNotification(`${prod.name} removed from cart`, "success"));
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      if (user) {
        const { url } = await checkout.createCheckoutSession();
        window.location.href = url;
      } else {
        const { url } = await checkout.createGuestCheckoutSession(cartProds);
        window.location.href = url;
      }
    } catch {
      dispatch(setNotification("Failed to initiate checkout", "error"));
      setCheckingOut(false);
    }
  };

  return (
    <>
      <Notification />
      <div className="cart-view">
        <div className={`cart-card${cardReady ? " card-ready" : ""}`}>
          <div className="cart-header">
            <h1 className="cart-heading">Your Cart</h1>
            {cartProds.length > 0 && (
              <p className="cart-sub">{cartProds.length} {cartProds.length === 1 ? "item" : "items"}</p>
            )}
          </div>

          {cartProds.length === 0 ? (
            <p className="cart-empty">Your cart is empty.</p>
          ) : (
            <>
              <div className="cart-items">
                {cartProds.map((prod) => (
                  <div key={prod.id} className="cart-item">
                    <div className="cart-item-image">
                      <img src={prod.img} alt={prod.name} />
                    </div>
                    <div className="cart-item-info">
                      <h3 className="cart-item-name">{prod.name}</h3>
                      {prod.size && <p className="cart-item-size">Size: {prod.size}</p>}
                      {prod.desc && <p className="cart-item-desc">{prod.desc}</p>}
                    </div>
                    <div className="cart-item-controls">
                      <div className="cart-qty">
                        <button
                          className="cart-qty-btn"
                          onClick={() => handleQuantityChange(prod, -1)}
                          disabled={prod.quantity <= MIN_QTY}
                          aria-label="Decrease quantity"
                        >−</button>
                        <span className="cart-qty-value">{prod.quantity}</span>
                        <button
                          className="cart-qty-btn"
                          onClick={() => handleQuantityChange(prod, 1)}
                          disabled={prod.quantity >= MAX_QTY}
                          aria-label="Increase quantity"
                        >+</button>
                      </div>
                      <p className="cart-item-price">{currency.symbol}{(prod.price / 100 * currency.rate).toFixed(2)}</p>
                      <button
                        className="cart-item-delete"
                        onClick={() => handleDelete(prod)}
                        aria-label={`Remove ${prod.name}`}
                      >Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-footer">
                <div className="cart-total">
                  <span className="cart-total-label">Total</span>
                  <span className="cart-total-value">{currency.symbol}{(total / 100 * currency.rate).toFixed(2)}</span>
                </div>
                <button
                  className="cart-checkout-btn"
                  onClick={handleCheckout}
                  disabled={checkingOut}
                >
                  {checkingOut ? "Redirecting…" : "Proceed to Checkout"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Cart;
