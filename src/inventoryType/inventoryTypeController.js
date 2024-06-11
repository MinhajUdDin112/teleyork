const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../helpers/apiError");
const service = require("./inventoryTypeServices");

exports.create = expressAsyncHandler(async (req, res, next) => {
  let { inventoryType, serviceProvider } = req.body;
  if (!inventoryType || !serviceProvider) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  inventoryType = inventoryType.toUpperCase();
  const isInventoryType = await service.checkDup(inventoryType);
  if (isInventoryType) {
    return res.status(400).send({ msg: "inventoryType already exist" });
  }
  const result = await service.addNew(inventoryType, serviceProvider);
  if (result) {
    return res
      .status(201)
      .send({ msg: "inventoryType details added.", data: result });
  } else {
    return res.status(400).send({ msg: "inventoryType details not added" });
  }
});

// GET ALL
exports.getAll = expressAsyncHandler(async (req, res) => {
  const { serviceProvider } = req.query;
  const result = await service.getAll(serviceProvider);
  if (result) {
    return res
      .status(201)
      .send({ msg: "All inventoryType types", data: result });
  } else {
    return res.status(400).send({ msg: "inventoryType Not Found" });
  }
});

// GET ONE SPECIFIC MAILER
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  console.log(id);
  const result = await service.getByUserID(id);
  if (result) {
    return res.status(200).send({ msg: "inventoryType details", data: result });
  } else {
    return res.status(400).send({ msg: "inventoryType details not found" });
  }
});

// UPDATE A MAILER
exports.update = expressAsyncHandler(async (req, res, next) => {
  let { inventoryTypeId, inventoryType, serviceProvider } = req.body;
  if (!inventoryTypeId || !inventoryType || !serviceProvider) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  inventoryType = inventoryType.toUpperCase();
  const result = await service.update(
    inventoryTypeId,
    inventoryType,
    serviceProvider
  );
  if (result) {
    return res
      .status(200)
      .send({ msg: "inventoryType details updated.", data: result });
  } else {
    return res.status(400).send({ msg: "inventoryType details not updated" });
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
    return res
      .status(200)
      .send({ msg: "inventoryType deleted.", data: result });
  } else {
    return res.status(400).send({ msg: "inventoryType not deleted" });
  }
});
exports.statusUpdate = expressAsyncHandler(async (req, res, next) => {
  const { inventoryTypeId, active } = req.body;
  if (!inventoryTypeId || !active) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.statusUpdate(inventoryTypeId, active);
  if (result) {
    return res
      .status(200)
      .send({ msg: "billingModel details updated.", data: result });
  } else {
    return res.status(400).send({ msg: "billingModel details not updated" });
  }
});
