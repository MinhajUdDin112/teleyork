const controller=require('./controller')
const express=require("express");
const router=express.Router()
router.route("/").post(controller.saveDeviceInventory).get(controller.getAll);
router.route("/getByMDN").get(controller.getByMDN);
router.route("/inUse").get(controller.getAlignDevice);
router.route("/available").get(controller.getFreeDevices)
module.exports=router