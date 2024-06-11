const express = require("express");
const router = express.Router();
const controller = require("./controller");
router.post("/label", controller.getLabelData);
router.post("/labelsDownload", controller.downloadLabelsAsZip);
module.exports = router;
