const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../helpers/apiError");
const service = require("./billingModelServices");

exports.create = expressAsyncHandler(async (req, res, next) => {
  const { billingModel, serviceProvider, inventory } = req.body;
  if (!billingModel || !serviceProvider || !inventory) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.addNew(billingModel, serviceProvider, inventory);
  if (result) {
    return res
      .status(201)
      .send({ msg: "billingModel details added.", data: result });
  } else {
    return res.status(400).send({ msg: "billingModel details not added" });
  }
});

// GET ALL
exports.getAll = expressAsyncHandler(async (req, res) => {
  const { serviceProvider } = req.query;
  const result = await service.getAll(serviceProvider);
  if (result) {
    return res
      .status(201)
      .send({ msg: "All billingModel types", data: result });
  } else {
    return res.status(400).send({ msg: "billingModel Not Found" });
  }
});
exports.getInactiveList = expressAsyncHandler(async (req, res) => {
  const { serviceProvider } = req.query;
  const result = await service.getInactiveList(serviceProvider);
  console.log(result);
  if (result && result.length > 0) {
    return res
      .status(200)
      .send({ msg: "All billingModel types", data: result });
  } else {
    return res.status(400).send({ msg: "billingModels Not Found" });
  }
});

// GET ONE SPECIFIC MAILER
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  console.log(id);
  const result = await service.getByUserID(id);
  if (result) {
    return res.status(200).send({ msg: "billingModel details", data: result });
  } else {
    return res.status(400).send({ msg: "billingModel details not found" });
  }
});
exports.getInventoryByBillModel = expressAsyncHandler(async (req, res) => {
  const { BillModelId } = req.query;
  const result = await service.getInventoryByBillModel(BillModelId);
  console.log("result", result);
  if (result) {
    return res
      .status(200)
      .send({ msg: "Billing Model Inventory", data: result.inventory });
  } else {
    return res.status(400).send({ msg: "billingModel details not found" });
  }
});
exports.getProductByBillModel = expressAsyncHandler(async (req, res) => {
  const { billingModel } = req.query;
  console.log(billingModel);
  const result = await service.getProductByBillModel(billingModel);
  if (result) {
    return res.status(200).send({ msg: "billingModel details", data: result });
  } else {
    return res.status(400).send({ msg: "billingModel details not found" });
  }
});

// UPDATE A MAILER
exports.update = expressAsyncHandler(async (req, res, next) => {
  const { billingModelId, billingModel, serviceProvider, inventory } = req.body;
  if (!billingModelId || !billingModel || !serviceProvider || !inventory) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.update(
    billingModelId,
    billingModel,
    serviceProvider,
    inventory
  );
  if (result) {
    return res
      .status(200)
      .send({ msg: "billingModel details updated.", data: result });
  } else {
    return res.status(400).send({ msg: "billingModel details not updated" });
  }
});
exports.statusUpdate = expressAsyncHandler(async (req, res, next) => {
  const { billingModelId, active } = req.body;
  if (!billingModelId || active === undefined) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.statusUpdate(billingModelId, active);
  if (result) {
    return res
      .status(200)
      .send({ msg: "billingModel details updated.", data: result });
  } else {
    return res.status(400).send({ msg: "billingModel details not updated" });
  }
});

//delete user
exports.delete = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.delete(id);

  if (result === null) {
    return res.status(400).send({ msg: "ID Not found" });
  }

  return res.status(200).send({ msg: "billingModel deleted.", data: result });
});
