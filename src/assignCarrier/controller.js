const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const service = require("./service");
const { createNew,addNew,removeCarrier } = require("./validator");
const ApiError = require("../helpers/apiError");
const serviceProviderService=require("../serviceProvider/service")

exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.get();
  res.status(200).send({ msg: "list", data: result });
});

exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  const result = await service.getByID(id);
  if (result) {
    return res.status(200).send({ msg: "Details", data: result });
  } else {
    return res.status(404).send({ msg: "Not Found!" });
  }
});
exports.getByCarrier = expressAsyncHandler(async (req, res) => {
  const { carrierId } = req.query;
  const result = await service.getByCarrier(carrierId);
  console.log(result)
  if (result.length!=0) {
    return res.status(200).send({ msg: "Details", data: result });
  } else {
    return res.status(404).send({ msg: "Not Found!" });
  }
});
exports.getBySP = expressAsyncHandler(async (req, res) => {
  const { serviceProvider } = req.query;
  const result = await service.getBySP(serviceProvider);
  if (result) {
    return res.status(200).send({ msg: "List", data: result });
  } else {
    return res.status(404).send({ msg: "Not Found!" });
  }
});
exports.getByMNO = expressAsyncHandler(async (req, res) => {
  const { mno } = req.query;
  const result = await service.getByMNO(mno);
  if (result) {
    return res.status(200).send({ msg: "List", data: result });
  } else {
    return res.status(404).send({ msg: "Not Found!" });
  }
});

exports.create = expressAsyncHandler(async (req, res, next) => {
  const {mno, carriers, serviceProvider,createdBy } = req.body;
  const validate = createNew.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const isServiceProvider = await serviceProviderService.getByUserID(serviceProvider);
  if(!isServiceProvider){
    return res.status(400).send({ msg: "Service provider don't exist!" });
  }
  const isAssigned=await service.isAssigned(carriers);
  console.log(isAssigned);
  if(isAssigned){
    return res.status(400).send({msg:"Already assigned!"});
  }
  const result = await service.addNew(mno,carriers,serviceProvider,createdBy);
  if (result) {
    return res
      .status(201)
      .send({ msg: "Carrier  assigned.", data: result });
  } else {
    return res.status(400).send({ msg: "Failed!" });
  }
});
exports.addNew = expressAsyncHandler(async (req, res, next) => {
  const { assignedId,mno,carrier, serviceProvider, createdBy } = req.body;
  const validate = addNew.validate(req.body);
 
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const isAssigned = await service.isAssigned(carrier);
  console.log(isAssigned);
  if (isAssigned) {
    return res.status(400).send({ msg: "Already assigned!" });
  }
  const result = await service.addNewCarrier(
    assignedId,
    mno,
    carrier,
    serviceProvider,
    createdBy
  );
  console.log(result)
  if (result) {
    return res
      .status(201)
      .send({ msg: "New Carrier has been assigned", data: result });
  } else {
    return res.status(400).send({ msg: "Failed to assigned!" });
  }
});

exports.removeCarrier = expressAsyncHandler(async (req, res, next) => {
  const { assignedId,mno, carrier, serviceProvider, updatedBy } = req.body;
  const validate = removeCarrier.validate(req.body);
  console.log(validate)
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const result = await service.removeCarrier(
    assignedId,
    mno,
    carrier,
    serviceProvider,
    updatedBy
  );
  console.log(result)
  if (result) {
    return res
      .status(201)
      .send({ msg: "Carrier has been removed" });
  } else {
    return res.status(400).send({ msg: "Failed!" });
  }
});
exports.update = expressAsyncHandler(async (req, res, next) => {
  const { assignedId, carriers, serviceProvider, updatedBy } = req.body;
  //   const validate = updateProvider.validate(req.body);
  //   if (validate.error) {
  //     return next(new ApiError(validate.error, 400));
  //   }
  const result = await service.update(
    assignedId,
    carriers,
    serviceProvider,
    updatedBy
  );
  if (result) {
    return res
      .status(200)
      .send({ msg: "Service provider profile updated.", data: result });
  } else {
    return res
      .status(400)
      .send({ msg: "Service provider profile not updated" });
  }
});

exports.delete = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  const result = await service.delete(id);
  if (result.deletedCount == 0) {
    return res.status(400).send({ msg: "ID Not found" });
  }
  if (result) {
    return res
      .status(200)
      .send({ msg: "Assigned id deleted", data: result });
  } else {
    return res.status(400).send({ msg: "Failed!" });
  }
});
