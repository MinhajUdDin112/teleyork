const { default: mongoose, trusted } = require("mongoose");
const model = require("./model");
const deviceStatus = require("../utils/deviceStatus");
module.exports = {
  bulkInsert: async (dataArray) => {
    const insertedData = await insertBulkData(dataArray);
    return insertedData;
  },
  getAll: async (serviceProvider) => {
    const result = await model.find({ serviceProvider, unitType: "sim" });
    return result;
  },
  getSimDetails: async (_id) => {
    const result = await model.find({ _id });
    return result;
  },
  getAlignDevices: async (serviceProvider) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      unitType: "sim",
      status: deviceStatus.INUSE,
    });
    return result;
  },
  getFreeDevices: async (serviceProvider) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      unitType: "sim",
      status: deviceStatus.AVAILABLE,
    });
    return result;
  },
  getDeActivate: async (serviceProvider) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      unitType: "sim",
      status: deviceStatus.DEACTIVATED,
    });
    return result;
  },
  getBySim: async (SimNumber) => {
    const result = await model
      .findOne({
        SimNumber,
      })
      .populate({
        path: "serviceProvider",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "AgentName",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "AgentType",
        select: { _id: 1, department: 1 },
      })
      .populate({
        path: "carrier",
        select: { _id: 1, name: 1 },
      });
    return result;
  },
  getByUnitType: async (serviceProvider, unitType) => {
    try {
      const result = await model.find({
        serviceProvider,
        unitType,
        status: deviceStatus.AVAILABLE,
      });
      return result;
    } catch (error) {
      console.error("Error during getByUnitType service:", error);
      throw new Error("Internal Server Error");
    }
  },
  getByBillModel: async (serviceProvider, unitType, billingModel, status) => {
    console.log(serviceProvider, unitType, billingModel, status);
    const result = await model
      .find({
        serviceProvider,
        unitType,
        billingModel,
        status,
      })
      .populate({
        path: "serviceProvider",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "AgentName",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "AgentType",
        select: { _id: 1, department: 1 },
      })
      .populate({
        path: "carrier",
        select: { _id: 1, name: 1 },
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
  SimAddStock: async (
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
    billingModel
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
    });

    const result = await inventoryItem.save();

    return result;
  },
  AddPreSimActivated: async (
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
    billingModel
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
    billingModel
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
    billingModel
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
    });

    const result = await inventoryItem.save();
    return result;
  },
  statusUpdate: async (SimNumber) => {
    const result = await model.findOneAndUpdate(
      { SimNumber },
      {
        status: deviceStatus.INUSE,
      }
    );
  },
  duplicateCheck: async (SimNumber, unitType, billingModel) => {
    const result = await model.findOne({ SimNumber, unitType, billingModel });
    return result;
  },
  simHistory: async (
    SimNumber,
    Company_id,
    Assigned_by,
    Assigned_to,
    Enrollment_id,
    Plan_id
  ) => {
    const result = await model.findOneAndUpdate(
      { SimNumber: SimNumber },
      {
        $push: {
          Sim_History: {
            Company_id,
            Assigned_by: new mongoose.Types.ObjectId(Assigned_by),
            Assigned_to,
            Enrollment_id,
            Plan_id,
          },
        },
      }
    );
    return result;
  },
};
const insertBulkData = async (dataArray) => {
  const session = await model.startSession();
  session.startTransaction();
  try {
    const insertedData = await model.insertMany(dataArray, { session });
    await session.commitTransaction();
    session.endSession();
    return insertedData;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
