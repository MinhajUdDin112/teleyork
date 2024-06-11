const express = require("express");
const controller = require("./controller");
const router = express.Router();
router.get("/all", controller.getAll);
router.get("/inActive", controller.inActive);
router.get("/details", controller.userDetails);
router.post("/", controller.create);
router.post("/login", controller.login);
router.patch("/", controller.updateProfile);
router.patch("/updateStatus", controller.updateStatus);
router.post("/requestOtp", controller.requestOtp);
router.post("/verifyOtp", controller.verifyOtp);
router.post("/resetPassword", controller.resetPassword);
router.post("/forgotPassword", controller.forgotPassword);
router.delete("/", controller.delete);
router.post("/refreshToken", controller.refreshToken);

module.exports = router;
