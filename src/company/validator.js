const Joi = require("joi");
module.exports = {
  addNew: Joi.object({
    superAdminUser:Joi.string().required(),
    name: Joi.string().required(),
    alias: Joi.string().required(),
    type: Joi.string().required(),
  }),
};
