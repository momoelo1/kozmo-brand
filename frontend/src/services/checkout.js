import axiosInstance from './axios';

const createCheckoutSession = async () => {
  const response = await axiosInstance.post('/checkout/create-checkout-session');
  return response.data;
};

const createGuestCheckoutSession = async (items) => {
  const response = await axiosInstance.post('/checkout/create-checkout-session-guest', { items });
  return response.data;
};

export default { createCheckoutSession, createGuestCheckoutSession };