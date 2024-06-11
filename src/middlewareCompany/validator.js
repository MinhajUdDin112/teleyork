const Joi = require("joi");
module.exports = {
  addNew: Joi.object({
    createdBy: Joi.string().required(),
    name: Joi.string().required(),
    alias: Joi.string().required(),
    type: Joi.string().required(),
  }),
   updateMiddlewareCompany: Joi.object({
    updatedBy: Joi.string().required(),
    name: Joi.string().optional(),
    alias: Joi.string().optional(),
    type: Joi.string().optional(),
    mwc_id: Joi.string().required()
  }),
};
