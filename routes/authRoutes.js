const router = require("express").Router();
const {
  signup,
  signin,
  signout,
  authenticateUser,
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/signin", signin);

router.post("/signout", authenticateUser, signout);

module.exports = router;
