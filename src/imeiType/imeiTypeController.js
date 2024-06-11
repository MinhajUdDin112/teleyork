const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../helpers/apiError");
const service = require("./imeiTypeServices");

exports.create = expressAsyncHandler(async (req, res, next) => {
  const { imeiType } = req.body;
  if (!imeiType) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.addNew(imeiType);
  if (result) {
    return res
      .status(201)
      .send({ msg: "imeiType details added.", data: result });
  } else {
    return res.status(400).send({ msg: "imeiType details not added" });
  }
});

// GET ALL
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.getAll();
  if (result) {
    return res.status(201).send({ msg: "All imeiType types", data: result });
  } else {
    return res.status(400).send({ msg: "imeiType Not Found" });
  }
});

// GET ONE SPECIFIC MAILER
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  console.log(id);
  const result = await service.getByUserID(id);
  if (result) {
    return res.status(200).send({ msg: "imeiType details", data: result });
  } else {
    return res.status(400).send({ msg: "imeiType details not found" });
  }
});

// UPDATE A MAILER
exports.update = expressAsyncHandler(async (req, res, next) => {
  const { imeiTypeId, imeiType } = req.body;
  if (!imeiTypeId || !imeiType) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.update(imeiTypeId, imeiType);
  if (result) {
    return res
      .status(200)
      .send({ msg: "imeiType details updated.", data: result });
  } else {
    return res.status(400).send({ msg: "imeiType details not updated" });
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
    return res.status(200).send({ msg: "imeiType deleted.", data: result });
  } else {
    return res.status(400).send({ msg: "imeiType not deleted" });
  }
});
