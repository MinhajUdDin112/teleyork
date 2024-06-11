const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../helpers/apiError");
const service = require("./dataCapableServices");

exports.create = expressAsyncHandler(async (req, res, next) => {
  const { dataCapable } = req.body;
  if (!dataCapable) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.addNew(dataCapable);
  if (result) {
    return res
      .status(201)
      .send({ msg: "dataCapable details added.", data: result });
  } else {
    return res.status(400).send({ msg: "dataCapable details not added" });
  }
});

// GET ALL
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.getAll();
  if (result) {
    return res.status(201).send({ msg: "All dataCapable types", data: result });
  } else {
    return res.status(400).send({ msg: "dataCapable Not Found" });
  }
});

// GET ONE SPECIFIC MAILER
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  console.log(id);
  const result = await service.getByUserID(id);
  if (result) {
    return res.status(200).send({ msg: "dataCapable details", data: result });
  } else {
    return res.status(400).send({ msg: "dataCapable details not found" });
  }
});

// UPDATE A MAILER
exports.update = expressAsyncHandler(async (req, res, next) => {
  const { dataCapableId, dataCapable } = req.body;
  if (!dataCapableId || !dataCapable) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.update(dataCapableId, dataCapable);
  if (result) {
    return res
      .status(200)
      .send({ msg: "dataCapable details updated.", data: result });
  } else {
    return res.status(400).send({ msg: "dataCapable details not updated" });
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
