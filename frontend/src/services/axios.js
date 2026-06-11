import axios from "axios";
import { store } from "../store";
import { removeUser } from "../reducers/loggedUserReducer";
import { setNotification } from "../reducers/notificationReducer";
import { clearCart } from "../reducers/cartReducer";
import { clearProducts } from "../reducers/productsReducer";

const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || "/api";
};

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  try {
    const stored = window.localStorage.getItem("loggedUser");
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.accessToken) {
        config.headers.Authorization = `Bearer ${user.accessToken}`;
      }
    }
  } catch {}
  return config;
});

// Create a function to handle logout
const handleLogout = (message) => {
  window.localStorage.removeItem("loggedUser");
  store.dispatch(removeUser());
  store.dispatch(clearCart());
  store.dispatch(clearProducts());
  store.dispatch(setNotification(message, "info"));
  window.location.hash = "#/";
};

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/login");
    if (
      !isLoginRequest &&
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      handleLogout("Your session has expired. Please log in again.");
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
