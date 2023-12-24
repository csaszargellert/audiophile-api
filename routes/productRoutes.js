const router = require("express").Router();
const { createComment } = require("../controllers/commentController");
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
router.use(initializeSession);

router.post("/:productId/comment", createComment);

router.use(requireRoles("admin"));

router.patch("/:productId", updateProduct);
router.delete("/:productId", deleteProduct);
router.post("/create", createProduct);

module.exports = router;
