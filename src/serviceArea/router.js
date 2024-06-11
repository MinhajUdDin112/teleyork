const express = require("express");
const controller = require("./controller");
router = express.Router();
router.get("/", controller.get);
router.post("/", controller.add);
router.patch("/changeServiceStateStatus", controller.changeServiceStateStatus);
router.patch("/changeServiceZipStatus", controller.changeServiceZipStatus);

module.exports = router;
