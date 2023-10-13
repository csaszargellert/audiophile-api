const router = require("express").Router();
const { authenticateUser } = require("../controllers/authController");
const { createStripeSession } = require("../controllers/stripeController");

router.use(authenticateUser);

router.patch("/create-checkout-session", createStripeSession);

module.exports = router;
