const { default: mongoose, trusted } = require("mongoose");
const model = require("./model");
const deviceStatus=require("../utils/deviceStatus")
module.exports = {
  bulkInsert: async (dataArray) => {
    const insertedData = await insertBulkData(dataArray);
    return insertedData;
  },
  getAll: async (serviceProvider) => {
    const result = await model.find({ serviceProvider }).populate("carrier");
    return result;
  },
  getAlignDevices: async (serviceProvider) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      status: deviceStatus.INUSE,
    });
    return result;
  },
  getFreeDevices: async (serviceProvider) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      status: deviceStatus.AVAILABLE,
    });
    return result;
  },
  getByMDN: async (serviceProvider, mdn) => {
    const result = await model.findOne({
      serviceProvider: serviceProvider,
      mdn: mdn,
    });
    return result;
  },
checkAvailability: async (serviceProvider,carrier, mdn) => {
    const result = await model.findOne({
      serviceProvider: serviceProvider,
      carrier:carrier,
      mdn: mdn,
      status:"available"
    });
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
}
