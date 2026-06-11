import "./App.scss";
import { useEffect, useCallback, lazy, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setUser, removeUser } from "./reducers/loggedUserReducer";
import { cartProducts, clearCart } from "./reducers/cartReducer";
import { setNotification } from "./reducers/notificationReducer";
import { clearProducts } from "./reducers/productsReducer";
import { fetchRates } from "./reducers/currencyReducer";
import Layout from "./components/Layout";
import Loader from "./components/Loader";

const Home = lazy(() => import("./components/Home"));
const Login = lazy(() => import("./components/Login"));
const Subscribe = lazy(() => import("./components/Subscribe"));
const Cart = lazy(() => import("./components/Cart"));
const Social = lazy(() => import("./components/Social"));
const Terms = lazy(() => import("./components/Terms"));
const Success = lazy(() => import("./components/Success"));

function App() {
  const loggedUser = useSelector((state) => state.loggedUser);
  const userCart = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const isLoginPage = location.pathname === "/login";
  const isSubscribePage = location.pathname === "/subscribe";
  const isSocialPage = location.pathname === "/social";
  const isTermsPage = location.pathname === "/terms";
  const isCardPage = isLoginPage || isSubscribePage || isSocialPage || isTermsPage;

  useEffect(() => {
    dispatch(fetchRates());
  }, [dispatch]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("payment") !== "success") return;
    const order = params.get("order");
    const msg = order
      ? `Payment confirmed — ${decodeURIComponent(order)}`
      : "Payment successful! Your order is confirmed.";
    dispatch(setNotification(msg, "success"));
    navigate("/", { replace: true });
  }, [location.search, dispatch, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (isCardPage) {
      document.body.classList.add("card-page");
    } else {
      document.body.classList.remove("card-page");
    }
    return () => document.body.classList.remove("card-page");
  }, [isCardPage]);

  // Vanta fog — dynamically imported so Three.js stays out of the initial bundle.
  useEffect(() => {
    const mobile = window.innerWidth <= 768;
    let vantaEffect = null;
    let resizeHandler = null;
    let cancelled = false;

    Promise.all([import("three"), import("vanta/src/vanta.fog")]).then(
      ([THREE, { default: FOG }]) => {
        if (cancelled) return;
        vantaEffect = FOG({
          THREE,
          el: "#root",
          mouseControls: !mobile,
          touchControls: mobile,
          gyroControls: false,
          minHeight: window.innerHeight,
          minWidth: window.innerWidth,
          highlightColor: 0xf0d9a0,
          midtoneColor: 0xf0d9a0,
          lowlightColor: 0xf0d9a0,
          baseColor: 0x12100a,
          blurFactor: 0.6,
          speed: mobile ? 1.5 : 1.9,
          zoom: mobile ? 0.8 : 1.2,
        });
        resizeHandler = () => vantaEffect?.resize();
        window.addEventListener("resize", resizeHandler);
      },
    );

    return () => {
      cancelled = true;
      if (vantaEffect) vantaEffect.destroy();
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  const handleLogout = useCallback((message) => {
    window.localStorage.removeItem("loggedUser");
    dispatch(removeUser());
    dispatch(clearCart());
    dispatch(clearProducts());
    dispatch(setNotification(message, "info"));
    navigate("/");
  }, [dispatch, navigate]);

  useEffect(() => {
    const checkSession = () => {
      const stored = window.localStorage.getItem("loggedUser");
      if (!stored) return;
      try {
        const user = JSON.parse(stored);
        if (
          user.tokenExpiration &&
          new Date(user.tokenExpiration) < new Date()
        ) {
          handleLogout("Your session has expired. Please log in again.");
          return;
        }
        dispatch(setUser(user));
        dispatch(cartProducts(user.cartItems));
      } catch {
        handleLogout("Session error. Please log in again.");
      }
    };

    checkSession();
    const intervalId = setInterval(checkSession, 60000);
    return () => clearInterval(intervalId);
  }, [dispatch, handleLogout]);

  return (
    <div
      className={`app-container ${isLoginPage ? "login-page" : ""} ${isSubscribePage ? "subscribe-page" : ""}`}
    >
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route
              path="/cart"
              element={<Cart user={loggedUser} cartProds={userCart} />}
            />
            <Route path="/social" element={<Social />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/success" element={<Success />} />
          </Route>
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
