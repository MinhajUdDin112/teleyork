const express = require("express");
const { string } = require("joi");
const mongoose = require("mongoose");
const reportSchema = mongoose.Schema(
  {
    reportName: String,
    startDate: Date,
    endDate: Date,
    dates: Array,
    personalInformation: Array,
    planInformation: Array,
    miscellaneous: Array,
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
