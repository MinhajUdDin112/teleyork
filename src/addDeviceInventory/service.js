const model = require("./model");
const mongoose = require("mongoose");
const service = {
  addNew: async (
    company,
    networkType,
    simType,
    operatingSystem,
    dataCapable,
    grade,
    deviceType,
    imeiType,
    make,
    price
  ) => {
    const data = new model({
      company,
      networkType,
      simType,
      operatingSystem,
      dataCapable,
      grade,
      deviceType,
      imeiType,
      make,
      price,
    });
    const result = await data.save();
    return result;
  },
  get: async (company) => {
    const users = await model.find({ company }, { deleted: false });
    return users;
  },
  getByID: async (_id) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const users = await model.find(_id);
    return users;
  },
  updateDevice: async (
    company,
    deviceId,
    networkType,
    simType,
    operatingSystem,
    dataCapable,
    grade,
    deviceType,
    imeiType,
    make,
    price
  ) => {
    const result = await model.findOneAndUpdate(
      { _id: deviceId },
      {
        company: new mongoose.Types.ObjectId(company),

        networkType,
        simType,
        operatingSystem,
        dataCapable,
        grade,
        deviceType,
        imeiType,
        make,
        price,
      },
      { new: true }
    );
    return result;
  },
  getPhoneDeviceModel: async () => {
    const result = await model.find({ deviceType: "PHONE" });
    return result;
  },
  getTabletDeviceModel: async () => {
    const result = await model.find({ deviceType: "tablet" });
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
