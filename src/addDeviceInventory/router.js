const controller = require("./controller");
const express = require("express");
const router = express.Router();

router.post("/", controller.addDevice);
router.get("/all", controller.getAllDevices);
router.get("/getOne", controller.getOneDevice);
router.get("/getPhoneDeviceModel", controller.getPhoneDeviceModel);
router.get("/getTabletDeviceModel", controller.getTabletDeviceModel);
router.patch("/update", controller.updateDevice);
router.delete("/delete", controller.delete);
router.get("/getmodelbymake",controller.getmodelbymake);

module.exports = router;
