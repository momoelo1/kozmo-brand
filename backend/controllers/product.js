const productRouter = require("express").Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const logger = require("../utils/logger");

let productCache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

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

productRouter.patch("/:id/images", async (req, res) => {
  try {
    const { id } = req.params;
    const { front, back } = req.body;

    const images = [front, back].filter(Boolean);
    if (images.length === 0) {
      return res.status(400).json({ error: "at least one image url required" });
    }

    const updated = await stripe.products.update(id, { images });
    productCache = null;

    res.json({ id: updated.id, images: updated.images });
  } catch (err) {
    logger.error("image update error:", err);
    res.status(500).json({ error: "failed to update images" });
  }
});

module.exports = productRouter;
