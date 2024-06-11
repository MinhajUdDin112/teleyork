const roleModel = require("./roleModel");
const mongoose = require("mongoose");
const roleServices = {
  get: async (serviceProvider) => {
    console.log(serviceProvider);
    const result = await roleModel
      .find({
        serviceProvider: serviceProvider,
        role: { $ne: "Super_Admin" },
        isSuperPanelRole: false,
        active: true,
      })
      .populate({
        path: "permissions.subModule",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "permissions.actions",
        select: { _id: 1, name: 1 },
      });
    return result;
  },
  // api for getting data of required roles:
  getLabelRole: async (serviceProvider) => {
    console.log(serviceProvider);
    const result = await roleModel
      .find({
        serviceProvider: serviceProvider,
        role: { $in: ["CSR", "TEAM LEAD", "QA AGENT"] },
        isSuperPanelRole: false,
        active: true,
      })
      .populate({
        path: "permissions.subModule",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "permissions.actions",
        select: { _id: 1, name: 1 },
      });
    return result;
  },
  getRoleByID: async (_id) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await roleModel
      .findById({ _id })
      .populate({
        path: "permissions.subModule",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "permissions.actions",
        select: { _id: 1, name: 1 },
      });
    return result;
  },
  addNew: async (
    serviceProvider,
    permissions,
    role,
    description,
    isSuperPanelRole
  ) => {
    const newRole = new roleModel({
      serviceProvider,
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
    const result = await roleModel.findOneAndUpdate(
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
    const result = await roleModel.findOneAndUpdate(
      { _id },
      { permissions },
      {
        new: true,
      }
    );
    return result;
  },
  inActiveRoles: async () => {
    const result = await roleModel
      .find({
        role: { $ne: "Super_Admin" },
        active: false,
        isSuperPanelRole: false,
      })
      .populate({
        path: "permissions.subModule",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "permissions.actions",
        select: { _id: 1, name: 1 },
      });
    return result;
  },
  updateStatus: async (_id, status) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await roleModel.findOneAndUpdate(
      { _id },
      { active: status },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    //const filter = { _id: _id };
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await roleModel.findOneAndUpdate({ _id }, { deleted: true });
    return result;
  },
};

module.exports = roleServices;
