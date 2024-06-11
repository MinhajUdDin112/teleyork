const model = require("./model");

const service = {
  get: async (serviceProvider) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      active: true,
    });

    // .populate({
    //   path: "serviceProvider",
    //   select: { _id: 1, name: 1, email: 1, url: 1, contact: 1 },
    // })
    // .populate({
    //   path: "superAdminUser",
    //   select: { _id: 1, name: 1, email: 1, url: 1, contact: 1 },
    // });
    return result;
  },
  getPlanByInventoryType: async (serviceProvider, inventoryType) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      inventoryType: inventoryType,
      active: true,
    });
    return result;
  },
  getPlanByTypeandInventory: async (serviceProvider, inventoryType, type) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      inventoryType: inventoryType,
      type: type,
      active: true,
    });
    return result;
  },
  getSPPlan: async (serviceProvider) => {
    const result = await model.find({
      serviceProvider: { $eq: serviceProvider },
    });
    return result;
  },
  getByInventoryType: async (billingModel, inventoryType, serviceProvider) => {
    const result = await model.find({
      serviceProvider: serviceProvider,
      inventoryType: inventoryType,
      type: billingModel,
      active: true,
    });
    return result;
  },
  getOne: async (id) => {
    const result = await model.findById(id);
    return result;
  },
  updateStatus: async (_id, serviceProvider, updatedBy, status) => {
    const result = await model.findOneAndUpdate(
      { _id, serviceProvider },
      { updatedBy, active: status },
      { new: true }
    );

    return result;
  },
  create: async (
    createdBy,
    serviceProvider,
    name,
    description,
    type,
    dataAllowance,
    dataAllowanceUnit,
    voiceAllowance,
    voiceAllowanceUnit,
    textAllowance,
    textAllowanceUnit,
    duration,
    durationUnit,
    price,
    additionalFeatures,
    termsAndConditions,
    restrictions,
    planId,
    inventoryType
  ) => {
    const data = new model({
      createdBy,
      serviceProvider,
      name,
      description,
      type,
      dataAllowance,
      dataAllowanceUnit,
      voiceAllowance,
      voiceAllowanceUnit,
      textAllowance,
      textAllowanceUnit,
      duration,
      durationUnit,
      price,
      additionalFeatures,
      termsAndConditions,
      restrictions,
      planId,
      inventoryType,
    });
    const result = await data.save();
    return result;
  },
  bulkInsert: async (dataArray) => {
    const insertedData = await insertBulkData(dataArray);
    return insertedData;
  },
  updatePlan: async (
    _id,
    updatedBy,
    serviceProvider,
    planId,
    name,
    description,
    type,
    dataAllowance,
    dataAllowanceUnit,
    voiceAllowance,
    voiceAllowanceUnit,
    textAllowance,
    textAllowanceUnit,
    duration,
    durationUnit,
    price,
    additionalFeatures,
    termsAndConditions,
    restrictions,
    inventoryType
  ) => {
    console.log(_id);
    const result = await model.findOneAndUpdate(
      { _id: _id, serviceProvider: serviceProvider },
      {
        updatedBy,
        serviceProvider,
        planId,
        name,
        description,
        type,
        dataAllowance,
        dataAllowanceUnit,
        voiceAllowance,
        voiceAllowanceUnit,
        textAllowance,
        textAllowanceUnit,
        duration,
        durationUnit,
        price,
        additionalFeatures,
        termsAndConditions,
        restrictions,
        inventoryType,
      },
      { new: true }
    );
    return result;
  },
};

module.exports = service;
