const express=require("express");
const router=express.Router();
const controller=require("./controller");

router.post("/addfeature", controller.addfeature);
router.get("/getallfeatures", controller.getallfeatures);
router.get("/getfeaturesbyid", controller.getfeaturesbyid);
router.put("/updatefeature", controller.updatefeature);
router.delete("/deletefeature", controller.deletefeature);


module.exports=router