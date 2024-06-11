const model = require("./model");
const mongoose = require("mongoose");
const projection = require("../config/mongoProjection");
const service = {
  get: async () => {
    const result = await model.find({active:true}, projection.projection);
    return result;
  },
  getByUserID: async (_id) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model.findById({ _id }, projection.projection);
    return result;
  },
  create: async (createdBy,name, active) => {
    user = new model({
      createdBy,
      name,
      active,
    });
    const result = await user.save();
    return result;
  },
  update: async (_id,updatedBy, active) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        updatedBy,
        active,
      },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model.deleteOne({ _id });
    return result;
  },
  updateCarrier: async (updatedBy, name, id) => {
    try {
      // Find the carrier by ID
      const carrier = await model.findById(id,updatedBy);

      if (!carrier) {
        return null; // Carrier not found
      }

      // Update the name
      carrier.name = name;

      // Save the updated carrier
      const updatedCarrier = await carrier.save();

      return updatedCarrier;
    } catch (error) {
      throw error; // Handle the error appropriately in your application
    }
  },
  inactivelist:async()=>{
    const result = await model.find({active:false})
    return result
  }
};

module.exports=service