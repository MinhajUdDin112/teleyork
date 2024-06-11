const express = require("express");
const router = express.Router();
const controller = require("./invoiceTypeController");

router.post("/add", controller.create);
router.get("/all", controller.getAll);
router.get("/getOne", controller.getOne);
router.put("/update", controller.update);
router.put("/statusUpdate", controller.statusUpdate);
router.put("/delete", controller.delete);

module.exports = router;
