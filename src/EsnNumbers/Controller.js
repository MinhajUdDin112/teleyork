const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../helpers/apiError");
const service = require("./Services");
const model = require("../user/model");
const services = require("../simInventory/service");
const custService = require("../user/service");
const sim = require("../simInventory/model");
const {
  esnAddStock,
  AddPreEsnActivated,
  addAndActivate,
  addAndAssignNonActivate,
  addReprovision,
} = require("./validator");

// exports.create = expressAsyncHandler(async (req, res, next) => {
//   const { Esn } = req.body;
//   if (!Esn) {
//     return res.status(400).send({ msg: "Fields Missing" });
//   }

//   const result = await service.addNew(Esn);
//   if (result) {
//     return res
//       .status(201)
//       .send({ msg: "Esn added.", data: result });
//   } else {
//     return res.status(400).send({ msg: "Esn not added" });
//   }
// });

// // GET ALL
// exports.getAll = expressAsyncHandler(async (req, res) => {
//   const result = await service.getAll();
//   if (result) {
//     return res.status(201).send({ msg: "All Esn types", data: result });
//   } else {
//     return res.status(400).send({ msg: "Esn Not Found" });
//   }
// });

// // GET ONE SPECIFIC MAILER
// exports.getOne = expressAsyncHandler(async (req, res) => {
//   const { id } = req.query;
//   console.log(id);
//   const result = await service.getByUserID(id);
//   if (result) {
//     return res.status(200).send({ msg: "Esn details", data: result });
//   } else {
//     return res.status(400).send({ msg: "Esn details not found" });
//   }
// });

// // UPDATE A MAILER
// exports.update = expressAsyncHandler(async (req, res, next) => {
//   const { deviceTypeId, deviceType } = req.body;
//   if (!deviceTypeId || !deviceType) {
//     return res.status(400).send({ msg: "Fields Missing" });
//   }

//   const result = await service.update(deviceTypeId, deviceType);
//   if (result) {
//     return res
//       .status(200)
//       .send({ msg: "Esn details updated.", data: result });
//   } else {
//     return res.status(400).send({ msg: "Esn details not updated" });
//   }
// });

// //delete user
// exports.delete = expressAsyncHandler(async (req, res) => {
//   const { id } = req.query;
//   if (!id) {
//     return res.status(400).send({ msg: "Fields Missing" });
//   }
//   const result = await service.delete(id);
//   if (result.deletedCount == 0) {
//     return res.status(400).send({ msg: "ID Not found" });
//   }
//   if (result) {
//     return res.status(200).send({ msg: "deviceType deleted.", data: result });
//   } else {
//     return res.status(400).send({ msg: "deviceType not deleted" });
//   }
// });

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
exports.getFreeWirelessDevices = expressAsyncHandler(async (req, res) => {
  const result = await service.getFreeWirelessDevices(
    req.query.serviceProvider
  );
  res.status(200).send({ msg: "list", data: result });
});
exports.availbleWireless = expressAsyncHandler(async (req, res) => {
  try {
    const { serviceProvider, customerId, userId } = req.body;

    // Fetch additional data needed for the update
    const esndata = await service.getFreeWirelessDevices(serviceProvider);
    const enrollment = await custService.getByUserID(customerId);

    // Update the model and store _id in esnId field and SimNumber in esn field
    const updatedResult = await model.findOneAndUpdate(
      { _id: customerId },
      { $set: { esnId: esndata._id, esn: esndata.SimNumber } },
      { new: true }
    );

    await sim.findOneAndUpdate({ _id: enrollment.esnId }, { status: "inUse" });

    // Update the simHistory field
    const simHistoryResult = await services.simHistory(
      enrollment.esn,
      enrollment.serviceProvider,
      userId,
      enrollment._id,
      enrollment.enrollmentId,
      enrollment.plan
    );

    res.status(200).send({
      msg: "success",
      data: updatedResult,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "error", error: "Internal Server Error" });
  }
});
exports.getDeActivate = expressAsyncHandler(async (req, res) => {
  const result = await service.getDeActivate(req.query.serviceProvider);
  res.status(200).send({ msg: "list", data: result });
});
exports.getSimDetails = expressAsyncHandler(async (req, res) => {
  const result = await service.getSimDetails(req.query.tabletId);
  res.status(200).send({ msg: "list", data: result });
});
// get by serial number
exports.getByESN = expressAsyncHandler(async (req, res) => {
  const { serviceProvider, esn } = req.query;
  const result = await service.getByESN(serviceProvider, esn);
  if (result) {
    res.status(200).send({ msg: "Device", data: result });
  } else {
    res.status(404).send({ msg: "Device not found" });
  }
});

//AddSim
exports.esnAddStock = expressAsyncHandler(async (req, res, next) => {
  const {
    Uploaded_by,
    carrier,
    Esn,
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
    make,
  } = req.body;

  const validate = addReprovision.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const duplicateCheck = await service.duplicateCheck(
    SimNumber,
    unitType,
    billingModel
  );

  if (duplicateCheck) {
    return res.status(400).send({ msg: "ESN Already Exist" });
  }
  const result = await service.esnAddStock(
    Uploaded_by,
    carrier,
    Esn,
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
    make
  );
  if (result) {
    res.status(200).send({ msg: "inventry added successfully", data: result });
  } else {
    res.status(404).send({ msg: "inventery not added successfully" });
  }
});

//Add preActivate
exports.AddPreEsnActivated = expressAsyncHandler(async (req, res, next) => {
  const {
    Uploaded_by,
    carrier,
    Esn,
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
    make,
  } = req.body;

  const validate = addReprovision.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const duplicateCheck = await service.duplicateCheck(
    SimNumber,
    unitType,
    billingModel
  );

  if (duplicateCheck) {
    return res.status(400).send({ msg: "ESN Already Exist" });
  }
  const result = await service.AddPreEsnActivated(
    Uploaded_by,
    carrier,
    Esn,
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
    make
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
    Esn,
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
    make,
  } = req.body;

  const validate = addReprovision.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
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
    Esn,
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
    make
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
      Esn,
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
      make,
    } = req.body;

    const validate = addReprovision.validate(req.body);
    if (validate.error) {
      return next(new ApiError(validate.error, 400));
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
      Esn,
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
      make
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

exports.addReprovision = expressAsyncHandler(async (req, res, next) => {
  const {
    Uploaded_by,
    carrier,
    Esn,
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
    make,
  } = req.body;

  const validate = addReprovision.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const duplicateCheck = await service.duplicateCheck(
    SimNumber,
    unitType,
    billingModel
  );

  if (duplicateCheck) {
    return res.status(400).send({ msg: "ESN Already Exist" });
  }
  const result = await service.addReprovision(
    Uploaded_by,
    carrier,
    Esn,
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
    make
  );
  if (result) {
    res.status(200).send({ msg: "inventry added successfully", data: result });
  } else {
    res.status(404).send({ msg: "inventery not added successfully" });
  }
});
