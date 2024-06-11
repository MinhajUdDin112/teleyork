const model = require("./model");
const mongoose = require("mongoose");

const service ={
  addNew:async(eligibilityProgramecode,description)=>{
        const data = new model({eligibilityProgramecode,description})
        const result = await data.save()
        return result
    },
  getAll:async()=>{
       const result = await model.find({}); // get  all records
       return result;
    },
  getOne:async(id)=>{
            const result = await model.findById(id); 
            return result;
          },
  updateOne:async(_id,eligibilityProgramecode,description)=>{

           const result = await model.findOneAndUpdate({_id},{eligibilityProgramecode,description},{new:true}); //update one record      
           return result;     
          }, 
  delete:async(id)=> {
          const result = await model.findOneAndUpdate({id},{ deleted: true },{new:true});//delete one record
            return result;
           }
      }


module.exports =service;