const express = require("express");
const router = express.Router();
const controller = require("./controller");
router.get("/all", controller.getAll);
router.get("/getByInventoryType", controller.getByInventoryType);
router.get("/getPlansByInventoryType", controller.getPlansByInventoryType);
router.get("/getPlanByTypeandInventory", controller.getPlanByTypeandInventory);
router.get("/getOne", controller.getOne),
  router.get("/SPPlans", controller.getSPPlane);
router.post("/", controller.createPlan);
router.post("/bulk", controller.addPlanInBulk);
router.patch("/", controller.updatePlan);
router.patch("/updateStatus", controller.updateStatus);
router.get("/getalldeactiveplans", controller.getalldeactiveplans);
module.exports = router;
