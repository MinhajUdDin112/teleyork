const express = require("express");
const service = require("./sacService");
const XLSX = require("xlsx");
const expressAsyncHandler = require("express-async-handler");

exports.insertAllSac = expressAsyncHandler(async (req, res) => {
  const filePath = "sac.xlsx";
  // Process the uploaded file
  try {
    const workbook = XLSX.readFile(filePath);
    console.log("here");
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet);
    console.log(excelData);
    const mongooseDocuments = excelData.map((row) => ({
      state: row.state,
      sac:row.sac
    }));
    console.log("here now");

    // Insert data into MongoDB
    // await zipModel.create(mongooseDocuments);
    const result = await service.insertData(mongooseDocuments);
    res.status(200).send({ msg: "added successfully" });
    console.log("here here");
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error.message });
  }
});

// get all data by zipCode
exports.getByZipCode = expressAsyncHandler(async (req, res) => {
  const { zipCode,state } = req.query;
  if(zipCode){
    const result = await service.getCityAndStateByZip(zipCode);
    if (result) {
      res.status(200).send({ msg: "result", data: result });
    } else {
      res.status(400).send({ msg: "not found" });
    }
  }else{
    const result = await service.getCityByState(state);
    console.log(result.sac)
    if (result) {
      res.status(200).send({ msg: "result", data: result });
    } else {
      res.status(400).send({ msg: "not found" });
    }
  }
  
});
