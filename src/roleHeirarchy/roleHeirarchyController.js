const express = require("express");
const service = require("./roleHeirarchyService");
const expressAsyncHandler = require("express-async-handler");

exports.addHeirarchy = expressAsyncHandler(async (req, res) => {
  const { role, level } = req.body;
  const result = await service.addHeirarchy(role, level);

  if (result) {
    res.status(201).send({ msg: "heirarchy", data: result });
  } else {
    res.status(400).send({ msg: "not added" });
  }
});

exports.getHeirarchyName = expressAsyncHandler(async (req, res) => {
  const { role } = req.query;
  const result = await service.getHeirarchyName(role);
  if (result) {
    res.status(201).send({ msg: "heirarchy", data: result });
  } else {
    res.status(400).send({ msg: "not found" });
  }
});
