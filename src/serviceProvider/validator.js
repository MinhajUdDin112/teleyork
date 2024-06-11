const Joi = require("joi");
module.exports = {
  createNew: Joi.object({
    name: Joi.string().required(),
    alias: Joi.string().required(),
    type: Joi.string().optional(),
    url: Joi.string(),
    email: Joi.string()
      .email()
      .required(),
    phone: Joi.string()
      .required()
      .pattern(/^\+[1-9]\d{1,14}$/),
    zipCode: Joi.string().required(),
    country: Joi.string().required(),
    state: Joi.string().required(),
    subDomain: Joi.string()
      .required()
      .regex(/^[^.]+\.(?:teleyork\.com)$/),
    EIN: Joi.string().required(),
    createdBy: Joi.string().required(),
    address: Joi.string().required(),
    carriers: Joi.array().items(
      Joi.object({
        carrier: Joi.string().required(),
        Mno: Joi.string().required(),
      })
    ),
    
    // MNO: Joi.string().required(),
    // password: Joi.string()
    //   .regex(
    //     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    //   )
    //   .required(),
  }),
  update: Joi.object({
    id: Joi.string().required(),
    name: Joi.string(),
    alias: Joi.string(),
    type: Joi.string(),
    url: Joi.string(),
    phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/),
    zipCode: Joi.string().optional(),
    country: Joi.string().optional(),
    state: Joi.string().optional(),
    subDomain: Joi.string()
      .optional()
      .regex(/^[^.]+\.(?:teleyork\.com)$/),
    EIN: Joi.string().optional(),
    updatedBy: Joi.string(),
    address: Joi.string().optional(),
  }),
  login: Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
  validatePassword: Joi.object({
    id: Joi.string().required(),
    password: Joi.string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .required(),
    reEnterPassword: Joi.string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .required(),
  }),
  verifyOtp: Joi.object({
    email: Joi.string().required(),
    otp: Joi.number().required(),
  }),
};
