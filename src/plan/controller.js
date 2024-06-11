const expressAsyncHandler = require("express-async-handler");
const service = require("./service");
const { createValidation, updateValidation } = require("./validator");
const ApiError = require("../helpers/apiError");
const model = require("./model");

exports.getAll = expressAsyncHandler(async (req, res) => {
  try {
    const { serviceProvider } = req.query;
    const result = await service.get(serviceProvider);
    res.status(200).send({ msg: "Plans", data: result });
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: "Internal server error" });
  }
});
exports.getPlansByInventoryType = expressAsyncHandler(async (req, res) => {
  try {
    const { serviceProvider, inventoryType } = req.query;
    console.log(req.query);
    const result = await service.getPlanByInventoryType(
      serviceProvider,
      inventoryType
    );
    res.status(200).send({ msg: "Plans", data: result });
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: "Internal server error" });
  }
});
exports.getPlanByTypeandInventory = expressAsyncHandler(async (req, res) => {
  try {
    const { serviceProvider, inventoryType, type } = req.query;
    const result = await service.getPlanByTypeandInventory(
      serviceProvider,
      inventoryType,
      type
    );
    res.status(200).send({ msg: "Plans", data: result });
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: "Internal server error" });
  }
});
exports.getByInventoryType = expressAsyncHandler(async (req, res) => {
  try {
    const { billingModel, inventoryType, serviceProvider } = req.query;
    const result = await service.getByInventoryType(
      billingModel,
      inventoryType,
      serviceProvider
    );
    res.status(200).send({ msg: "Plans", data: result });
  } catch {
    console.log(error);
    res.status(500).send({ msg: "Internal server error" });
  }
});
exports.getSPPlane = expressAsyncHandler(async (req, res) => {
  try {
    const { serviceProvider } = req.query;
    const result = await service.getSPPlan(serviceProvider);
    res.status(200).send({ msg: "Plans", data: result });
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: "Internal server error" });
  }
});
exports.updateStatus = expressAsyncHandler(async (req, res) => {
  const { id, serviceProvider, updatedBy, status } = req.body;
  const result = await service.updateStatus(
    id,
    serviceProvider,
    updatedBy,
    status
  );
  if (result) {
    return res.status(200).send({ msg: "Success", data: result });
  } else {
    return res.status(400).send({ msg: "Failed!" });
  }
});
exports.getalldeactiveplans = expressAsyncHandler(async (req, res) => {
  const { serviceProvider } = req.query;
  const plans = await model.find({ serviceProvider, active: false });
  if (plans) {
    return res.status(200).send({ msg: "deactivated plans", data: plans });
  } else {
    return res.status(400).send({ msg: "Something Went Wrong" });
  }
});
exports.getOne = expressAsyncHandler(async (req, res) => {
  try {
    const { planId } = req.query;
    const result = await service.getOne(planId);
    if (result) {
      res.status(200).send({ msg: "Plans", data: result });
    } else {
      res.status(404).send({ msg: "Not Found!" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: "Internal server error" });
  }
});
exports.createPlan = expressAsyncHandler(async (req, res, next) => {
  const {
    createdBy,
    serviceProvider,
    name,
    description,
    type,
    dataAllowance,
    dataAllowanceUnit,
    voiceAllowance,
    voiceAllowanceUnit,
    textAllowance,
    textAllowanceUnit,
    duration,
    durationUnit,
    price,
    additionalFeatures,
    termsAndConditions,
    restrictions,
    planId,
    inventoryType,
  } = req.body;
  const validate = createValidation.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const planExist = await model.findOne({
    serviceProvider: serviceProvider,
    planId: planId,
    type: type,
    inventoryType: inventoryType,
  });

  if (planExist) {
    return res.status(400).send({ msg: "this plan already exist" });
  }

  const planNameExist = await model.findOne({
    serviceProvider: serviceProvider,
    name: name,
    type: type,
    inventoryType: inventoryType,
  });
  console.log(planNameExist);
  if (planNameExist) {
    return res.status(400).send({ msg: "plan with same name already exist" });
  }

  const result = await service.create(
    createdBy,
    serviceProvider,
    name,
    description,
    type,
    dataAllowance,
    dataAllowanceUnit,
    voiceAllowance,
    voiceAllowanceUnit,
    textAllowance,
    textAllowanceUnit,
    duration,
    durationUnit,
    price,
    additionalFeatures,
    termsAndConditions,
    restrictions,
    planId,
    inventoryType
  );
  if (result) {
    return res
      .status(201)
      .send({ msg: "Plan Created successfully", data: result });
  } else {
    return res.status(400).send({ msg: "Failed!" });
  }
});
exports.addPlanInBulk = expressAsyncHandler(async (req, res, next) => {
  const result = await service.bulkInsert(req.body);
  if (result) {
    return res
      .status(201)
      .send({ msg: "Plan Created successfully", data: result });
  } else {
    return res.status(400).send({ msg: "Failed!" });
  }
});
exports.updatePlan = expressAsyncHandler(async (req, res, next) => {
  const { _id } = req.query;
  const {
    updatedBy,
    serviceProvider,
    planId,
    name,
    description,
    type,
    dataAllowance,
    dataAllowanceUnit,
    voiceAllowance,
    voiceAllowanceUnit,
    textAllowance,
    textAllowanceUnit,
    duration,
    durationUnit,
    price,
    additionalFeatures,
    termsAndConditions,
    restrictions,
    inventoryType,
  } = req.body;
  const validate = updateValidation.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const result = await service.updatePlan(
    _id,
    updatedBy,
    serviceProvider,
    planId,
    name,
    description,
    type,
    dataAllowance,
    dataAllowanceUnit,
    voiceAllowance,
    voiceAllowanceUnit,
    textAllowance,
    textAllowanceUnit,
    duration,
    durationUnit,
    price,
    additionalFeatures,
    termsAndConditions,
    restrictions,
    inventoryType
  );
  if (result) {
    return res
      .status(200)
      .send({ msg: "Plan  updated Successfully", data: result });
  } else {
    res.status(500).json({ error: `Internal Server Error` });
  }
});
