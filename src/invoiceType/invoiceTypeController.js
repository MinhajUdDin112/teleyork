const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../helpers/apiError");
const service = require("./invoiceTypeServices");

exports.create = expressAsyncHandler(async (req, res, next) => {
  let { typeName, serviceProvider } = req.body;
  if (!typeName || !serviceProvider) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  typeName = typeName.toUpperCase();
  const typeDuplication = await service.checkDuplication(typeName);
  if (typeDuplication) {
    return res.status(400).send({ msg: "type with same name already exist" });
  }
  const result = await service.addNew(typeName, serviceProvider);
  if (result) {
    return res
      .status(201)
      .send({ msg: "invoiceType details added.", data: result });
  } else {
    return res.status(400).send({ msg: "billingModel details not added" });
  }
});

// GET ALL
exports.getAll = expressAsyncHandler(async (req, res) => {
  const { serviceProvider } = req.query;
  const result = await service.getAll(serviceProvider);
  if (result) {
    return res.status(201).send({ msg: "All invoiceType types", data: result });
  } else {
    return res.status(400).send({ msg: "invoiceType Not Found" });
  }
});

// GET ONE SPECIFIC MAILER
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  console.log(id);
  const result = await service.getByUserID(id);
  if (result) {
    return res.status(200).send({ msg: "invoiceType details", data: result });
  } else {
    return res.status(400).send({ msg: "invoiceType details not found" });
  }
});

// UPDATE A MAILER
exports.update = expressAsyncHandler(async (req, res, next) => {
  const { invoiceTypeId, typeName, serviceProvider } = req.body;
  if (!invoiceTypeId || !typeName || !serviceProvider) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.update(invoiceTypeId, typeName, serviceProvider);
  if (result) {
    return res
      .status(200)
      .send({ msg: "billingModel details updated.", data: result });
  } else {
    return res.status(400).send({ msg: "billingModel details not updated" });
  }
});
exports.statusUpdate = expressAsyncHandler(async (req, res, next) => {
  const { invoiceTypeId, active } = req.body;
  if (!invoiceTypeId || active === undefined) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.statusUpdate(invoiceTypeId, active);
  if (result) {
    return res
      .status(200)
      .send({ msg: "invoiceType details updated.", data: result });
  } else {
    return res.status(400).send({ msg: "invoiceType details not updated" });
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
