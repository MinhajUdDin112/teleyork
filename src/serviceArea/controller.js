const express = require("express");
const service = require("./service");
const {
  changeServiceStateStatus,
  changeServiceZipStatus,
} = require("./validator");
const ApiError = require("../helpers/apiError");
// Get all billings
exports.get = async (req, res) => {
 // try {
    const result = await service.getAll();
    res.status(200).send({ data: result });
  // } catch (error) {
  //   console.log(error);
  //   res.status(500).json({ msg: "Internal server error" });
  // }
};

// add a new service area
exports.add = async (req, res) => {
  const { 
    carrier,
    state, city, zip, abbreviation, population, country
   } = req.body;
  try {
    const result = await service.create(
      carrier,
      state,
      city,
      zip,
      abbreviation,
      population,
      country
    );
    res.status(200).send({ msg: "Added successfully", data: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
//disable and enable state
exports.changeServiceStateStatus = async (req, res, next) => {
  const { carrier,state, status } = req.body;
  const validate = changeServiceStateStatus.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  try {
    const result = await service.changeServiceStateStatus(carrier,state, status);
    res.status(200).send({ msg: "Status successfully updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
// disable and enable zip
exports.changeServiceZipStatus = async (req, res, next) => {
  const { carrier,zipCode, status } = req.body;
  const validate = changeServiceZipStatus.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  try {
    const result = await service.changeServiceZipStatus(carrier,zipCode, status);
    res.status(200).send({ msg: "Status successfully updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
