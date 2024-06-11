const permissionModel = require("./permissionModel");
const mongoose = require("mongoose");

const permissionServices = {
  get: async () => {
    const result = await permissionModel.find({});
    return result;
  },
  addNew: async (name) => {
    const permission = new permissionModel({
      name,
    });
    const result = await permission.save();
    return result;
  },
  update: async (_id, name) => {
    var _id = mongoose.Types.ObjectId(_id);
    const result = await permissionModel.findOneAndUpdate(
      { _id },
      { name },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    //const filter = { _id: _id };
    var _id = mongoose.Types.ObjectId(_id);
    const result = await permissionModel.deleteOne({ _id });
    return result;
  },
};

module.exports = permissionServices;
