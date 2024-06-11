const express = require("express");
const router = express.Router();
const controller = require("../paymentMethod/controller");

// Create new client
router.post("/clients", controller.createClient);

// Get client by ID
router.get("/getclientsbyID", controller.getClientById);
router.get("/getall", controller.getall);
router.get("/getCompanyUrl", controller.getCompanyUrl);
router.get("/getcredentials", controller.getcredentials);
// Update client by ID
router.put("/clients", controller.updateClient);
router.put("/changeActiveStatus", controller.changeActiveStatus);
// Delete client by ID
router.delete("/clients", controller.deleteClient);

module.exports = router;
