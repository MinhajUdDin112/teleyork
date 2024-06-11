const Joi = require("joi");

// Validation for /billconfig POST endpoint
exports.validateBillConfig = Joi.object({
  billingmodel: Joi.string().required(),
  inventoryType: Joi.string().required(),
  oneTimeCharge: Joi.number().required(),
  monthlyCharge: Joi.array().required(),
  dueDate: Joi.string().required(),
  paymentMethod: Joi.array().required(),
  selectdiscount: Joi.array().required(),
  BillCreationDate: Joi.string().required(),
  ServiceProvider: Joi.string().required(),
  additionalFeature: Joi.array().required(),
  applyLateFee: Joi.string().required(),
  latefeeCharge: Joi.string().required(),
  subsequentBillCreateDate: Joi.string().required(),
});
exports.validateUpdateBillConfig = Joi.object({
  oneTimeCharge: Joi.number(),
  monthlyCharge: Joi.array(),
  dueDate: Joi.string(),
  paymentMethod: Joi.array(),
  selectdiscount: Joi.array(),
  BillCreationDate: Joi.string(),
  ServiceProvider: Joi.string(),
  additionalFeature: Joi.array(),
  applyLateFee: Joi.string(),
  latefeeCharge: Joi.string(),
  subsequentBillCreateDate: Joi.string(),
  applyToCustomer: Joi.string().allow(""),
});
// Validation for /getBillById GET endpoint
exports.validateGetBillById = Joi.object({
  billId: Joi.string().required(),
});

// Validation for /updatebill PUT endpoint
exports.validateUpdateBill = Joi.object({
  billid: Joi.string().required(),
  billingmodel: Joi.string().required(),
  inventoryType: Joi.string().required(),
  oneTimeCharge: Joi.number().required(),
  monthlyCharge: Joi.array().required(),
  dueDate: Joi.string().required(),
  paymentMethod: Joi.array().required(),
  selectdiscount: Joi.array().required(),
  BillCreationDate: Joi.string().required(),
  ServiceProvider: Joi.string().required(),
  additionalFeature: Joi.array().required(),
  applyLateFee: Joi.string().required(),
  latefeeCharge: Joi.string().required(),
  subsequentBillCreateDate: Joi.string().required(),
});
