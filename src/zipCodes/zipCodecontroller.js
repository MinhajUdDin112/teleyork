const express = require("express");
const service = require("./zipCodeService");
const XLSX = require("xlsx");
const expressAsyncHandler = require("express-async-handler");

exports.inserAllZip = expressAsyncHandler(async (req, res) => {
  const filePath = "ZipCodesList.xlsx";
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
      abbreviation: row.abbreviation,
      zipCode: row.zipCode,
      population: row.population,
      city: row.city,
      county: row.county,
    }));
    console.log("here now");

    const result = await service.insertData(mongooseDocuments);
    res.status(200).send({ msg: "added successfully" });
    console.log("here here");
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error.message });
  }
});
const cityCache = {};

// get all data by zipCode
exports.getByZipCode = expressAsyncHandler(async (req, res) => {
  const { zipCode, state } = req.query;
  if (zipCode) {
    const result = await service.getCityAndStateByZip(zipCode);
    if (result) {
      res.status(200).send({ msg: "result", data: result });
    } else {
      res.status(400).send({ msg: "not found" });
    }
  } else {
    const result = await service.getCityByState(state);
    if (result) {
      res.status(200).send({ msg: "result", data: result });
    } else {
      res.status(400).send({ msg: "not found" });
    }
  }
});

exports.getAllStates = expressAsyncHandler(async (req, res) => {
  const states = await service.getAllUniqueStates();

  // Check if any states were found
  if (states && states.length > 0) {
    res.status(200).send({ msg: "result", data: states });
  } else {
    res.status(400).send({ msg: "no states found" });
  }
});

exports.getcitiesByState = expressAsyncHandler(async (req, res) => {
  const { state } = req.query;

  // Check if any states were found
  if (cityCache[state]) {
    // If cities for the state are found in cache, return them
    res.status(200).send({ msg: "result", data: cityCache[state] });
  } else {
    // If cities for the state are not in cache, fetch them from the service
    let cityResult = await service.getCityByState(state);
    if (cityResult) {
      const cities = cityResult.map((cityName) => ({
        city: cityName,
      }));
      console.log(cityResult);
      // Cache the unique city information
      cityCache[state] = cities;
      res.status(200).send({ msg: "result", data: cities });
    } else {
      // If cities for the state are not found, return a 400 status
      res.status(400).send({ msg: "not found" });
    }
  }
});
