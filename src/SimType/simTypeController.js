const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../helpers/apiError");
const service = require("./simTypeServices");

exports.create = expressAsyncHandler(async (req, res, next) => {
  const { simType } = req.body;
  if (!simType) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.addNew(simType);
  if (result) {
    return res
      .status(201)
      .send({ msg: "simType details added.", data: result });
  } else {
    return res.status(400).send({ msg: "simType details not added" });
  }
});

// GET ALL
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.getAll();
  if (result) {
    return res.status(201).send({ msg: "All simType types", data: result });
  } else {
    return res.status(400).send({ msg: "simType Not Found" });
  }
});

// GET ONE SPECIFIC MAILER
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  console.log(id);
  const result = await service.getByUserID(id);
  if (result) {
    return res.status(200).send({ msg: "simType details", data: result });
  } else {
    return res.status(400).send({ msg: "simType details not found" });
  }
});

// UPDATE A MAILER
exports.update = expressAsyncHandler(async (req, res, next) => {
  const { simTypeId, simType } = req.body;
  if (!simTypeId || !simType) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.update(simTypeId, simType);
  if (result) {
    return res
      .status(200)
      .send({ msg: "simType details updated.", data: result });
  } else {
    return res.status(400).send({ msg: "simType details not updated" });
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
