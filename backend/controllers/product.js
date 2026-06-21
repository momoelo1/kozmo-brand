const productRouter = require("express").Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const logger = require("../utils/logger");
const { tokenExtractor, adminOnly } = require("../utils/middleware");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const adminGuard = [tokenExtractor, adminOnly];

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new Error("only image files are allowed")),
});

let productCache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

const invalidateCache = () => {
  productCache = null;
  cacheTime = 0;
};

const toCents = (euros) => Math.round(Number(euros) * 100);

productRouter.get("/", async (req, res) => {
  const now = Date.now();
  if (productCache && now - cacheTime < CACHE_TTL) {
    return res.json(productCache);
  }

  try {
    const products = await stripe.products.list({
      limit: 100,
      expand: ["data.default_price"],
    });

    const activeProds = products.data.filter(
      (product) => product.active === true
    );

    const groupedProducts = activeProds.reduce((acc, product) => {
      const category = product.metadata.category || 'uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});

    const result = {
      categories: Object.keys(groupedProducts),
      groupedProducts,
      allProducts: activeProds,
    };
    productCache = result;
    cacheTime = now;
    res.json(result);
  } catch (err) {
    logger.error("products error:", err);
    res.status(500).json({ error: "failed to get products" });
  }
});


productRouter.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const products = await stripe.products.search({
      query: `active:'true' AND metadata['category']:'${category}'`,
      expand: ["data.default_price"],
    });

    res.json(products.data);
  } catch (err) {
    logger.error("products error:", err);
    res.status(500).json({ error: "failed to get products by category" });
  }
});

// Get all available categories
productRouter.get("/categories", async (req, res) => {
  try {
    const products = await stripe.products.list({
      limit: 100,
      expand: ["data.default_price"],
    });

    const categories = [...new Set(
      products.data
        .filter(product => product.active)
        .map(product => product.metadata.category || 'uncategorized')
    )];

    res.json(categories);
  } catch (err) {
    logger.error("products error:", err);
    res.status(500).json({ error: "failed to get categories" });
  }
});


productRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await stripe.products.retrieve(id, {
      expand: ["default_price"],
    });

    res.json(product);
  } catch (err) {
    logger.error("products error:", err);
    res.status(500).json({ error: "failed to get product" });
  }
});

// CREATE a product with an initial price
productRouter.post("/", adminGuard, async (req, res) => {
  try {
    const { name, description, category = "uncategorized", sizes = "", images = [], priceEuros } = req.body;
    if (!name || priceEuros == null) {
      return res.status(400).json({ error: "name and priceEuros are required" });
    }
    const unit_amount = toCents(priceEuros);
    if (!Number.isInteger(unit_amount) || unit_amount <= 0) {
      return res.status(400).json({ error: "invalid price" });
    }

    const product = await stripe.products.create({
      name,
      ...(description && { description }),
      images: Array.isArray(images) ? images.filter(Boolean).slice(0, 8) : [],
      metadata: { category, sizes: Array.isArray(sizes) ? sizes.join(",") : sizes },
    });

    const price = await stripe.prices.create({ product: product.id, unit_amount, currency: "eur" });
    const updated = await stripe.products.update(product.id, { default_price: price.id });

    invalidateCache();
    res.status(201).json(updated);
  } catch (err) {
    logger.error("create product error:", err);
    res.status(400).json({ error: "failed to create product", details: err.message });
  }
});

// UPDATE product fields (not price)
productRouter.patch("/:id", adminGuard, async (req, res) => {
  try {
    const { name, description, category, sizes, images, active } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (images !== undefined) update.images = Array.isArray(images) ? images.filter(Boolean).slice(0, 8) : [];
    if (active !== undefined) update.active = !!active;

    const metadata = {};
    if (category !== undefined) metadata.category = category;
    if (sizes !== undefined) metadata.sizes = Array.isArray(sizes) ? sizes.join(",") : sizes;
    if (Object.keys(metadata).length) update.metadata = metadata;

    const product = await stripe.products.update(req.params.id, update);
    invalidateCache();
    res.json(product);
  } catch (err) {
    logger.error("update product error:", err);
    res.status(400).json({ error: "failed to update product", details: err.message });
  }
});

// CHANGE price — Stripe prices are immutable, so create a new one and set it as default
productRouter.post("/:id/price", adminGuard, async (req, res) => {
  try {
    const unit_amount = toCents(req.body.priceEuros);
    if (!Number.isInteger(unit_amount) || unit_amount <= 0) {
      return res.status(400).json({ error: "invalid price" });
    }
    const price = await stripe.prices.create({ product: req.params.id, unit_amount, currency: "eur" });
    const product = await stripe.products.update(req.params.id, { default_price: price.id });

    // Stripe prices can't be deleted — archive every other active price so the
    // product is left with only the new one (also cleans up past duplicates).
    const existing = await stripe.prices.list({ product: req.params.id, active: true, limit: 100 });
    await Promise.all(
      existing.data
        .filter((p) => p.id !== price.id)
        .map((p) => stripe.prices.update(p.id, { active: false })),
    );

    invalidateCache();
    res.json(product);
  } catch (err) {
    logger.error("price change error:", err);
    res.status(400).json({ error: "failed to change price", details: err.message });
  }
});

// UPLOAD a product image to Cloudinary, returns the hosted URL
productRouter.post("/upload-image", tokenExtractor, adminOnly, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "no image provided" });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "kozmo/products" },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded)),
      );
      stream.end(req.file.buffer);
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    logger.error("image upload error:", err);
    res.status(400).json({ error: "failed to upload image", details: err.message });
  }
});

// ARCHIVE (soft-delete) a product
productRouter.delete("/:id", adminGuard, async (req, res) => {
  try {
    const product = await stripe.products.update(req.params.id, { active: false });
    invalidateCache();
    res.json(product);
  } catch (err) {
    logger.error("archive product error:", err);
    res.status(400).json({ error: "failed to archive product", details: err.message });
  }
});

module.exports = productRouter;
