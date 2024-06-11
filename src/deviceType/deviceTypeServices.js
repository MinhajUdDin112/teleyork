const model = require("./deviceTypeModel");
const mongoose = require("mongoose");

const service = {
  addNew: async (deviceType) => {
    const user = new model({ deviceType });

    const result = await user.save();
    return result;
  },
  getAll: async () => {
    const users = await model.find({ deleted: false });
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
  update: async (_id, deviceType) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        deviceType,
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
