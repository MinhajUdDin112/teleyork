const express = require("express");
const router = express.Router();
const controller = require("./controller");
router.post("/getInventory", controller.getInventory);
module.exports = router;
