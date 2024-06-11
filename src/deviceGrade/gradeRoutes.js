const express = require("express");
const router = express.Router();
const controller = require("./gradeController");

router.post("/add", controller.create);
router.get("/all", controller.getAll);
router.get("/getOne", controller.getOne);
router.put("/update", controller.update);
router.put("/delete", controller.delete);

module.exports = router;
