const model = require("./roleHeirarchyModel");
const mongoose = require("mongoose");

const service = {
  addHeirarchy: async (role, level) => {
    const data = new model({ role, level });
    const result = await data.save();
    return result;
  },
  getHeirarchyName: async (role) => {
    const result = await model.findOne({ role });
    return result;
  },
};

module.exports = service;
