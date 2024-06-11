const Joi=require("joi");
module.exports = {
  createRole: Joi.object({
    permissions: Joi.array().required(),
    role: Joi.string().required(),
    description: Joi.string().optional(),
  }),
  updateRole: Joi.object({
    roleId: Joi.string().required(),
    role: Joi.string().required(),
    description: Joi.string().optional(),
  }),
  updateRolePermissions: Joi.object({
    roleId: Joi.string().required(),
    permissions: Joi.array().required(),
  }),
};
