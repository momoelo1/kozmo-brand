import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./index.scss";

const SECTIONS = [
  {
    id: "help",
    label: "Help",
    links: ["Search", "Contact Us", "FAQs"],
  },
  {
    id: "info",
    label: "Info",
    links: ["Returns & Refunds", "Shipping", "About"],
  },
  {
    id: "legal",
    label: "Legal",
    links: ["Privacy Policy", "Terms of Service"],
  },
];

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const Terms = () => {
  const [cardReady, setCardReady] = useState(false);
  const navigate = useNavigate();
  const [isDesktop] = useState(() => window.innerWidth > 768);

  useEffect(() => {
    document.title = "Terms – KoZmo";
    if (isDesktop) navigate("/", { replace: true });
  }, [isDesktop, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setCardReady(true), 10);
    return () => clearTimeout(t);
  }, []);

  if (isDesktop) return null;

  return (
    <div className="terms-view">
      <div className={`terms-card${cardReady ? " card-ready" : ""}`}>
        <div className="terms-header">
          <h1 className="terms-heading">Information</h1>
          <p className="terms-sub">Help, policies & legal</p>
        </div>

        <div className="terms-sections">
          {SECTIONS.map((section, si) => (
            <div key={section.id} className="terms-section">
              {si > 0 && <div className="terms-divider" />}
              <h4 className="terms-section-heading">{section.label}</h4>
              <ul className="terms-list">
                {section.links.map((label) => (
                  <li key={label}>
                    <a href="#" className="terms-link">
                      <span>{label}</span>
                      <ChevronIcon />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Terms;
