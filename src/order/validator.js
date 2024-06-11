const Joi = require("joi");

module.exports = {
  provideSimValidation: Joi.object({
    serviceProvider:Joi.string().required(),
    type: Joi.string().required(),
    user: Joi.string().required(),
    esn: Joi.string(),
    carrier: Joi.string().required(),
    mdn: Joi.string(),
    hasDevice:Joi.boolean(),
    invoiceType:Joi.string().required()
  }),
};
