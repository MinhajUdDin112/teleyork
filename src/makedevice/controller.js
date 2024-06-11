const Make = require("./model");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const makeRoutes = require("./makeroutes");
// Create a new make
const createMake = async (req, res) => {
  try {
    const { make, company, device } = req.body;
    if (!make || !company || !device) {
      return res.status(400).send({ msg: "fields missing" });
    }
    const newMake = new Make({ make, company, device });
    const savedMake = await newMake.save();
    if (savedMake) {
      res.status(200).json({ msg: "make", data: savedMake });
    } else {
      res.status(400).json({ msg: "makes not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get all makes
const getAllMakes = async (req, res) => {
  try {
    const { company, device } = req.query;
    const makes = await Make.find({ company, device });
    if (makes) {
      res.status(200).json({ msg: "makes", data: makes });
    } else {
      res.status(400).json({ msg: "makes not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get a single make by ID
const getMakeById = async (req, res) => {
  try {
    const make = await Make.findById(req.params.id);
    if (!make) {
      return res.status(404).json({ error: "Make not found" });
    }
    res.status(200).json(make);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update a make by ID
const updateMakeById = async (req, res) => {
  try {
    const { company, make } = req.body;
    const updatedMake = await Make.findByIdAndUpdate(
      req.params.id,
      { make, company },
      { new: true }
    );
    if (!updatedMake) {
      return res.status(404).json({ error: "Make not found" });
    }
    res.status(200).json(updatedMake);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete a make by ID
const deleteMakeById = async (req, res) => {
  try {
    const deletedMake = await Make.findByIdAndDelete(req.params.id);
    if (!deletedMake) {
      return res.status(404).json({ error: "Make not found" });
    }
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createMake,
  getAllMakes,
  getMakeById,
  updateMakeById,
  deleteMakeById,
};
