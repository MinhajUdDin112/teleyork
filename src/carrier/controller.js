const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const service = require("./service");
const { create ,update} = require("./validator");
const ApiError = require("../helpers/apiError");
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.get();
  res.status(200).send({ msg: "carriers", data: result });
});
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  const result = await service.getByUserID(id);
  if (result) {
    return res.status(200).send({ msg: "carrier", data: result });
  } else {
    return res.status(400).send({ msg: "carrier not found" });
  }
});
exports.create=expressAsyncHandler(async(req,res,next)=>{
    const {createdBy,name,active}=req.body;
    const validate = create.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
    const result=await service.create(createdBy,name,active);
    if(result){
        return res.status(201).send({msg:"carrier added successfully",data:result})
    }else{
        return res.status(400).send({ msg: "Failed!"});
    }
});
exports.update = expressAsyncHandler(async (req, res,next) => {
  const { id,updatedBy, active } = req.body;
  const validate = update.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const result = await service.update(id,updatedBy, active);
  if (result) {
    return res
      .status(200)
      .send({ msg: "carrier update successfully", data: result });
  } else {
    return res.status(400).send({ msg: "Failed!" });
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
      .send({ msg: "Service provider deleted", data: result });
  } else {
    return res.status(400).send({ msg: "Service provider not deleted" });
  }
});
exports.updateCarrier = expressAsyncHandler(async (req, res, next) => {
  const { updatedBy, name, id } = req.body;
  const updatedCarrier = await service.updateCarrier(updatedBy, name, id);

  if (updatedCarrier) {
    return res.status(200).send({ msg: 'Carrier updated successfully', data: updatedCarrier });
  } else {
    return res.status(404).send({ msg: 'Carrier not found' });
  }
});
exports.inactivelist = expressAsyncHandler(async (req, res, next) => {
  const updatedCarrier = await service.inactivelist();

  if (updatedCarrier) {
    return res.status(200).send({ msg: 'inactive carrier', data: updatedCarrier });
  } else {
    return res.status(404).send({ msg: 'Carrier not found' });
  }
});
