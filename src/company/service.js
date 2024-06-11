const model = require("./model");
const service = {
  addNew: async (superAdminUser,name, alias, type) => {
    const data = new model({superAdminUser, name, alias, type });
    const result = await data.save();
    return result;
  },
  getAll: async () => {
    const result = await model.find({});
    return result;
  },
  getOne: async (_id) => {
    const result = await model.findOne({ _id });
    return result;
  },
  update: async (_id,superAdminUser, name, alias, type) => {
    console.log(_id, superAdminUser, name, alias, type);
    const result = await model.findOneAndUpdate(
      { _id },
      {superAdminUser, name, alias, type },
      { new: true }
    );
    return result;
  },
};
module.exports = service;
