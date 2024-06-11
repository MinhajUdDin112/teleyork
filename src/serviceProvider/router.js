const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../helpers/apiError");
const service = require("./service");
const {
  createNew,
  login,
  validatePassword,
  verifyOtp,
} = require("./validator");
const controller = require("./controller");
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/banners"); // Specify the folder where the images will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Use a unique filename
  },
});

const upload = multer({ storage: storage });

// API endpoint for image upload with description
router.post(
  "/",
  upload.single("image"),
  expressAsyncHandler(async (req, res, next) => {
    const { path } = req.file;
    const {
      name,
      alias,
      type,
      url,
      email,
      phone,
      zipCode,
      country,
      state,
      subDomain,
      EIN,
      createdBy,
      address,
      carriers,
     
    } = req.body;
    console.log(req.body.carriers);
    const validate = createNew.validate(req.body);
    console.log(validate);
    if (validate.error) {
      return next(new ApiError(validate.error, 400));
    }
    
    const result = await service.addNew(
      name,
      alias,
      type,
      url,
      email,
      phone,
      zipCode,
      country,
      state,
      subDomain,
      EIN,
      createdBy,
      address,
      path,
      carriers,
      
    );
    if (result) {
      return res
        .status(201)
        .send({ msg: "Service provider added.", data: result });
    } else {
      return res.status(400).send({ msg: "Service provider not added" });
    }
  })
);
router.put(
  "/:id", // Use a dynamic route parameter to specify the ID of the service provider to update
  upload.single("image"),
  expressAsyncHandler(async (req, res, next) => {
    const { path } = req.file;
    const {
      name,
      alias,
      type,
      url,
      email,
      phone,
      zipCode,
      country,
      state,
      subDomain,
      EIN,
      createdBy,
      address,
      carriers,
    } = req.body;
    const serviceProviderId = req.params.id; // Extract the ID from the route parameter

    const result = await service.updateServiceProvider(
      serviceProviderId,
      name,
      alias,
      type,
      url,
      email,
      phone,
      zipCode,
      country,
      state,
      subDomain,
      EIN,
      createdBy,
      address,
      path,
      carriers
    );

    if (result) {
      return res.status(200).send({ msg: "Service provider updated.", data: result });
    } else {
      return res.status(400).send({ msg: "Service provider not updated" });
    }
  })
);
router.get("/all", controller.getAll);
router.get("/inActive", controller.inActive);
router.get("/details", controller.getOne);
//router.post("/", controller.create);
router.patch("/", controller.update);
router.delete("/", controller.delete);
router.post("/requestOtp", controller.requestOtp);
router.post("/login", controller.login);
router.post("/verifyOtp", controller.verifyOtp);
router.post("/resetPassword", controller.resetPassword);
router.post("/forgotPassword", controller.forgotPassword);
router.patch("/updateStatus", controller.updateStatus);
router.get("/getSPdetailByDomain", controller.getSPdetailByDomain);

router.delete("/", controller.delete);

module.exports = router;
