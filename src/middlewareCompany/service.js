const model = require("./model");
const service = {
  addNew: async (createdBy, name, alias, type) => {
    const data = new model({ createdBy, name, alias, type });
    const result = await data.save();
    return result;
  },
  getAll: async () => {
    const result = await model.find({active:true});
    return result;
  },
  getOne: async (_id) => {
    const result = await model.findOne({ _id });
    return result;
  },
  update: async (_id, updatedBy, name, alias, type) => {
    const result = await model.findOneAndUpdate(
      { _id },
      { updatedBy, name, alias, type },
      { new: true }
    );
    return result;
  },
  updateStatus: async (_id, updatedBy, status) => {
    const result = await model.findOneAndUpdate(
      { _id },
      { updatedBy, active: status },
      {new:true}
    );
    return result;
  },
  inactive: async () => {
    const result = await model.find({active:false});
    return result;
  },
  inactivestatus: async (_id, updatedBy, status) => {
    const result = await model.findOneAndUpdate(
      { _id },
      { updatedBy, active: status },
      {new:true}
    );
    return result;
  },
};
module.exports = service;
