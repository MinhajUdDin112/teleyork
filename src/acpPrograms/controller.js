const express = require("express");
const fs = require('fs');
const multer = require("multer");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../helpers/apiError");
const service = require("./service");
const model = require("./model")
const { createValidation,updatedValidation } = require("./validator");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/banners");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

exports.add = expressAsyncHandler(async (req, res, next) => {
  const {    serviceProvider,createdBy, name,code,description,banner,active } = req.body;
  const validate = createValidation.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const codeCheck = await model.findOne({code})
  if(codeCheck){
   return res.status(400).send({msg:`code already assign to program ( ${codeCheck.name} )`})
  }
  const result = await service.create(serviceProvider,createdBy,name,code, description, banner, active);
  if (result) {
    return res.status(201).send({
      msg: "Added",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Failed! to update" });
  }
});
exports.update = expressAsyncHandler(async (req, res, next) => {
  const {serviceProvider,updatedBy,acpId, name,code, description, banner,active } = req.body;
  const validate = updatedValidation.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const result = await service.update(serviceProvider,updatedBy,acpId,name,code, description, banner,active);
  if (result) {
    return res.status(200).send({
      msg: "Updated",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Failed!" });
  }
});
exports.get = expressAsyncHandler(async (req, res) => {
  try {
    const {serviceProvider}=req.query;
    const result = await service.getAll(serviceProvider);
    res.status(200).send({ msg: "ACP Programs", data: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});
exports.getOne = expressAsyncHandler(async (req, res) => {
  try {
    const { programId } = req.query;
    const result = await service.getOne(programId);
    if (result) {
      res.status(200).send({ msg: "ACP Program", data: result });
    } else {
      res.status(404).send({ msg: "Not Found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});
