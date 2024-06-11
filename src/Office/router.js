const express = require("express");
const router = express.Router();
const service = require("./services")
const expressAsyncHandler = require("express-async-handler");
const model = require("./model");


router.post("/addTeam", expressAsyncHandler(async (req, res) => {
    const { team,company,status } = req.body;
  console.log(status)
  if (!team || typeof status === 'undefined') {
    return res.status(400).send({ msg: "department field or status missing" });
  }
  
  const isExistDepartment = await model.findOne({company,team})
  if(isExistDepartment){
    return res.status(400).send({msg:"team with same name already exist"})
  }

  const result = await service.addTeam(team,company,status);

  if (result) {
    res.status(201).send({ msg: "team added", data: result });
  } else {
    res.status(400).send({ msg: "not added" });
  }
      
  }));
// router.put("/updateTeam", controller.updateDeparment);
router.get("/getTeams", expressAsyncHandler(async (req, res) => {
    const { company } = req.query;
  const result = await service.getDepartments(company);
  if (result) {
    res.status(201).send({ msg: "teams", data: result });
  } else {
    res.status(400).send({ msg: "not found" });
  }
      
  }));
router.get("/getSingleTeam", expressAsyncHandler(async (req, res) => {
    const { teamId } = req.query;
    const result = await service.getSingleDepartment(teamId);
    if (result) {
      res.status(201).send({ msg: "team details", data: result });
    } else {
      res.status(400).send({ msg: "not found" });
    }
      
  }));
// router.delete("/deleteTeam", controller.deleteDepartment);
//router.get("/getRejectDepartment", controller.getRejectDepartment);

module.exports = router;
