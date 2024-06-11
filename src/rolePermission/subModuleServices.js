const { default: mongoose } = require("mongoose");
const subModuleModel = require("./subModuleModel");
const subModuleServices = {
  new: async (module, name, route, icon = "", orderPosition,actions) => {
    const result = await subModuleModel.create({
      module: new mongoose.Types.ObjectId(module),
      name,
      route,
      icon,
      orderPosition,
      actions,
    });
    return result;
  },

  getById: async (id) => {
    const result = await subModuleModel.findById(id).populate({path:"actions"});
    return result;
  },

  getAll: async () => {
    const result = await subModuleModel.find({}).populate({path:"actions"});
    return result;
  },

  isExist: async (module, name) => {
    const result = await subModuleModel.findOne({ module, name });
    return result;
  },
  isOrderPositionExist: async (module, orderPosition) => {
    const result = await subModuleModel.findOne({ module, orderPosition });
    return result;
  },

  getOrderPosition: async (module) => {
    const result = await subModuleModel
      .findOne({ module })
      .sort("-orderPosition");
    if (result) {
      return result.orderPosition + 1;
    }
    return 1;
  },
  getByModule: async (module) => {
    const result = await subModuleModel.find({ module });
    return result;
  },

  updateById: async (id, name, route) => {
    const result = await subModuleModel.findByIdAndUpdate(
      id,
      { name, route },
      { new: true }
    );
    return result;
  },
};

module.exports = subModuleServices;
