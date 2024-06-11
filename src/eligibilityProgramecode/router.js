const express = require("express");
const controller = require("./controller");
const router=express.Router();

router.post("/add", controller.addEligibility);
router.get("/getall",controller.getAll); 
router.get("/getone",controller.getOne)
router.put("/updateone",controller.updateOne);
router.delete("/delete",controller.delete);
module.exports = router

