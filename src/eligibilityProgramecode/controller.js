const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const service = require("./service");
const model = require("./model");
/* const { createNew,addNew,removeCarrier } = require("./validator"); */

exports.addEligibility=expressAsyncHandler(async(req, res)=>{

    const{eligibilityProgramecode,description}=req.body;

    if(!eligibilityProgramecode || !description) {
           return res.status(404).send({message:"eligibilityPromgramecode And description required"})
    }
    const result = await service.addNew(eligibilityProgramecode,description)
    if(result){
        return res.status(200).send({message:"eligibilityPromgramecode", data:result})
    }else{
        return res.status(400).send({message:"error not added"})

    }
});

exports.getAll=expressAsyncHandler(async (req, res) => {

const result=await service.getAll();
if(result){
    return res.status(200).send({message:"eligibilityPromgramecode", data:result});
}else{
    return res.status(400).send({message:"error not getting data"})

}

});

exports.getOne=expressAsyncHandler(async (req, res) => {

    const {codeId}=req.query;
    const result= await service.getOne(codeId);
    if(result){
        return res.status(200).send({message:"eligibilityPromgramecode get one", data:result});
    }else{
        return res.status(400).send({message:"error not getting data"})
    
    }

});

exports.updateOne=expressAsyncHandler(async(req, res)=>{
    const{_id,eligibilityProgramecode,description}=req.body;
    
    if(!eligibilityProgramecode || !description ) {
        return res.status(404).send({message:"eligibilityPromgramecode And description not found"})
    }
    const result = await service.updateOne(_id,eligibilityProgramecode,description)
    if(result){
        return res.status(200).send({message:"eligibilityPromgramecode updated", data:result})
    }else{
        return res.status(400).send({message:"error not updated"})

    }



})

exports.delete=expressAsyncHandler(async (req, res) => {

    const {codeId}=req.query;
    const result= await service.delete(codeId);
    if (result) {
        res.status(200).send({ message: 'eligibilityPromgramecode deleted', data: result});
    } else {
        res.status(404).send({ message: 'Item not found' });
    }
    });  