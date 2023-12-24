const router = require("express").Router();
const { deleteComment } = require("../controllers/commentController");
const initializeSession = require("../utils/initializeSession");
const { authenticateUser } = require("../controllers/authController");

router.use(authenticateUser);
router.use(initializeSession);
router.delete("/:commentId", deleteComment);

module.exports = router;
