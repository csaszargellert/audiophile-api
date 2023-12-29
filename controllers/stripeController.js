const stripe = require("stripe")(process.env.STRIPE_KEY);
const catchAsync = require("../utils/CatchAsync");
const AppError = require("../utils/AppError");

const createStripeSession = catchAsync(async function (req, res, next) {
  const { products } = req.body;

  const line_items_products = products.map((product) => {
    return {
      price_data: {
        product_data: {
          name: product.name,
          description: product.description,
          images: [product.image],
        },
        unit_amount: product.price * 100,
        currency: "usd",
      },
      quantity: product.amount,
    };
  });

  const session = await stripe.checkout.sessions.create({
    line_items: line_items_products,
    mode: "payment",
    success_url:
      "https://audiophile-frontendmentor.xyz/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://audiophile-frontendmentor.xyz/cancel",
    customer_email: req.user.email,
    shipping_address_collection: {
      allowed_countries: ["HU"],
    },
    billing_address_collection: "required",
    phone_number_collection: {
      enabled: true,
    },
    invoice_creation: {
      enabled: true,
    },
    payment_method_types: ["card"],
  });

  res.status(200).json({ url: session.url });
});

module.exports = {
  createStripeSession,
};
