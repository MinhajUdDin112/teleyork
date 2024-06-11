const express = require("express");
const controller = require("./apiAuthController");
const router = express.Router();

router.post("/", controller.addCred);

module.exports = router;
