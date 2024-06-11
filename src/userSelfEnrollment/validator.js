const Joi = require("joi");
module.exports = {
  verifyZip: Joi.object({
    serviceProvider: Joi.string().required(),
    carrier: Joi.string().required(),
    email: Joi.string()
      .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]+$/)
      .required()
      .messages({
        "string.pattern.base": "Email must be a valid address",
      }),
    zipCode: Joi.string().required(),
  }),
  initialInformation: Joi.object({
    userId: Joi.string().required(),
    firstName: Joi.string().required(),
    middleName: Joi.string().allow(""),
    lastName: Joi.string().required(),
    suffix: Joi.string().allow(""),
    SSN: Joi.string().pattern(/^[0-9]{4}$/),
    DOB: Joi.date().iso().max("now"),
    contact: Joi.string().required(),
    isDifferentPerson: Joi.boolean(),
    BenifitFirstName: Joi.string().allow(""),
    BenifitMiddleName: Joi.string().allow(""),
    BenifitLastName: Joi.string().allow(""),
    BenifitSSN: Joi.string()
      .pattern(/^[0-9]{4}$/)
      .allow(""),
    BenifitDOB: Joi.date().iso().max("now").allow("",null),
  }),
  homeAddressValidation: Joi.object({
    userId: Joi.string().required(),
    address1: Joi.string().required(),
    address2: Joi.string().allow(""),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zip: Joi.string().required(),
    isTerribleTerritory: Joi.boolean().required(),
    isBillAddress: Joi.boolean().required(),
    mallingAddress1: Joi.string().allow(""),
    mallingAddress2: Joi.string().allow(""),
    mallingZip: Joi.string().allow(""),
    mallingState: Joi.string().allow(""),
    mallingCity: Joi.string().allow(""),
  }),
  selectProgram: Joi.object({
    userId: Joi.string().required(),
    program: Joi.string().required(),
  }),
  termsAndConditions: Joi.object({
    userId: Joi.string().required(),
  }),
  selectPlan: Joi.object({
    userId: Joi.string().required(),
    plan: Joi.string().required(),
  }),
  handOver: Joi.object({
    csr: Joi.string().required(),
    userId: Joi.string().required(),
  }),
};
