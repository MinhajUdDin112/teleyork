const expressAsyncHandler = require("express-async-handler");
const AppError = require("../helpers/apiError");
const service = require("./service");
const simModel = require("../simInventory/model");
const {
  SimAddStock,
  AddPreSimActivated,
  addAndActivate,
  addAndAssignNonActivate,
} = require("./validator");

exports.saveDeviceInventory = expressAsyncHandler(async (req, res, next) => {
  const result = await service.bulkInsert(req.body);
  if (result) {
    return res.status(201).send({
      msg: "success",
      data: result,
    });
  } else {
    return res.status(400).send({
      msg: "Failed!",
    });
  }
});
// get all devices
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.getAll(req.query.serviceProvider);
  res.status(200).send({ msg: "list", data: result });
});
//align devices
exports.getAlignDevice = expressAsyncHandler(async (req, res) => {
  const result = await service.getAlignDevices(req.query.serviceProvider);
  res.status(200).send({ msg: "list", data: result });
});
//get free devices
exports.getFreeDevices = expressAsyncHandler(async (req, res) => {
  const result = await service.getFreeDevices(req.query.serviceProvider);
  res.status(200).send({ msg: "list", data: result });
});
exports.getDeActivate = expressAsyncHandler(async (req, res) => {
  const result = await service.getDeActivate(req.query.serviceProvider);
  res.status(200).send({ msg: "list", data: result });
});
exports.getSimDetails = expressAsyncHandler(async (req, res) => {
  const result = await service.getSimDetails(req.query.simId);
  res.status(200).send({ msg: "list", data: result });
});
// get by serial number
exports.getByESN = expressAsyncHandler(async (req, res) => {
  const { esn } = req.query;
  const result = await service.getBySim(esn);
  if (result) {
    res.status(200).send({ msg: "ESN", data: result });
  } else {
    res.status(404).send({ msg: "ESN not found" });
  }
});
// get all by UnitType
exports.getByUnitType = expressAsyncHandler(async (req, res) => {
  try {
    const { serviceProvider, unitType } = req.query;

    // Validate input if necessary

    const result = await service.getByUnitType(serviceProvider, unitType);

    if (result.length > 0) {
      return res.status(200).json({ msg: "Data found", result });
    } else {
      return res.status(404).json({ msg: "Data not found" });
    }
  } catch (error) {
    console.error("Error during getByUnitType:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
exports.getByBillModel = expressAsyncHandler(async (req, res) => {
  const { serviceProvider, UnitType, billingModel, status } = req.query;
  const result = await service.getByBillModel(
    serviceProvider,
    UnitType,
    billingModel,
    status
  );
  if (result) {
    return res.status(200).send({ msg: "data", result: result });
  } else {
    res.status(404).send({ msg: "ESN not found" });
  }
});
exports.getesnbyBillingModel = expressAsyncHandler(async (req, res) => {
  try {
    const { billingModel, unitType, serviceProvider } = req.query;
    const bill = billingModel.toUpperCase();
    const unit = unitType.toUpperCase();

    // Find documents matching the provided criteria
    const result = await simModel.find({
      billingModel: bill,
      unitType: unit,
      serviceProvider: serviceProvider,
      status: "available",
    });

    // Send the result back to the client
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    // If an error occurs, handle it gracefully
    console.error("Error fetching ESNs:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

//AddSim
exports.SimAddStock = expressAsyncHandler(async (req, res, next) => {
  const {
    Uploaded_by,
    carrier,
    SimNumber,
    serviceProvider,
    //team,
    agentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel,
  } = req.body;

  const validate = addAndAssignNonActivate.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  const duplicateCheck = await service.duplicateCheck(
    SimNumber,
    unitType,
    billingModel
  );

  if (duplicateCheck) {
    return res.status(400).send({ msg: "ESN Already Exist" });
  }
  const result = await service.SimAddStock(
    Uploaded_by,
    carrier,
    SimNumber,
    serviceProvider,
    //team,
    agentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel
  );
  if (result) {
    res.status(200).send({ msg: "inventry added successfully", data: result });
  } else {
    res.status(404).send({ msg: "inventery not added successfully" });
  }
});

//Add preActivate
exports.AddPreSimActivated = expressAsyncHandler(async (req, res, next) => {
  const {
    Uploaded_by,
    carrier,
    SimNumber,
    serviceProvider,
    //team,
    agentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel,
  } = req.body;

  const validate = addAndAssignNonActivate.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  const duplicateCheck = await service.duplicateCheck(
    SimNumber,
    unitType,
    billingModel
  );

  if (duplicateCheck) {
    return res.status(400).send({ msg: "ESN Already Exist" });
  }
  const result = await service.AddPreSimActivated(
    Uploaded_by,
    carrier,
    SimNumber,
    serviceProvider,
    //team,
    agentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel
  );
  if (result) {
    res.status(200).send({ msg: "inventry added successfully", data: result });
  } else {
    res.status(404).send({ msg: "inventery not added successfully" });
  }
});

// add and activate

exports.addAndActivate = expressAsyncHandler(async (req, res, next) => {
  const {
    Uploaded_by,
    carrier,
    SimNumber,
    serviceProvider,
    //team,
    agentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel,
  } = req.body;

  const validate = addAndAssignNonActivate.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  const duplicateCheck = await service.duplicateCheck(
    SimNumber,
    unitType,
    billingModel
  );

  if (duplicateCheck) {
    return res.status(400).send({ msg: "ESN Already Exist" });
  }
  const result = await service.addAndActivate(
    Uploaded_by,
    carrier,
    SimNumber,
    serviceProvider,
    //team,
    agentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel
  );
  if (result) {
    res.status(200).send({ msg: "inventry added successfully", data: result });
  } else {
    res.status(404).send({ msg: "inventery not added successfully" });
  }
});

//add and assign non activate
exports.addAndAssignNonActivate = expressAsyncHandler(
  async (req, res, next) => {
    const {
      Uploaded_by,
      carrier,
      SimNumber,
      serviceProvider,
      //team,
      agentType,
      AgentName,
      Model,
      box,
      unitType,
      provisionType,
      IMEI,
      billingModel,
    } = req.body;

    const validate = addAndAssignNonActivate.validate(req.body);
    if (validate.error) {
      return next(new AppError(validate.error, 400));
    }

    const duplicateCheck = await service.duplicateCheck(
      SimNumber,
      unitType,
      billingModel
    );

    if (duplicateCheck) {
      return res.status(400).send({ msg: "ESN Already Exist" });
    }

    const result = await service.addAndAssignNonActivate(
      Uploaded_by,
      carrier,
      SimNumber,
      serviceProvider,
      //team,
      agentType,
      AgentName,
      Model,
      box,
      unitType,
      provisionType,
      IMEI,
      billingModel
    );
    if (result) {
      res
        .status(200)
        .send({ msg: "inventry added successfully", data: result });
    } else {
      res.status(404).send({ msg: "inventery not added successfully" });
    }
  }
);

//update Api
exports.update = expressAsyncHandler(async (req, res, next) => {
  const simNumber = req.query.simNumber;
  const updateFields = req.body;
  const simData = await service.getBySim(simNumber);
  if (!simData) {
    return res.status(400).json({ success: false, message: "SIM not found" });
  }
  Object.assign(simData, updateFields);

  // Save changes to the database
  await simData.save();

  // Respond with the updated data
  return res.status(200).send({ success: true, updatedData: simData });

  if (result) {
    res.status(200).send({ msg: "inventry added successfully", data: result });
  } else {
    res.status(404).send({ msg: "inventery not added successfully" });
  }
});
