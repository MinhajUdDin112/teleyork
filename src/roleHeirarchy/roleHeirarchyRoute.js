const express = require("express");
const router = express.Router();
const controller = require("./roleHeirarchyController");

router.post("/addHeirarchy", controller.addHeirarchy);
router.get("/getHeirarchyByName", controller.getHeirarchyName);

module.exports = router;
