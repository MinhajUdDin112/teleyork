const joi = require("joi");
module.exports = {
  createValidation: joi.object({
    serviceProvider: joi.string().required(),
    createdBy: joi.string().required(),
    name: joi.string().required(),
    description: joi.string(),
    banner: joi.string().allow(""),
    active: joi.boolean(),
    code:joi.string().required()
  }),
  updatedValidation: joi.object({
    serviceProvider: joi.string().required(),
    updatedBy: joi.string().required(),
    acpId: joi.string().required(),
    name: joi.string().optional(),
    description: joi.string().optional(),
    banner: joi.string().optional().allow(""),
    active: joi.boolean(),
    code:joi.string().required()
  }),
};
