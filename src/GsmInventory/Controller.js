const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../helpers/apiError");
const service = require("./Services");
const { gsmAddStock } = require("./validator");

exports.saveDeviceInventory = expressAsyncHandler(async (req, res, next) => {
  const result = await service.bulkInsert(req.body);
  if (result) {
    return res.status(201).send({
      msg: "success",
      data: result,
    });
  } else {
    return res.status(400).send({
      msg: "Failed!",
    });
  }
});
// get all devices
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.getAll(req.query.serviceProvider);
  res.status(200).send({ msg: "list", data: result });
});
//align devices
exports.getAlignDevice = expressAsyncHandler(async (req, res) => {
  const result = await service.getAlignDevices(req.query.serviceProvider);
  res.status(200).send({ msg: "list", data: result });
});
//get free devices
exports.getFreeDevices = expressAsyncHandler(async (req, res) => {
  const result = await service.getFreeDevices(req.query.serviceProvider);
  res.status(200).send({ msg: "list", data: result });
});
exports.getDeActivate = expressAsyncHandler(async (req, res) => {
  const result = await service.getDeActivate(req.query.serviceProvider);
  res.status(200).send({ msg: "list", data: result });
});
exports.getSimDetails = expressAsyncHandler(async (req, res) => {
  const result = await service.getSimDetails(req.query.phoneId);
  res.status(200).send({ msg: "list", data: result });
});
// get by serial number
exports.getByESN = expressAsyncHandler(async (req, res) => {
  const { serviceProvider, esn } = req.query;
  const result = await service.getByESN(serviceProvider, esn);
  if (result) {
    res.status(200).send({ msg: "Device", data: result });
  } else {
    res.status(404).send({ msg: "Device not found" });
  }
});

//AddSim
exports.gsmAddStock = expressAsyncHandler(async (req, res, next) => {
  const {
    Uploaded_by,
    carrier,
    Esn,
    serviceProvider,
    //team,
    agentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel,
    make,
  } = req.body;

  const validate = gsmAddStock.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const duplicateCheck = await service.duplicateCheck(
    SimNumber,
    unitType,
    billingModel
  );

  if (duplicateCheck) {
    return res.status(400).send({ msg: "ESN Already Exist" });
  }
  const result = await service.esnAddStock(
    Uploaded_by,
    carrier,
    Esn,
    serviceProvider,
    //team,
    agentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel,
    make
  );
  if (result) {
    res.status(200).send({ msg: "inventry added successfully", data: result });
  } else {
    res.status(404).send({ msg: "inventery not added successfully" });
  }
});

//Add preActivate
exports.AddPreEsnActivated = expressAsyncHandler(async (req, res, next) => {
  const {
    Uploaded_by,
    carrier,
    Esn,
    serviceProvider,
    //team,
    agentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel,
    make,
  } = req.body;

  const validate = gsmAddStock.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const duplicateCheck = await service.duplicateCheck(
    SimNumber,
    unitType,
    billingModel
  );

  if (duplicateCheck) {
    return res.status(400).send({ msg: "ESN Already Exist" });
  }
  const result = await service.AddPreEsnActivated(
    Uploaded_by,
    carrier,
    Esn,
    serviceProvider,
    //team,
    agentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel,
    make
  );
  if (result) {
    res.status(200).send({ msg: "inventry added successfully", data: result });
  } else {
    res.status(404).send({ msg: "inventery not added successfully" });
  }
});

// add and activate

exports.addAndActivate = expressAsyncHandler(async (req, res, next) => {
  const {
    Uploaded_by,
    carrier,
    Esn,
    serviceProvider,
    //team,
    agentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel,
    make,
  } = req.body;

  const validate = gsmAddStock.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const duplicateCheck = await service.duplicateCheck(
    SimNumber,
    unitType,
    billingModel
  );

  if (duplicateCheck) {
    return res.status(400).send({ msg: "ESN Already Exist" });
  }
  const result = await service.addAndActivate(
    Uploaded_by,
    carrier,
    Esn,
    serviceProvider,
    //team,
    agentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel,
    make
  );
  if (result) {
    res.status(200).send({ msg: "inventry added successfully", data: result });
  } else {
    res.status(404).send({ msg: "inventery not added successfully" });
  }
});

//add and assign non activate
exports.addAndAssignNonActivate = expressAsyncHandler(
  async (req, res, next) => {
    const {
      Uploaded_by,
      carrier,
      Esn,
      serviceProvider,
      //team,
      agentType,
      AgentName,
      Model,
      box,
      unitType,
      provisionType,
      IMEI,
      billingModel,
      make,
    } = req.body;

    const validate = gsmAddStock.validate(req.body);
    if (validate.error) {
      return next(new ApiError(validate.error, 400));
    }
    const duplicateCheck = await service.duplicateCheck(
      SimNumber,
      unitType,
      billingModel
    );

    if (duplicateCheck) {
      return res.status(400).send({ msg: "ESN Already Exist" });
    }
    const result = await service.addAndAssignNonActivate(
      Uploaded_by,
      carrier,
      Esn,
      serviceProvider,
      //team,
      agentType,
      AgentName,
      Model,
      box,
      unitType,
      provisionType,
      IMEI,
      billingModel,
      make
    );
    if (result) {
      res
        .status(200)
        .send({ msg: "inventry added successfully", data: result });
    } else {
      res.status(404).send({ msg: "inventery not added successfully" });
    }
  }
);
