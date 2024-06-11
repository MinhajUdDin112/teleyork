const joi=require("joi");
module.exports = {
  createNew: joi.object({
    mno: joi.string().required(),
    carriers: joi.array().required(),
    serviceProvider: joi.string().required(),
    createdBy: joi.string().required(),
  }),
  addNew: joi.object({
    assignedId: joi.string().required(),
    mno: joi.string().required(),
    carrier: joi.string().required(),
    serviceProvider: joi.string().required(),
    createdBy: joi.string().required(),
  }),
  removeCarrier: joi.object({
    assignedId: joi.string().required(),
    mno: joi.string().required(),
    carrier: joi.string().required(),
    serviceProvider: joi.string().required(),
    updatedBy: joi.string().required(),
  }),
};