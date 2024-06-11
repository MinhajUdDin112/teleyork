const joi=require("joi")
module.exports={
    create:joi.object({
        createdBy:joi.string().required(),
        name:joi.string().required(),
        active:joi.boolean()
    }),
    update:joi.object({
        updatedBy:joi.string().required(),
        id:joi.string().required(),
        active:joi.boolean().required()
    })
}