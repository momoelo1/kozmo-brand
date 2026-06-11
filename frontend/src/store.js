import { configureStore } from '@reduxjs/toolkit';
import loggedUserReducer from './reducers/loggedUserReducer';
import usersReducer from './reducers/usersReducer';
import cartReducer from './reducers/cartReducer';
import notificationReducer from './reducers/notificationReducer';
import productsReducer from './reducers/productsReducer';
import currencyReducer from './reducers/currencyReducer';

export const store = configureStore({
  reducer: {
    loggedUser: loggedUserReducer,
    users: usersReducer,
    cart: cartReducer,
    notification: notificationReducer,
    product: productsReducer,
    currency: currencyReducer,
  }
});
