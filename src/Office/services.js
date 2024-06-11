const model = require("./model");
const mongoose = require("mongoose");
const projection = require("../config/mongoProjection");

const service = {
    addTeam: async (team,company,status) => {
    const data = new model({ team,company,status },projection.projection);
    const result = await data.save();
    return result;
  },
  updateDeparment: async (department,status,departmentId) => {
    const result = await model.findOneAndUpdate(
        {_id:departmentId},
        {
            department,status
        },
         {new:true} 
    )
    return result;
  },
  getDepartments: async (company) => {
    const result = await model.find({ company,deleted:false });
    return result;
  },
  getSingleDepartment: async (_id) => {
    const result = await model.findOne({ _id,deleted:false });
    return result;
  },
  getDepById:async (_id) => {
    const result = await model.findOne({ _id,deleted:false });
    return result;
  },
  delete: async (_id) => {
    const result = await model.findOneAndUpdate({ _id }, { deleted: true },{new:true});
    return result;
  },
};

module.exports = service;