const model = require("./model");
const projection = require("../config/mongoProjection");
const service = {
  getAll: async (serviceProvider) => {
    const result = await model.find({serviceProvider:{$eq:serviceProvider},active:true}, projection.projection);
    console.log(result)
    return result;
  },
  create: async (serviceProvider,createdBy,name,code,description,banner,active) => {
    const data = new model({serviceProvider,createdBy, name,code, description, banner,active });
    const result = await data.save();
    return result;
  },
  getOne: async (id) => {
    const result = await model.findById(id, projection.projection);
    return result;
  },
  update:async(serviceProvider,updatedBy,_id,name,code,description,banner,active)=>{
    const result=await model.findOneAndUpdate({_id},{serviceProvider,updatedBy,name,code,description,banner,active},{new:true});
    return result;
  }
};
module.exports = service;
