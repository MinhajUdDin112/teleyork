const express = require("express");
const controller = require("./companyMailController");
const router = express.Router();

router.post("/addMail", controller.create);
router.get("/getAll", controller.getAll);
router.get("/getOne", controller.getOne);
router.put("/update", controller.update);
router.delete("/delete", controller.delete);

module.exports = router;
