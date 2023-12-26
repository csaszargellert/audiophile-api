// 3-party modules
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const stripe = require("stripe")(
  "sk_test_51NtmS9CD0ggoQnYIomeE9fIx25E0sRsLpml2HBeUQCnn79MV9K1vbNVCbnTBNUoloZRu3mSSg5aaDXIS0GaiR7Sm00803O6uDA"
);

const catchAsync = require("./utils/CatchAsync");
// own modules
const AppError = require("./utils/AppError");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));

app.get(
  "/api/success",
  catchAsync(async (req, res, next) => {
    const session = await stripe.checkout.sessions.retrieve(
      req.query.session_id,
      { expand: ["invoice"] }
    );
    const customer = await stripe.customers.retrieve(session.customer);

    res.status(200).json({ customer, invoice: session.invoice });
  })
);

app.get("/api/refresh-token", require("./controllers/refreshTokenController"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));
app.use("/api/stripe", require("./routes/stripeRoutes"));

app.all("*", (req, res, next) => {
  const error = new AppError("Could not get to requested path", 404);
  return next(error);
});

app.use(require("./controllers/errorController"));

module.exports = app;
