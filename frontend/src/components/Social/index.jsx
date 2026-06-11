import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import instagramIcon from "../../images/instagram-icon.png";
import facebookIcon from "../../images/facebook-icon.png";
import tiktokIcon from "../../images/tic-toc-icon.png";
import "./index.scss";

const platforms = [
  {
    name: "Instagram",
    handle: "@kozmo.brand",
    url: "https://instagram.com/kozmo.brand",
    icon: instagramIcon,
  },
  {
    name: "TikTok",
    handle: "@kozmo.brand",
    url: "https://tiktok.com/@kozmo.brand",
    icon: tiktokIcon,
  },
  {
    name: "Facebook",
    handle: "KoZmo",
    url: "https://facebook.com",
    icon: facebookIcon,
  },
];

const Social = () => {
  const [cardReady, setCardReady] = useState(false);
  const navigate = useNavigate();
  const [isDesktop] = useState(() => window.innerWidth > 768);

  useEffect(() => {
    document.title = "Social – KoZmo";
    if (isDesktop) navigate("/", { replace: true });
  }, [isDesktop, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setCardReady(true), 10);
    return () => clearTimeout(t);
  }, []);

  if (isDesktop) return null;

  return (
    <div className="social-view">
      <div className={`social-card${cardReady ? " card-ready" : ""}`}>
        <div className="social-header">
          <h1 className="social-heading">Follow Us</h1>
          <p className="social-sub">Stay connected with KoZmo</p>
        </div>

        <div className="social-links">
          {platforms.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
            >
              <img src={p.icon} alt={p.name} className="social-link-icon" />
              <div className="social-link-text">
                <span className="social-link-name">{p.name}</span>
                <span className="social-link-handle">{p.handle}</span>
              </div>
              <svg
                className="social-link-chevron"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Social;
