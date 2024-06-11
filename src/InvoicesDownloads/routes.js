const express = require("express");
const app = express();
const controller = require("./controllers");
const router = express.Router();

router.post("/invoices", controller.invoices);
module.exports = router;
