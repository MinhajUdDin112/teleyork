const expressAsyncHandler = require("express-async-handler");
const { addNew,updateMiddlewareCompany } = require("./validator");
const ApiError = require("../helpers/apiError");
const service = require("./service");
exports.addNewCompany = expressAsyncHandler(async (req, res) => {
  const { createdBy, name, alias, type } = req.body;
  const validate = addNew.validate(req.body);
  if (validate.error) {
    return new ApiError(validate.error, 400);
  }
  const result = await service.addNew(createdBy, name, alias, type);
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
//inactive all
exports.inactive = expressAsyncHandler(async (req, res) => {
  const result = await service.inactive();
  res.status(200).send({ msg: "list of inactive", data: result });
});
// get by id
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  const result = await service.getOne(id);
  if (result) {
    res.status(200).send({ msg: "Middleware Company", data: result });
  } else {
    res.status(404).send({ msg: "Not found" });
  }
});
exports.updateStatus = expressAsyncHandler(async (req, res) => {
  const { id, updatedBy, status } = req.body;
  const result = await service.updateStatus(id, updatedBy, status);
  if (result) {
    return res.status(200).send({ msg: "Success", data: result });
  } else {
    return res.status(400).send({ msg: "Failed!" });
  }
});
exports.update = expressAsyncHandler(async (req, res) => {
   const validate = updateMiddlewareCompany.validate(req.body);
  // console.log(validate)
  if (validate.error) {
    return new ApiError(validate.error, 400);
  }
  const { mwc_id, updatedBy, name, alias, type } = req.body;
  const result = await service.update(mwc_id, updatedBy, name, alias, type);
  console.log(result)
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
