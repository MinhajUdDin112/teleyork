const express =require("express");
const router=express.Router();
const controller=require("./controller");
router.get("/all",controller.getAll);
router.get("/inActive", controller.inActiveRoles);
router.get("/details",controller.details);
router.post("/",controller.create);
router.patch("/updateRole",controller.updateRole);
router.patch("/updateStatus", controller.updateStatus);
router.patch("/updateRolePermissions",controller.rolePermission);
router.delete("/",controller.delete)
module.exports=router