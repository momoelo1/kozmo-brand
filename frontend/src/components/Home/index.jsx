import "./index.scss";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import Particles from "../../Backgrounds/Particles/Particles";
import ProductCard3D from "./ProductCard3D";

import { fetchProducts } from "../../services/products";
import Loader from "../Loader";
import instagramIcon from "../../images/instagram-icon.png";
import facebookIcon from "../../images/facebook-icon.png";
import tiktokIcon from "../../images/tic-toc-icon.png";


const ProductCardItem = ({ product, isMobile, onOpen, imageBack }) => {
  const [loaded, setLoaded] = useState(false);
  const currency = useSelector((state) => state.currency.selected);
  return (
    <ProductCard3D
      intensity={12}
      className={`product-card${loaded ? " card-ready" : ""}`}
      onClick={() => onOpen(product)}
    >
      <div className="card-image-area">
        {!loaded && <div className="card-img-loader"><Loader /></div>}
        {!isMobile && (
          <Particles
            particleCount={60}
            particleSpread={20}
            speed={0.15}
            particleColors={["#ffb84d", "#FFE3B0", "#FFE3B0"]}
            particleBaseSize={90}
            sizeRandomness={1.2}
            cameraDistance={45}
            disableRotation={false}
          />
        )}
        <img
          src={product.image}
          alt={product.name}
          className="product-card-img"
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
        {imageBack && (
          <img
            src={imageBack}
            alt=""
            className="product-card-img-back"
            aria-hidden="true"
            loading="lazy"
          />
        )}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">{currency.symbol}{(product.price * currency.rate).toFixed(2)}</p>
      </div>
    </ProductCard3D>
  );
};

const INFO_SECTIONS = [
  { id: "help", label: "Help", links: ["Search", "Contact Us", "FAQs"] },
  { id: "info", label: "Info", links: ["Returns & Refunds", "Shipping", "About"] },
  { id: "legal", label: "Legal", links: ["Privacy Policy", "Terms of Service"] },
];

const ChevronDown = () => (
  <svg viewBox="0 0 12 8" fill="none" aria-hidden="true">
    <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

import { postProduct, addLocalItem } from "../../reducers/cartReducer";
import { setNotification } from "../../reducers/notificationReducer";
import { setProducts as cacheProducts } from "../../reducers/productsReducer";
import Notification from "../Notification";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
};

const Home = () => {
  const dispatch = useDispatch();
  const loggedUser = useSelector((state) => state.loggedUser);
  const cachedProducts = useSelector((state) => state.product);
  const currency = useSelector((state) => state.currency.selected);
  const isMobile = useIsMobile();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const toggleSection = (id) => setActiveSection((v) => (v === id ? null : id));


  useEffect(() => {
    setPortalTarget(document.getElementById("home-left-sidebar"));
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [isModalOpen]);

  const cachedProductsRef = React.useRef(cachedProducts);

  useEffect(() => {
    const buildCategories = (list) => {
      const uniqueCategories = [...new Set(list.map((p) => p.category))];
      setCategories([
        { id: "all", name: "All Products" },
        ...uniqueCategories.map((cat) => ({
          id: cat,
          name: cat.charAt(0).toUpperCase() + cat.slice(1),
        })),
      ]);
    };

    const cached = cachedProductsRef.current;
    if (cached.length > 0) {
      setProducts(cached);
      setFilteredProducts(cached);
      buildCategories(cached);
      setLoading(false);
      return;
    }

    const loadProducts = async () => {
      try {
        setLoading(true);
        const productsData = await fetchProducts();
        const list = Array.isArray(productsData) ? productsData : [];
        dispatch(cacheProducts(list));
        setProducts(list);
        setFilteredProducts(list);
        buildCategories(list);
      } catch {
        setError("Failed to load products.");
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [dispatch]);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter((p) => p.category === selectedCategory),
      );
    }
  }, [selectedCategory, products]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
    setModalQuantity(1);
    setSelectedSize(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isModalClosing) return;
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalClosing(false);
      setSelectedProduct(null);
      setModalQuantity(1);
      setSelectedSize(null);
      setAddingToCart(false);
    }, 240);
  };

  const handleAddToCart = async (product) => {
    const hasSizes = product.sizes && product.sizes.length > 0;
    if (hasSizes && !selectedSize) return;

    setAddingToCart(true);

    if (loggedUser) {
      try {
        await dispatch(
          postProduct({
            productId: product.id,
            quantity: modalQuantity,
            size: selectedSize || undefined,
          }),
        );
        dispatch(setNotification(`✓ ${product.name} added to cart!`, "success"));
        setTimeout(() => handleCloseModal(), 500);
      } catch {
        dispatch(setNotification("Failed to add product. Please try again.", "error"));
        setAddingToCart(false);
      }
    } else {
      dispatch(addLocalItem({ product, quantity: modalQuantity, size: selectedSize }));
      dispatch(setNotification(`✓ ${product.name} added to cart!`, "success"));
      setTimeout(() => handleCloseModal(), 500);
    }
  };

  const leftSidebarContent = (
    <div className="sidebar-accordion">

      <div className="accordion-item">
        <button
          className={`accordion-btn${activeSection === "terms" ? " open" : ""}`}
          onClick={() => toggleSection("terms")}
          aria-expanded={activeSection === "terms"}
        >
          <span>Terms</span>
          <ChevronDown />
        </button>
        <div className={`accordion-body${activeSection === "terms" ? " open" : ""}`}>
          {INFO_SECTIONS.map((section) => (
            <div key={section.id} className="accordion-info-group">
              <p className="accordion-info-heading">{section.label}</p>
              {section.links.map((label) => (
                <a key={label} href="#" className="accordion-info-link">{label}</a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="accordion-item">
        <button
          className={`accordion-btn${activeSection === "social" ? " open" : ""}`}
          onClick={() => toggleSection("social")}
          aria-expanded={activeSection === "social"}
        >
          <span>Social</span>
          <ChevronDown />
        </button>
        <div className={`accordion-body${activeSection === "social" ? " open" : ""}`}>
          <div className="accordion-social-row">
            <a href="https://instagram.com/afd.milano" className="sidebar-pill-btn instagram-pill" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <img src={instagramIcon} alt="Instagram" />
            </a>
            <a href="https://tiktok.com/@afd.milano" className="sidebar-pill-btn tiktok-pill" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <img src={tiktokIcon} alt="TikTok" />
            </a>
            <a href="https://facebook.com" className="sidebar-pill-btn facebook-pill" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <img src={facebookIcon} alt="Facebook" />
            </a>
          </div>
        </div>
      </div>

    </div>
  );

  const hasSizes = selectedProduct?.sizes && selectedProduct.sizes.length > 0;
  const canAddToCart = !hasSizes || selectedSize;

  return (
    <>
      <div className="homeCont">
        <Notification />
        {portalTarget && createPortal(leftSidebarContent, portalTarget)}
        <div className="home-main-row">
          <div className="main-content-area">
            <div className="mobile-category-strip" role="tablist" aria-label="Product categories">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === category.id}
                  className={`mobile-cat-btn${selectedCategory === category.id ? " active" : ""}`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <div className="products-container">
              <div className={`products-grid-container${isModalOpen ? " modal-is-open" : ""}`}>
                {loading ? (
                  <div className="products-grid">
                    <Loader />
                  </div>
                ) : error ? (
                  <div className="products-grid">
                    <div className="home-error">
                      <h3>Error loading products</h3>
                      <p>Please try refreshing the page.</p>
                    </div>
                  </div>
                ) : (
                  <div className="products-grid">
                    {filteredProducts.map((product) => (
                      <ProductCardItem
                        key={product.id}
                        product={product}
                        isMobile={isMobile}
                        onOpen={handleOpenProduct}
                        imageBack={product.imageBack}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {(isModalOpen || isModalClosing) && selectedProduct && createPortal(
        <div
          className={`modal${isModalClosing ? " closing" : ""}`}
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Close modal">×</button>
            <div className="modal-image">
              <img src={selectedProduct.image} alt={selectedProduct.name} />
            </div>
            <div className="modal-info">
              <h2 className="modal-title">{selectedProduct.name}</h2>
              {selectedProduct.description && (
                <p className="modal-description">
                  {selectedProduct.description}
                </p>
              )}
              {selectedProduct.price != null && (
                <div className="modal-price">{currency.symbol}{(selectedProduct.price * currency.rate).toFixed(2)}</div>
              )}

              {hasSizes && (
                <div className="modal-size-selector">
                  <label className="modal-size-label" htmlFor="modal-size-select">Size</label>
                  <select
                    id="modal-size-select"
                    className="modal-size-select"
                    value={selectedSize || ""}
                    onChange={(e) => setSelectedSize(e.target.value || null)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">Select a size</option>
                    {selectedProduct.sizes.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="modal-quantity-controls">
                <button
                  className="modal-qty-btn"
                  onClick={(e) => { e.stopPropagation(); setModalQuantity(q => Math.max(1, q - 1)); }}
                  aria-label="Decrease quantity"
                >−</button>
                <span className="modal-qty-value">{modalQuantity}</span>
                <button
                  className="modal-qty-btn"
                  onClick={(e) => { e.stopPropagation(); setModalQuantity(q => q + 1); }}
                  aria-label="Increase quantity"
                >+</button>
              </div>
              <button
                className="modal-add-to-cart-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(selectedProduct);
                }}
                disabled={addingToCart || !canAddToCart}
              >
                {addingToCart ? "Adding…" : hasSizes && !selectedSize ? "Select a size" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Home;
