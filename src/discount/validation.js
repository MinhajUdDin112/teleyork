const Joi = require('joi');

const discountSchema = Joi.object({
  discountname: Joi.string().required(),
  amount: Joi.string().required(),
  ServiceProvider: Joi.string().required(),
});
const updateDiscountSchema = Joi.object({
    id: Joi.string().required(),
    discountname: Joi.string().required(),
    amount: Joi.string().required(),
    ServiceProvider: Joi.string().required(),
  });
module.exports = {
  discountSchema,
  updateDiscountSchema
};