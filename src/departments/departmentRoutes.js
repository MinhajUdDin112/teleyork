const express = require("express");
const router = express.Router();
const controller = require("./departmentController");

router.post("/addDeparment", controller.addDeparment);
router.put("/updateDeparment", controller.updateDeparment);
router.get("/getDepartments", controller.getDepartments);
router.get("/getSingleDepartment", controller.getSingleDepartment);
router.delete("/deleteDepartment", controller.deleteDepartment);
router.get("/getRejectDepartment", controller.getRejectDepartment);

module.exports = router;
