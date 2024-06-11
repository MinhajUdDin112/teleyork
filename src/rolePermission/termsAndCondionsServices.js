const termsAndConditionsModel = require("../models/termsAndConditionsModel");

const termsAndConditionsServices = {
  getAll: async () => {
    const result = await termsAndConditionsModel.find();
    return result;
  },

  create: async (content) => {
    const newTermCondition = new termsAndConditionsModel({
      content,
    });
    const result = await newTermCondition.save();
    return result;
  },
  getOne: async (id) => {
    const result = await termsAndConditionsModel.findById(id);
    return result;
  },
  update: async (id, content, isActive) => {
    const result = await termsAndConditionsModel.findOneAndUpdate(
      { _id: id },
      { content, isActive },
      { new: true }
    );
    return result;
  },
  delete: async (id) => {
    const result = await termsAndConditionsModel.deleteOne({ _id: id });
    return result;
  },
};

module.exports = termsAndConditionsServices;
