const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../helpers/apiError");
const service = require("./gradeServices");

exports.create = expressAsyncHandler(async (req, res, next) => {
  const { grade } = req.body;
  if (!grade) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.addNew(grade);
  if (result) {
    return res.status(201).send({ msg: "grade details added.", data: result });
  } else {
    return res.status(400).send({ msg: "grade details not added" });
  }
});

// GET ALL
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.getAll();
  if (result) {
    return res.status(201).send({ msg: "All grade types", data: result });
  } else {
    return res.status(400).send({ msg: "grade Not Found" });
  }
});

// GET ONE SPECIFIC MAILER
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  console.log(id);
  const result = await service.getByUserID(id);
  if (result) {
    return res.status(200).send({ msg: "grade details", data: result });
  } else {
    return res.status(400).send({ msg: "grade details not found" });
  }
});

// UPDATE A MAILER
exports.update = expressAsyncHandler(async (req, res, next) => {
  const { operatingSystemId, grade } = req.body;
  if (!operatingSystemId || !grade) {
    return res.status(400).send({ msg: "Fields Missing" });
  }

  const result = await service.update(operatingSystemId, grade);
  if (result) {
    return res
      .status(200)
      .send({ msg: "grade details updated.", data: result });
  } else {
    return res.status(400).send({ msg: "grade details not updated" });
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
