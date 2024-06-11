const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../helpers/apiError");
const service = require("./operatingSystemServices");

exports.create = expressAsyncHandler(async (req, res, next) => {
  const { operatingSystem } = req.body;
  if (!operatingSystem) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.addNew(operatingSystem);
  if (result) {
    return res
      .status(201)
      .send({ msg: "operatingSystem details added.", data: result });
  } else {
    return res.status(400).send({ msg: "operatingSystem details not added" });
  }
});

// GET ALL
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.getAll();
  if (result) {
    return res
      .status(201)
      .send({ msg: "All operatingSystem types", data: result });
  } else {
    return res.status(400).send({ msg: "operatingSystem Not Found" });
  }
});

// GET ONE SPECIFIC MAILER
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  console.log(id);
  const result = await service.getByUserID(id);
  if (result) {
    return res
      .status(200)
      .send({ msg: "operatingSystem details", data: result });
  } else {
    return res.status(400).send({ msg: "operatingSystem details not found" });
  }
});

// UPDATE A MAILER
exports.update = expressAsyncHandler(async (req, res, next) => {
  const { operatingSystemId, operatingSystem } = req.body;
  if (!operatingSystemId || !operatingSystem) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.update(operatingSystemId, operatingSystem);
  if (result) {
    return res
      .status(200)
      .send({ msg: "operatingSystem details updated.", data: result });
  } else {
    return res.status(400).send({ msg: "operatingSystem details not updated" });
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
