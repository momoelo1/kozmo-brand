import { createSlice } from "@reduxjs/toolkit";

const BASE_CURRENCIES = [
  { code: "EUR", symbol: "€" },
  { code: "USD", symbol: "$" },
  { code: "GBP", symbol: "£" },
];

const FALLBACK_RATES = { EUR: 1, USD: 1.08, GBP: 0.85 };

const buildList = (rates) =>
  BASE_CURRENCIES.map((c) => ({ ...c, rate: rates[c.code] ?? FALLBACK_RATES[c.code] }));

const currencySlice = createSlice({
  name: "currency",
  initialState: {
    selected: { code: "EUR", symbol: "€", rate: 1 },
    available: buildList(FALLBACK_RATES),
  },
  reducers: {
    setCurrency(state, action) {
      state.selected = action.payload;
    },
    setRates(state, action) {
      const rates = { EUR: 1, ...action.payload };
      state.available = buildList(rates);
      const match = state.available.find((c) => c.code === state.selected.code);
      if (match) state.selected = match;
    },
  },
});

export const { setCurrency, setRates } = currencySlice.actions;

export const fetchRates = () => async (dispatch) => {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=USD,GBP");
    const data = await res.json();
    dispatch(setRates(data.rates));
  } catch {
    // keep fallback rates silently
  }
};

export default currencySlice.reducer;
