import { createSlice } from "@reduxjs/toolkit";

const productSlice = createSlice({
  name: "product",
  initialState: [],
  reducers: {
    setProducts(state, action) {
      return action.payload;
    },
    clearProducts() {
      return [];
    }
  },
});

export const { setProducts, clearProducts } = productSlice.actions;
export default productSlice.reducer;
