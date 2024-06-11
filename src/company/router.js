const express=require("express");
const router=express.Router();
const controller=require("./controller")
router
  .route("/")
  .post(controller.addNewCompany)
  .get(controller.getAll)
  .patch(controller.update);
router.get("/details",controller.getOne);
module.exports=router;