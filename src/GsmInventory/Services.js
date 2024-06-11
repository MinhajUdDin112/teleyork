const model = require("../simInventory/model");
const mongoose = require("mongoose");
const deviceStatus = require("../utils/deviceStatus");

const service = {
  duplicateCheck: async (SimNumber, unitType, billingModel) => {
    const result = await model.findOne({ SimNumber, unitType, billingModel });
    return result;
  },
  bulkInsert: async (dataArray) => {
    const insertedData = await insertBulkData(dataArray);
    return insertedData;
  },
  getAll: async (serviceProvider) => {
    const result = await model.find({
      serviceProvider,
      unitType: "Cell Phone",
    });
    return result;
  },
  getSimDetails: async (_id) => {
    const result = await model.find({ _id });
    return result;
  },
  getAlignDevices: async (serviceProvider) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      unitType: "Cell Phone",
      status: deviceStatus.INUSE,
    });
    return result;
  },
  getFreeDevices: async (serviceProvider) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      unitType: "Cell Phone",
      status: deviceStatus.AVAILABLE,
    });
    return result;
  },
  getDeActivate: async (serviceProvider) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      unitType: "Cell Phone",
      status: deviceStatus.DEACTIVATED,
    });
    return result;
  },
  getByESN: async (serviceProvider, esn) => {
    const result = await model.findOne({
      serviceProvider: serviceProvider,
      esn: esn,
    });
    return result;
  },
  checkAvailability: async (serviceProvider, carrier, esn) => {
    const result = await model.findOne({
      serviceProvider: serviceProvider,
      carrier: carrier,
      esn: esn,
      status: "available",
    });
    return result;
  },
  esnAddStock: async (
    Uploaded_by,
    carrier,
    SimNumber,
    serviceProvider,
    //team,
    AgentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel,
    make
  ) => {
    const inventoryItem = new model({
      Uploaded_by,
      carrier,
      SimNumber,
      serviceProvider,
      //team,
      AgentType,
      AgentName,
      Model,
      box,
      unitType,
      provisionType,
      IMEI,
      billingModel,
      make,
    });

    const result = await inventoryItem.save();

    return result;
  },
  AddPreEsnActivated: async (
    Uploaded_by,
    carrier,
    SimNumber,
    serviceProvider,
    //team,
    AgentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel,
    make
  ) => {
    const inventoryItem = new model({
      Uploaded_by,
      carrier,
      SimNumber,
      serviceProvider,
      //team,
      AgentType,
      AgentName,
      Model,
      box,
      unitType,
      provisionType,
      IMEI,
      billingModel,
      make,
    });

    const result = await inventoryItem.save();
    return result;
  },
  addAndActivate: async (
    Uploaded_by,
    carrier,
    SimNumber,
    serviceProvider,
    //team,
    AgentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel,
    make
  ) => {
    const inventoryItem = new model({
      Uploaded_by,
      carrier,
      SimNumber,
      serviceProvider,
      //team,
      AgentType,
      AgentName,
      Model,
      box,
      unitType,
      provisionType,
      IMEI,
      billingModel,
      make,
    });

    const result = await inventoryItem.save();
    return result;
  },
  addAndAssignNonActivate: async (
    Uploaded_by,
    carrier,
    SimNumber,
    serviceProvider,
    //team,
    AgentType,
    AgentName,
    Model,
    box,
    unitType,
    provisionType,
    IMEI,
    billingModel,
    make
  ) => {
    const inventoryItem = new model({
      Uploaded_by,
      carrier,
      SimNumber,
      serviceProvider,
      //team,
      AgentType,
      AgentName,
      Model,
      box,
      unitType,
      provisionType,
      IMEI,
      billingModel,
      make,
    });

    const result = await inventoryItem.save();
    return result;
  },
  delete: async (_id) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model.findOneAndUpdate(
      { _id },
      { deleted: true },
      { new: true }
    );
    return result;
  },
};

module.exports = service;
