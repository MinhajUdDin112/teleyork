const userGroupModel = require("./userGroupModel");
const mongoose = require("mongoose");
const projection = require("../config/mongoProjection");

const userGroupServices = {
  get: async () => {
    const result = await userGroupModel.find({}, projection.projection);
    return result;
  },
  getRoleByID: async (_id) => {
    const result = await userGroupModel.findById(
      { _id },
      projection.projection
    );
    return result;
  },
  create: async (name) => {
    const group = new userGroupModel({
      name,
    });
    const result = await group.save();
    return result;
  },
  addUser: async (_id, users) => {
    const result = await userGroupModel.findOneAndUpdate(
      { _id, users: { $ne: users } },
      { $push: { users: users } },
      { new: true }
    );
    return result;
  },
  removeUser: async (_id, users) => {
    const result = await userGroupModel.findOneAndUpdate(
      { _id },
      { $pull: { users: users } },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    const result = await userGroupModel.deleteOne({ _id });
    return result;
  },
};

module.exports = userGroupServices;
