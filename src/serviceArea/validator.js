const Joi = require("joi");

module.exports = {
  changeServiceStateStatus: Joi.object({
    carrier:Joi.string()    .required(),
    state: Joi.string().required(),
    status: Joi.boolean().required(),
  }),
  changeServiceZipStatus: Joi.object({
    carrier:Joi.string().required(),
    zipCode: Joi.number().required(),
    status: Joi.boolean().required(),
  }),
  create:Joi.object({
    carrier:Joi.string().required(),
    state:Joi.string().required(),
    city:Joi.string().required(),
    zip:Joi.string().required(), 
    country:Joi.string().required(),
    abbreviation:Joi.string(),
    population:Joi.string()
  })
};
