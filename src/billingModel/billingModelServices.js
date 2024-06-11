const model = require("./billingModel");
const mongoose = require("mongoose");

const service = {
  addNew: async (billingModel, serviceProvider, inventory) => {
    const user = new model({
      billingModel,
      serviceProvider,
      inventory,
      active: true,
    });

    const result = await user.save();
    return result;
  },
  getAll: async (serviceProvider) => {
    const users = await model.find({
      active: true,
      deleted: false,
      serviceProvider: serviceProvider,
    });
    return users;
  },
  getInactiveList: async (serviceProvider) => {
    const users = await model.find({
      active: false,
      serviceProvider: serviceProvider,
    });
    return users;
  },
  getByUserID: async (_id) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model.findById(_id).populate({
      path: "serviceProvider",
    });
    return result;
  },
  getInventoryByBillModel: async (_id) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model.findById(_id);
    return result;
  },
  update: async (_id, billingModel, serviceProvider, Inventory) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        billingModel,
        serviceProvider,
        inventory: Inventory,
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
};

module.exports = service;
