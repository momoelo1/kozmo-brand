import { createSlice } from "@reduxjs/toolkit";
import cartService from "../services/cart";

const cartSlice = createSlice({
  name: "cart",
  initialState: [],
  reducers: {
    getProducts(state, action) {
      return action.payload;
    },
    addProduct(state, action) {
      return action.payload;
    },
    removeProduct(state, action) {
      return action.payload;
    },
    clearCart() {
      return [];
    },
    addLocalItem(state, action) {
      const { product, quantity, size } = action.payload;
      const sizeKey = size || null;
      const existing = state.find(
        (item) => item.productId === product.id && item.size === sizeKey
      );
      if (existing) {
        return state.map((item) =>
          item.productId === product.id && item.size === sizeKey
            ? { ...item, quantity: Math.min(10, item.quantity + quantity) }
            : item
        );
      }
      return [
        ...state,
        {
          id: `local-${Date.now()}`,
          productId: product.id,
          name: product.name,
          desc: product.description || "",
          img: product.image || "",
          quantity,
          price: Math.round(product.price * 100),
          category: product.category || "uncategorized",
          size: sizeKey,
          isLocal: true,
        },
      ];
    },
    updateLocalQuantity(state, action) {
      const { id, quantity } = action.payload;
      if (quantity <= 0) return state.filter((item) => item.id !== id);
      return state.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
    },
    removeLocalItem(state, action) {
      return state.filter((item) => item.id !== action.payload);
    },
  },
});

export const {
  getProducts,
  addProduct,
  removeProduct,
  clearCart,
  addLocalItem,
  updateLocalQuantity,
  removeLocalItem,
} = cartSlice.actions;

export const cartProducts = () => {
  return async (dispatch) => {
    const products = await cartService.getCartProds();
    dispatch(getProducts(products));
  };
};

export const postProduct = (content) => {
  return async (dispatch) => {
    const prodToCart = await cartService.postToCart(content);
    dispatch(addProduct(prodToCart));
  };
};

export const deleteProduct = (productId) => {
  return async (dispatch) => {
    const updatedCart = await cartService.deleteFromCart(productId);
    dispatch(removeProduct(updatedCart));
  };
};

export const updateProduct = (itemId, quantity) => {
  return async (dispatch) => {
    const updatedCart = await cartService.updateCartItem(itemId, quantity);
    dispatch(getProducts(updatedCart));
  };
};

export default cartSlice.reducer;
