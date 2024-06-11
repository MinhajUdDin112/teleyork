const superAdminUserModel = require("../superAdminPanelUser/model");
const planModel = require("../plan/model");
const model = require("../user/model");
const adminModel = require("../adminUser/adminUserModel");
const serviceProviderModel = require("../serviceProvider/model");
const service = {
  states: async () => {
    const users = await superAdminUserModel.countDocuments({ active: true });
    const sp = await planModel.countDocuments({ active: true });
    const plans = await serviceProviderModel.countDocuments({ active: true });
    return { totalUser: users, companies: sp, plans: plans };
  },
  inCompleteEnrollmentUserList: async (userId, serviceProvider) => {
    const result = await model
      .find({
        csr: userId,
        serviceProvider: serviceProvider,
        isEnrollmentComplete: { $in: false },
        firstName: { $exists: true, $ne: "" },
      })
      .populate({
        path: "createdBy",
        select: { _id: 1, name: 1 },
      })
      .sort({ createdAt: -1 });
    return result;
  },
  userByRole: async (role) => {
    const result = await adminModel.find({ role: role });
    return result;
  },
};

module.exports = service;
