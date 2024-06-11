const express = require("express");
const service = require("./departmentServices");
const model = require("./departmentModel");
const userModel = require("../adminUser/adminUserModel");
const userService = require("../adminUser/adminUserServices");
const expressAsyncHandler = require("express-async-handler");

// Add department
exports.addDeparment = expressAsyncHandler(async (req, res) => {
  const { department, company, status } = req.body;
  console.log(status);
  if (!department || typeof status === "undefined") {
    return res.status(400).send({ msg: "department field or status missing" });
  }

  const isExistDepartment = await model.findOne({ company, department });
  if (isExistDepartment) {
    return res
      .status(400)
      .send({ msg: "department with same name already exist" });
  }

  const result = await service.addDeparment(department, company, status);

  if (result) {
    res.status(201).send({ msg: "department added", data: result });
  } else {
    res.status(400).send({ msg: "not added" });
  }
});
exports.updateDeparment = expressAsyncHandler(async (req, res) => {
  const { department, status, departmentId } = req.body;
  if (!department || typeof status === "undefined") {
    return res.status(400).send({ msg: "department field or status missing" });
  }

  /* const isExistDepartment = await service.getSingleDepartment(department)
   if(isExistDepartment){
    return res.status(400).send({msg:"department with same name already exist"})
  }  */

  const result = await service.updateDeparment(
    department,
    status,
    departmentId
  );

  if (result) {
    res.status(201).send({ msg: "department updated", data: result });
  } else {
    res.status(400).send({ msg: "not updated" });
  }
});

exports.getDepartments = expressAsyncHandler(async (req, res) => {
  const { company } = req.query;
  const result = await service.getDepartments(company);
  if (result) {
    res.status(201).send({ msg: "departments", data: result });
  } else {
    res.status(400).send({ msg: "not found" });
  }
});

exports.getSingleDepartment = expressAsyncHandler(async (req, res) => {
  const { department } = req.query;
  const result = await service.getSingleDepartment(department);
  if (result) {
    res.status(201).send({ msg: "departments", data: result });
  } else {
    res.status(400).send({ msg: "not found" });
  }
});

exports.deleteDepartment = expressAsyncHandler(async (req, res) => {
  const { departmentId } = req.query;
  if (!departmentId) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  const result = await service.delete(departmentId);
  if (result.deletedCount == 0) {
    return res.status(400).send({ msg: "ID Not found" });
  }
  if (result) {
    return res.status(200).send({ msg: "department deleted.", data: result });
  } else {
    return res.status(400).send({ msg: "department not deleted" });
  }
});

//deparment for rejection
exports.getRejectDepartment = expressAsyncHandler(async (req, res) => {
  const { userId } = req.query;
  var filteredDepartments;
  const user = await userService.getByUserID(userId);
  console.log(user.role.role);
  if (user.role.role === "PROVISION AGENT") {
    console.log("here here");
    const departments = await service.getDepartments(user.company);
    const excludedDepartments = ["PROVISION MANAGER", "dispatch", "DISPATCH"];
    filteredDepartments = departments.filter(
      (dept) => !excludedDepartments.includes(dept.department)
    );
    console.log(filteredDepartments);
  } else if (user.role.role === "PROVISION MANAGER") {
    console.log("here here");
    const departments = await service.getDepartments(user.company);
    const excludedDepartments = ["dispatch", "DISPATCH"];
    filteredDepartments = departments.filter(
      (dept) => !excludedDepartments.includes(dept.department)
    );
    console.log(filteredDepartments);
  } else if (user.role.role === "RETENTION AGENT") {
    console.log("here here");
    const departments = await service.getDepartments(user.company);
    const excludedDepartments = [];
    filteredDepartments = departments.filter(
      (dept) => !excludedDepartments.includes(dept.department)
    );
    console.log(filteredDepartments);
  } else if (user.role.role === "QA MANAGER") {
    const departments = await service.getDepartments(user.company);
    const excludedDepartments = [
      "PROVISION MANAGER",
      "retention",
      "dispatch",
      "DISPATCH",
    ];

    // Filter out excluded departments
    filteredDepartments = departments.filter(
      (dept) => !excludedDepartments.includes(dept.department)
    );

    console.log(filteredDepartments);
  } else if (user.role.role === "QA AGENT") {
    const departments = await service.getDepartments(user.company);
    const excludedDepartments = [
      "PROVISION MANAGER",
      "QA",
      "retention",
      "dispatch",
      "DISPATCH",
    ];

    // Filter out excluded departments
    filteredDepartments = departments.filter(
      (dept) => !excludedDepartments.includes(dept.department)
    );

    console.log(filteredDepartments);
  } else if (user.role.role === "TEAM LEAD" || user.role.role === "CSR") {
    console.log("here");
    const departments = await service.getDepartments(user.company);
    const excludedDepartments = [
      "PROVISION MANAGER",
      "QA",
      "retention",
      "dispatch",
      "DISPATCH",
    ];

    // Filter out excluded departments
    filteredDepartments = departments.filter(
      (dept) => !excludedDepartments.includes(dept.department)
    );

    console.log(filteredDepartments);
  }

  if (filteredDepartments) {
    res.status(200).send({ msg: "departments", result: filteredDepartments });
  } else {
    res.status(400).send({ msg: "not found departments" });
  }
});
