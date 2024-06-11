const Joi = require("joi");
module.exports = {
  createNew: Joi.object({
    serviceProvider: Joi.string().required(),
    smtp: Joi.string().required(),
    port: Joi.number().integer().required(),
    host: Joi.string().required(),
    userName: Joi.string().required(),
    mail_Encryption: Joi.string().required(),
    mail_host: Joi.string(),
    email: Joi.string()
      .email()
      .required()
      .pattern(/^[a-zA-Z0-9._%+-]+@gmail\.com$/),
    password: Joi.string()
      .required()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .messages({
        "string.pattern.base":
          "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, 1 special character, and be at least 8 characters long",
      })
      .required(),
  }),
  update: Joi.object({
    id: Joi.string().required(),
    serviceProvider: Joi.string().required(),
    smtp: Joi.string().required(),
    port: Joi.number().integer().required(),
    host: Joi.string().required(),
    userName: Joi.string().required(),
    mail_Encryption: Joi.string().required(),
    mail_host: Joi.string(),
    email: Joi.string()
      .email()
      .required()
      .pattern(/^[a-zA-Z0-9._%+-]+@gmail\.com$/),
    password: Joi.string()
      .required()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .messages({
        "string.pattern.base":
          "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, 1 special character, and be at least 8 characters long",
      })
      .required(),
  }),
};
