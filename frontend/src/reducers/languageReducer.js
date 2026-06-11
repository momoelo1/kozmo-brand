import { createSlice } from "@reduxjs/toolkit";

export const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "IT", label: "Italiano" },
  { code: "FR", label: "Français" },
];

const languageSlice = createSlice({
  name: "language",
  initialState: "en",
  reducers: {
    setLanguage(state, action) {
      return action.payload;
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
