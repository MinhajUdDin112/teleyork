const express = require("express");
const vendorsModel = require("./model");

//call post api to add data to database
exports.add = async (req, res) => {
  const {
    companyName,
    address1,
    address2,
    city,
    state,
    zipCode,
    companyEmail,
    pointOfContact,
    pointOfContactPhoneNo,
    pointOfContactEmail,
    NTN_EIN_Number,
    contractSignDate,
    contractExpirationDate,
    modeOfWork,
    status,
  } = req.body;
  if (
    !companyName ||
    !address1 ||
    !city ||
    !state ||
    !zipCode ||
    !companyEmail ||
    !pointOfContact ||
    !pointOfContactPhoneNo ||
    !pointOfContactEmail ||
    !NTN_EIN_Number ||
    !contractSignDate ||
    !contractExpirationDate ||
    !modeOfWork ||
    !status
  ) {
    return res.status(400).send({
      msg: "All fields are required",
    });
  }
  // Check if contract sign date is not in future and less than or equal to current date
  const currentDate = new Date();
  const signDate = new Date(contractSignDate);
  if (signDate > currentDate) {
    return res.status(400).send({
      msg: "Contract sign date cannot be in the future",
    });
  }

  // Check if contract expiration date is greater than contract sign date
  const expirationDate = new Date(contractExpirationDate);
  if (expirationDate <= signDate) {
    return res.status(400).send({
      msg: "Contract expiration date must be greater than contract sign date",
    });
  }
  const filePath = req.file.path;
  console.log(filePath);
  try {
    const newData = new vendorsModel({
      companyName,
      address1,
      address2,
      city,
      state,
      zipCode,
      companyEmail,
      pointOfContact,
      pointOfContactPhoneNo,
      pointOfContactEmail,
      NTN_EIN_Number,
      contractSignDate,
      contractExpirationDate,
      modeOfWork,
      attachmentLink: filePath,
      status,
    });
    await newData.save();
    return res.status(201).send({ msg: "Data saved successfully" });
  } catch (error) {
    console.error("Error saving data to database:", error);
    return res.status(500).send({ msg: "Internal server error" });
  }
};

// call get api to get only one data from database

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "invalid id" });
    }
    const result = await vendorsModel.findOne({ _id: id });
    if (!result) {
      return res.status(404).json({ msg: "Document not found" });
    }
    console.log(result);
    return res.status(200).json({ "data ": result });
  } catch (error) {
    console.error("Error getting data from database:", error);
    return res.status(500).send({ msg: "Internal server error" });
  }
};

// call get api to get all data from database

exports.getAll = async (req, res) => {
  try {
    const result = await vendorsModel
      .find()
      .sort({ createdAt: -1, updatedAt: -1 });
    console.log(result);
    return res.status(200).json({ "data added": result });
  } catch (error) {
    console.error("Error getting data from database:", error);
    return res.status(500).send({ msg: "Internal server error" });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ msg: "Invalid ID" });
  }

  // Destructure the fields you want to update from req.body
  const {
    companyName,
    address1,
    address2,
    city,
    state,
    zipCode,
    companyEmail,
    pointOfContact,
    pointOfContactPhoneNo,
    pointOfContactEmail,
    NTN_EIN_Number,
    contractSignDate,
    contractExpirationDate,
    modeOfWork,
    status,
  } = req.body;

  try {
    // Find the document by ID and update its fields
    const result = await vendorsModel
      .findByIdAndUpdate(
        id,
        {
          companyName,
          address1,
          address2,
          city,
          state,
          zipCode,
          companyEmail,
          pointOfContact,
          pointOfContactPhoneNo,
          pointOfContactEmail,
          NTN_EIN_Number,
          contractSignDate,
          contractExpirationDate,
          modeOfWork,
          status,
        },
        { new: true }
      )
      .sort({ updatedAt: -1 }); // { new: true } ensures that the updated document is returned
    // Check if the document exists
    if (!result) {
      return res.status(404).json({ msg: "Document not found" });
    }

    console.log(result);
    return res.status(200).json({ msg: "data updated" });
  } catch (err) {
    console.error({ error: "Error updating data in the database" });
    return res.status(500).send({ msg: "Internal server error" });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ msg: "Invalid ID" });
  }
  try {
    const result = await vendorsModel.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ msg: "Document not found" });
    }
    console.log(result);
    return res.status(200).json({ msg: "data deleted" });
  } catch (err) {
    console.error({ error: "data not deleted" });
    return res.status(500).send({ error: "Internal server error" });
  }
};
