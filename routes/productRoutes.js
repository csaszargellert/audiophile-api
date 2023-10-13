const router = require("express").Router();
const initializeSession = require("../utils/initializeSession");
const {
  authenticateUser,
  requireRoles,
} = require("../controllers/authController");
const {
  getProducts,
  getProduct,
  createProduct,
  deleteProduct,
  updateProduct,
  getProductsByCategory,
} = require("../controllers/productController");

router.get("/", getProducts);
router.get("/:productId", getProduct);
router.get("/categories/:slug", getProductsByCategory);

router.use(authenticateUser);
router.use(requireRoles("admin"));

router.patch("/:productId", updateProduct);

router.use(initializeSession);

router.delete("/:productId", deleteProduct);
router.post("/create", createProduct);

module.exports = router;
