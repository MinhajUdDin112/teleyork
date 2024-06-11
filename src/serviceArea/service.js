const model = require("./model");
const service = {
  getAll: async () => {
    const result = await model.find({});
    return result;
  },
  create: async (
    carrier,
    state, city, zipCode, abbreviation, population, country
    ) => {
    const data =new model({
      carrier,
      state,
      city,
      zipCode,
      abbreviation,
      population,
      country,
    });
    const result = await data.save();
    return result;
  },
  isServiceZipCode: async (carrier, zipCode) => {
    const result = await model.findOne({
      carrier:carrier,
      zipCode,
      active: true,
    });
    return result;
  },
  changeServiceStateStatus: async (carrier,state, status) => {
    const result = await model.updateOne(
      { carrier, state },
      { active:status },
      { new: true }
    );
    return result;
  },
  changeServiceZipStatus: async (carrier,zipCode, status) => {
    const result = await model.findOneAndUpdate(
      { carrier,zipCode },
      { active: status },
      { new: true }
    );
    return result;
  },
};
module.exports = service;
