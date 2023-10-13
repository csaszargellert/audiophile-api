const router = require("express").Router();
const { uploadProductImages } = require("../controllers/multerController");
const initializeSession = require("../utils/initializeSession");
const { deletePrevFiles } = require("../controllers/directoryController");
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

router.patch("/:productId", uploadProductImages, updateProduct);

router.use(initializeSession);

router.delete("/:productId", deleteProduct);
router.post("/create", uploadProductImages, deletePrevFiles, createProduct);

module.exports = router;
