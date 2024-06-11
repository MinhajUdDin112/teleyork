const express = require("express");
const router = express.Router();
const controller = require("./sacController");

router.post("/insertAllSac", controller.insertAllSac);
router.get("/getByState", controller.getByZipCode);

module.exports = router;
