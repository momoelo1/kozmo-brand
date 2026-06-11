import axiosInstance from './axios';

const getCartProds = async () => {
  const response = await axiosInstance.get('/cart');
  return response.data;
};

const postToCart = async (newObject) => {
  const response = await axiosInstance.post('/cart', newObject);
  return response.data;
};

const deleteFromCart = async (product) => {
  const response = await axiosInstance.delete('/cart', {
    data: product
  });
  return response.data;
};

const updateCartItem = async (itemId, quantity) => {
  const response = await axiosInstance.patch(`/cart/${itemId}`, { quantity });
  return response.data;
};

export default { getCartProds, postToCart, deleteFromCart, updateCartItem };
