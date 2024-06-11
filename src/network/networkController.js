const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../helpers/apiError");
const service = require("./networkservices");

exports.create = expressAsyncHandler(async (req, res, next) => {
  const { networkType } = req.body;
  if (!networkType) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.addNew(networkType);
  if (result) {
    return res
      .status(201)
      .send({ msg: "network type details added.", data: result });
  } else {
    return res.status(400).send({ msg: "network type details not added" });
  }
});

// GET ALL
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.getAll();
  if (result) {
    return res.status(201).send({ msg: "All network types", data: result });
  } else {
    return res.status(400).send({ msg: "network types Not Found" });
  }
});

// GET ONE SPECIFIC MAILER
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  console.log(id);
  const result = await service.getByUserID(id);
  if (result) {
    return res.status(200).send({ msg: "network types details", data: result });
  } else {
    return res.status(400).send({ msg: "network types details not found" });
  }
});

// UPDATE A MAILER
exports.update = expressAsyncHandler(async (req, res, next) => {
  const { networkTypeId, networkType } = req.body;
  if (!networkTypeId || !networkType) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.update(networkTypeId, networkType);
  if (result) {
    return res
      .status(200)
      .send({ msg: "networkType details updated.", data: result });
  } else {
    return res.status(400).send({ msg: "networkType details not updated" });
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
    return res.status(200).send({ msg: "mail deleted.", data: result });
  } else {
    return res.status(400).send({ msg: "mail not deleted" });
  }
});
