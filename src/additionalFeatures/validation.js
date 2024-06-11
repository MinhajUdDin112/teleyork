const Joi = require('joi');

const FeaturesSchema = Joi.object({
  featureName: Joi.string().required(),
  featureAmount: Joi.string().required(),
  ServiceProvider: Joi.string().required(),
});
const updateFeaturesSchema = Joi.object({
    id: Joi.string().required(),
    featureName: Joi.string().required(),
    featureAmount: Joi.string().required(),
    ServiceProvider: Joi.string().required(),
  });
module.exports = {
  FeaturesSchema,
  updateFeaturesSchema
};