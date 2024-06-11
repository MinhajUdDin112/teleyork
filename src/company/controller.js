const expressAsyncHandler = require("express-async-handler");
const { addNew } = require("./validator");
const ApiError = require("../helpers/apiError");
const service = require("./service");
exports.addNewCompany = expressAsyncHandler(async (req, res) => {
  const {superAdminUser, name, alias, type } = req.body;
  const validate = addNew.validate(req.body);
  if (validate.error) {
    return new ApiError(validate.error, 400);
  }
  const result = await service.addNew(superAdminUser,name, alias, type);
  if (result) {
    res.status(201).send({
      msg: "success",
      data: result,
    });
    return;
  } else {
    res.status(400).send({
      msg: "Failed!",
    });
    return;
  }
});
// get all companies
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.getAll();
  res.status(200).send({ msg: "list", data: result });
});

// get by id
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  const result = await service.getOne(id);
  if (result) {
    res.status(200).send({ msg: "Company", data: result });
  } else {
    res.status(404).send({ msg: "Not found" });
  }
});
exports.update = expressAsyncHandler(async (req, res) => {
  const {id,superAdminUser, name, alias, type } = req.body;
  const result = await service.update(id, superAdminUser,name, alias, type);
  if (result) {
    res.status(200).send({
      msg: "success",
      data: result,
    });
    return;
  } else {
    res.status(400).send({
      msg: "Failed!",
    });
    return;
  }
});
