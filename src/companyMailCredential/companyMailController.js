const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const authIdServices = require("../auth/authIdServices");
const jwtService = require("../utils/jwtServices");
const bcrypt = require("bcrypt");
const encrypt = require("../utils/encryptionService");
const { createNew, update } = require("./validator");
const ApiError = require("../helpers/apiError");
const service = require("./companyMailservices");
const model = require("./companyMailModel");

// CREATE NEW MAILER
exports.create = expressAsyncHandler(async (req, res, next) => {
  const {
    serviceProvider,
    smtp,
    port,
    userName,
    mail_Encryption,
    host,
    email,
    password,
  } = req.body;
  const validate = createNew.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }

  /* const salt = await bcrypt.genSalt(10);
  var pass = await bcrypt.hash(req.body.password, salt); */
  const pass = await encrypt.encryption(req.body.password);

  const result = await service.addNew(
    serviceProvider,
    smtp,
    port,
    userName,
    mail_Encryption,
    host,
    email,
    pass
  );
  if (result) {
    return res.status(201).send({ msg: "mailer details added.", data: result });
  } else {
    return res.status(400).send({ msg: "mailer details not added" });
  }
});

// GET ALL MAILERS
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.getAll();
  if (result) {
    return res.status(201).send({ msg: "All Mails", data: result });
  } else {
    return res.status(400).send({ msg: "Mails Not Found" });
  }
});

// GET ONE SPECIFIC MAILER
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  console.log(id);
  const result = await service.getByUserID(id);
  if (result) {
    return res.status(200).send({ msg: "mailer details", data: result });
  } else {
    return res.status(400).send({ msg: "mailer details not found" });
  }
});

// UPDATE A MAILER
exports.update = expressAsyncHandler(async (req, res, next) => {
  const {
    id,
    serviceProvider,
    smtp,
    port,
    userName,
    mail_Encryption,
    host,
    email,
    password,
  } = req.body;
  const validate = update.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }

  const salt = await bcrypt.genSalt(10);
  var pass = await bcrypt.hash(req.body.password, salt);

  const result = await service.update(
    id,
    serviceProvider,
    smtp,
    port,
    userName,
    mail_Encryption,
    host,
    email,
    pass
  );
  if (result) {
    return res.status(200).send({ msg: "mail details updated.", data: result });
  } else {
    return res.status(400).send({ msg: "mail details not updated" });
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
