const  projection  = require("../config/mongoProjection");
const model = require("../rolePermission/roleModel");
const mongoose = require("mongoose");
const service = {
  get: async () => {
    const result = await model.find(
      { role: { $ne: "Super_Admin" }, isSuperPanelRole: true, active: true },
      projection.projection
    ).populate({
        path: "permissions.subModule",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "permissions.actions",
        select: { _id: 1, name: 1 },
      });
    // .populate({
    //   path: "permissions",
    //   select: { _id: 1, name: 1 },
    // });
    return result;
  },
  inActiveRoles: async () => {
    const result = await model.find(
      { role: { $ne: "Super_Admin" }, active: false, isSuperPanelRole: true },
      projection.projection
    ).populate({
        path: "permissions.subModule",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "permissions.actions",
        select: { _id: 1, name: 1 },
      });
    // .populate({
    //   path: "permissions",
    //   select: { _id: 1, name: 1 },
    // });
    return result;
  },
  getRoleByID: async (_id) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model
      .findById({ _id }, projection.projection)
      .populate({
        path: "permissions.subModule",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "permissions.actions",
        select: { _id: 1, name: 1 },
      });
    // .populate({
    //   path: "permissions",
    //   select: { _id: 1, name: 1 },
    // });
    return result;
  },
  addNew: async (
    permissions,
    role,
    description,
    isSuperPanelRole
  ) => {
    const newRole = new model({
      permissions,
      role,
      description,
      isSuperPanelRole,
    });
    const result = await newRole.save();
    return result;
  },
  update: async (_id, role, description) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model.findOneAndUpdate(
      { _id },
      { role, description },
      { new: true }
    );
    return result;
  },

  updatePermissions: async (_id, permissions) => {
    // permissions = permissions.map((item) => {
    //   return new mongoose.Types.ObjectId(item);
    // });
    const result = await model.findOneAndUpdate(
      { _id },
      { permissions },
      {
        new: true,
      }
    );
    return result;
  },

  updateStatus: async (_id, status) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model.findOneAndUpdate(
      { _id },
      { active: status },
      { new: true }
    );
    return result;
  },

  delete: async (_id) => {
    const result = await model.deleteOne({ _id });
    return result;
  },
};

module.exports = service;
