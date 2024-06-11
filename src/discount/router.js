const express=require("express");
const router=express.Router();
const controller=require("./controller");

router.post("/adddiscount", controller.adddiscount);
router.get("/getalldiscounts", controller.getalldiscounts);
router.get("/getdiscountbyid", controller.getdiscountbyid);
router.put("/updatediscount", controller.updatediscount);
router.delete("/deletediscount", controller.deletediscount);


module.exports=router