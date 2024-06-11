const express = require("express");
const router = express.Router();
const controller = require("./zipCodecontroller");

router.post("/insertAllZip", controller.inserAllZip);
router.get("/getByZipCode", controller.getByZipCode);
router.get("/getAllStates", controller.getAllStates);
router.get("/getcitiesByState", controller.getcitiesByState);

module.exports = router;
