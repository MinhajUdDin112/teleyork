const express = require("express");
const router = express.Router();
const controller = require("./controller");

router.post("/add", controller.add);
router.get("/getAllData", controller.getAllData);
router.get("/getOne/:id", controller.getOne);
router.put("/edit/:id", controller.edit);
router.delete("/delete/:id", controller.delete);
router.post("/getAllEnrollments", controller.getAllEnrollments);

module.exports = router;
