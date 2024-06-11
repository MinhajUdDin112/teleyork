const model = require("../simInventory/model");
const mongoose = require("mongoose");
const deviceStatus = require("../utils/deviceStatus");

const service = {
  // addNew: async (Esn) => {
  //   const user = new model({ Esn });

  //   const result = await user.save();
  //   return result;
  // },
  // getAll: async () => {
  //   const users = await model.find({ deleted: false });
  //   return users;
  // },
  // getByUserID: async (_id) => {
  //   var _id = new mongoose.Types.ObjectId(_id);
  //   const result = await model.findById(_id);
  //   // .populate({
  //   //   path: "superAdminUser",
  //   //   select: { name: 1, email: 1, contact: 1 },
  //   // });
  //   return result;
  // },
  // update: async (_id, deviceType) => {
  //   const result = await model.findOneAndUpdate(
  //     { _id },
  //     {
  //       deviceType,
  //     },
  //     { new: true }
  //   );
  //   return result;
  // },
  bulkInsert: async (dataArray) => {
    const insertedData = await insertBulkData(dataArray);
    return insertedData;
  },
  getAll: async (serviceProvider) => {
    const result = await model.find({ serviceProvider, unitType: "Tablet" });
    return result;
  },
  getSimDetails: async (_id) => {
    const result = await model.find({ _id });
    return result;
  },
  getAlignDevices: async (serviceProvider) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      unitType: "Tablet",
      status: deviceStatus.INUSE,
    });
    return result;
  },
  getFreeDevices: async (serviceProvider) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      unitType: "Tablet",
      status: deviceStatus.AVAILABLE,
    });
    return result;
  },

  getDeActivate: async (serviceProvider) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      unitType: "Tablet",
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
  getFreeWirelessDevices: async (
    serviceProvider,
    selectProduct,
    accountType
  ) => {
    let unitType;
    if (selectProduct === "Wireless Device") {
      unitType = "Wireless Device";
    } else if (selectProduct === "WIRELESS DEVICE") {
      unitType = "WIRELESS DEVICE";
    } else if (selectProduct === "SIM CARD") {
      unitType = "SIM CARD";
    } else if (selectProduct === "SIM") {
      unitType = "SIM";
    } else {
      unitType = selectProduct;
    }
    let accType;
    if (accountType === "Prepaid") {
      accType = "PREPAID";
    } else {
      accType = "POSTPAID";
    }
    console.log(unitType, accType);
    const result = await model.findOne({
      serviceProvider: serviceProvider,
      unitType: unitType,
      status: "available",
      billingModel: accType,
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
  addReprovision: async (
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
  duplicateCheck: async (SimNumber, unitType, billingModel) => {
    const result = await model.findOne({ SimNumber, unitType, billingModel });
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
  activatedEsn: async (
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
    Sim_History
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
      status: "inUse",
      unitType,
      provisionType,
      IMEI,
      billingModel,
      make,
      Sim_History,
    });

    const result = await inventoryItem.save();
    return result;
  },
};

module.exports = service;
