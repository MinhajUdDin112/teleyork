const model = require("./sacModels");

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
  getCityByState: async (state, serviceProvider) => {
    console.log(state, serviceProvider);
    const result = await model.findOne({
      state: state,
      serviceProvider: serviceProvider,
    });
    console.log(result)
    return result;
  },
};

module.exports = service;
