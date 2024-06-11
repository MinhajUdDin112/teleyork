const express = require("express");
const router = express.Router();
const controller = require("./controller");

// carrier routes
router.get("/carrier/carriersList", controller.carriersList);
router.get("/carrier/carrierInfo", controller.carrierInfo);
router.get("/carrier/pakagesList", controller.pakagesList);
router.get("/carrier/listServices", controller.listServices);
router.post("/carrier/addFund", controller.addFund);

//customer routes
router.get("/customer/customerInfo", controller.CustomerInfo);
router.get("/customer/customerList", controller.customerList);

// fullfilments list
router.get("/fullfillmentList", controller.fullfillmentList);

//get a product
router.get("/product/productDetails", controller.productDetails);
router.get("/product/productList", controller.productList);
router.get("/product/updateProduct", controller.updateProduct);

//Shipment
router.post("/createlabel", controller.createLabel);
router.post("/getRates", controller.getRates);
router.get("/shipmentList", controller.shipmentList);
router.get("/shipmentVoid", controller.shipmentVoid);

//STORES
router.post("/stores/deactivate", controller.deactivate);
router.get("/stores/getRefreshStatus", controller.getRefreshStatus);
router.get("/stores/getStoreInfo", controller.getStoreInfo);
router.get("/stores/listMarketPlaces", controller.listMarketPlaces);
router.get("/stores/listStores", controller.listStores);
router.post("/stores/reactivateStore", controller.reactivateStore);
router.post("/stores/RefreshAStore", controller.RefreshAStore);
//router.put("/stores/UpdateStore", controller.UpdateStore);

//List Users
router.get("/users/listUsers", controller.listUsers);

//track apis
router.post("/tracking", controller.packageTrack);
router.post("/TrackingPackageDetails", controller.TrackingPackageDetails);

module.exports = router;
