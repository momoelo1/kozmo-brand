import "./index.scss";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setLanguage, LANGUAGES } from "../../reducers/languageReducer";

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);

const LanguageSelector = () => {
  const lang = useSelector((state) => state.language);
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

  const current = LANGUAGES.find((l) => l.code.toLowerCase() === lang) || LANGUAGES[0];

  return (
    <div className="lang-selector" ref={ref}>
      <button
        className="lang-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Select language"
      >
        <span className="lang-globe"><GlobeIcon /></span>
        <span className="lang-code">{current.code}</span>
        <span className="lang-chevron" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="lang-dropdown" role="listbox">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={`lang-option${l.code.toLowerCase() === lang ? " active" : ""}`}
              onClick={() => { dispatch(setLanguage(l.code.toLowerCase())); setOpen(false); }}
              role="option"
              aria-selected={l.code.toLowerCase() === lang}
            >
              <span className="lang-option-code">{l.code}</span>
              <span className="lang-option-label">{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
