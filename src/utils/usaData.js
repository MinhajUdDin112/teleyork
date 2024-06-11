const express =require("express");
const usaDataRouter=express.Router();
const expressAsyncHandler = require("express-async-handler");
var UsaStates = require("usa-states").UsaStates;
usaDataRouter.get("/states",expressAsyncHandler(async(req,res)=>{
var usStates = new UsaStates();
console.log(usStates.states.length);
res.status(200).send({msg:"List",data:usStates.states})
}));
usaDataRouter.get(
  "/city",
  expressAsyncHandler(async (req, res) => {
    var usStates = new UsaStates();
    console.log(usStates.cities);
    res.status(200).send({ msg: "List", data: usStates.cities });
  })
);
module.exports=usaDataRouter