const model = require("./zipCodeModels");
const stateModel = require("./stateModel");

const service = {
  insertData: async (mongooseDocuments) => {
    const result = await model.create(mongooseDocuments);
    return result;
  },
  getCityAndStateByZip: async (zipCode) => {
    const result = await model.findOne({
      zipCode: zipCode,
    });
    return result;
  },
  getCityByState: async (state) => {
    const result = await model.find({ state: state }).distinct("city");
    return result;
  },
  getAllUniqueStates: async () => {
    const result = await stateModel.find({});
    return result;
  },
};

module.exports = service;
