const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../helpers/apiError");
const service = require("./deviceTypeServices");

exports.create = expressAsyncHandler(async (req, res, next) => {
  const { deviceType } = req.body;
  if (!deviceType) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.addNew(deviceType);
  if (result) {
    return res
      .status(201)
      .send({ msg: "deviceType details added.", data: result });
  } else {
    return res.status(400).send({ msg: "deviceType details not added" });
  }
});

// GET ALL
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.getAll();
  if (result) {
    return res.status(201).send({ msg: "All deviceType types", data: result });
  } else {
    return res.status(400).send({ msg: "deviceType Not Found" });
  }
});

// GET ONE SPECIFIC MAILER
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  console.log(id);
  const result = await service.getByUserID(id);
  if (result) {
    return res.status(200).send({ msg: "deviceType details", data: result });
  } else {
    return res.status(400).send({ msg: "deviceType details not found" });
  }
});

// UPDATE A MAILER
exports.update = expressAsyncHandler(async (req, res, next) => {
  const { deviceTypeId, deviceType } = req.body;
  if (!deviceTypeId || !deviceType) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.update(deviceTypeId, deviceType);
  if (result) {
    return res
      .status(200)
      .send({ msg: "deviceType details updated.", data: result });
  } else {
    return res.status(400).send({ msg: "deviceType details not updated" });
  }
});

//delete user
exports.delete = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  const result = await service.delete(id);
  if (result.deletedCount == 0) {
    return res.status(400).send({ msg: "ID Not found" });
  }
  if (result) {
    return res.status(200).send({ msg: "deviceType deleted.", data: result });
  } else {
    return res.status(400).send({ msg: "deviceType not deleted" });
  }
});
