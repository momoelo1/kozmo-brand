import "./index.scss";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrency } from "../../reducers/currencyReducer";

const CurrencySelector = () => {
  const { selected: currency, available } = useSelector((state) => state.currency);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const handleSelect = (c) => {
    dispatch(setCurrency(c));
    setOpen(false);
  };

  return (
    <div className="currency-selector" ref={ref}>
      <button
        className="currency-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Select currency"
      >
        <span className="currency-symbol">{currency.symbol}</span>
        <span className="currency-code">{currency.code}</span>
        <span className="currency-chevron" aria-hidden="true">▾</span>
      </button>
      <div className={`currency-dropdown${open ? " is-open" : ""}`} role="listbox" aria-hidden={!open}>
        {available.map((c) => (
          <button
            key={c.code}
            className={`currency-option${c.code === currency.code ? " active" : ""}`}
            onClick={() => handleSelect(c)}
            role="option"
            aria-selected={c.code === currency.code}
          >
            <span className="currency-option-symbol">{c.symbol}</span>
            <span className="currency-option-code">{c.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CurrencySelector;