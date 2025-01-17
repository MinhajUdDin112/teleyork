const model = require("./inventoryTypeModel");
const mongoose = require("mongoose");

const service = {
  addNew: async (inventoryType, serviceProvider) => {
    const user = new model({ inventoryType, serviceProvider });

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
    // .populate({
    //   path: "superAdminUser",
    //   select: { name: 1, email: 1, contact: 1 },
    // });
    return result;
  },
  update: async (_id, inventoryType, serviceProvider) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        inventoryType,
        serviceProvider,
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
  checkDup: async (inventoryType) => {
    const result = await model.findOne({ inventoryType });
    return result;
  },
};

module.exports = service;
