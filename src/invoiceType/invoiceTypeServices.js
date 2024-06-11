const model = require("./invoiceTypeModel");
const mongoose = require("mongoose");

const service = {
  addNew: async (typeName, serviceProvider) => {
    const user = new model({ typeName, serviceProvider, active: true });

    const result = await user.save();
    return result;
  },
  getAll: async (serviceProvider) => {
    const users = await model.find({
      deleted: false,
      serviceProvider: serviceProvider,
    });
    return users;
  },
  getByUserID: async (_id) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model.findById(_id);
    return result;
  },
  update: async (_id, typeName, serviceProvider) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        typeName,
        serviceProvider,
      },
      { new: true }
    );
    return result;
  },
  statusUpdate: async (_id, active) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        active,
      },
      { new: true }
    );
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
  checkDuplication: async (typeName) => {
    const result = await model.findOne({ typeName: typeName });
    return result;
  },
};

module.exports = service;
