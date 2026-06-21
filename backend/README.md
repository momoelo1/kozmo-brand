# KoZmo — Backend API

REST API for the KoZmo e-commerce store. Built with Node.js, Express, and MongoDB,
with Stripe as the product catalog and payment processor.

## Tech stack

- **Node.js + Express** — HTTP API
- **MongoDB + Mongoose** — users, carts, and orders
- **Stripe** — product catalog (products live in Stripe, not in Mongo) and Checkout
- **JWT + bcrypt** — authentication
- **Jest + Supertest + mongodb-memory-server** — tests

## Architecture notes

- **Stripe is the source of truth for products.** The API proxies Stripe's product
  API (with a short in-memory cache); MongoDB only stores users, carts, and orders.
- **Prices are always resolved server-side from Stripe** at checkout — client-sent
  prices are never trusted.
- **Stateless JWT auth.** A short-lived access token is returned on login (and set as
  an httpOnly cookie); requests authenticate via that cookie or an
  `Authorization: Bearer <token>` header.
- `app.js` (the Express app) is separated from `server.js` (which starts listening),
  so the app can be imported directly in tests.

## Getting started

### Prerequisites
- Node.js 18+
- A MongoDB instance (local or hosted)
- A Stripe account with API keys

### Setup
```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

The server validates required environment variables at startup and exits with a
clear message if any are missing.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB connection string |
| `SECRET` | yes | Secret used to sign JWT access tokens |
| `STRIPE_SECRET` | yes | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | yes | Stripe webhook signing secret |
| `CLIENT_URL` | yes | Frontend origin (CORS + Stripe redirect URLs) |
| `CLIENT_URL_ALT` | no | Optional alternate/fallback client origin |
| `PORT` | no | Port to listen on (default `3001`) |

See `.env.example` for a template.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start in watch mode (nodemon) |
| `npm start` | Start the server |
| `npm test` | Run the test suite |

## API

All routes are prefixed with `/api`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/users` | — | Register a new user |
| `POST` | `/login` | — | Log in, returns an access token |
| `GET` | `/products` | — | List products (from Stripe) |
| `GET` | `/products/categories` | — | List categories |
| `GET` | `/products/category/:category` | — | List products in a category |
| `GET` | `/products/:id` | — | Get a single product |
| `GET` | `/cart` | ✓ | Get the current user's cart |
| `POST` | `/cart` | ✓ | Add an item to the cart |
| `PATCH` | `/cart/:id` | ✓ | Update an item's quantity |
| `DELETE` | `/cart` | ✓ | Remove an item by product id |
| `POST` | `/checkout/create-checkout-session` | ✓ | Start Checkout for a logged-in user |
| `POST` | `/checkout/create-checkout-session-guest` | — | Start Checkout as a guest |
| `POST` | `/checkout/webhook` | Stripe sig | Stripe webhook — persists the order |
| `GET` | `/orders` | ✓ | List the current user's orders |
| `GET` | `/health` | — | Health check |

A successful payment triggers the Stripe webhook, which persists an `Order`
(idempotently, keyed by the Stripe session id) and clears the user's cart.

## Testing

```bash
npm test
```

Tests run against an in-memory MongoDB instance and a mocked Stripe client, so no
external services or credentials are required.

## Project structure

```
backend/
├── app.js            # Express app (exported for tests)
├── server.js         # Starts the HTTP server
├── controllers/      # Route handlers
├── models/           # Mongoose models (User, Cart, Order)
├── utils/            # Config, middleware, logger
└── tests/            # Jest + Supertest suites
```
