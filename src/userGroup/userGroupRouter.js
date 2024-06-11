const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const userGroupServices = require("./userGroupService");
const userGroupRouter = express.Router();
userGroupRouter.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    const groups = await userGroupServices.get();
    res.status(200).send({ msg: "Groups", data: groups });
  })
);
userGroupRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).send({ msg: "Group name is required" });
    }
    const result = await userGroupServices.create(name);
    if (result) {
      return res.status(201).send({
        msg: "Group Created",
        data: result,
      });
    } else {
      return res.status(400).send({
        msg: "Failed to Group Created",
      });
    }
  })
);
userGroupRouter.patch(
  "/addUsers",
  expressAsyncHandler(async (req, res) => {
    const { groupId, users } = req.body;
    const result = await userGroupServices.addUser(groupId, users);
    if (result) {
      return res.status(200).send({
        msg: "User Added",
        data: result,
      });
    } else {
      return res.status(400).send({
        msg: "Failed to Add",
      });
    }
  })
);
userGroupRouter.patch(
  "/removeUsers",
  expressAsyncHandler(async (req, res) => {
    const { groupId, users } = req.body;
    const result = await userGroupServices.removeUser(groupId, users);
    if (result) {
      return res.status(200).send({
        msg: "User Removed",
        data: result,
      });
    } else {
      return res.status(400).send({
        msg: "Failed to Removed",
      });
    }
  })
);
userGroupRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { groupId } = req.query;
    const result = await userGroupServices.delete(groupId);
    if (result.deletedCount === 0) {
      return res.status(404).send({
        msg: "Group Not Found",
      });
    }
    if (result) {
      return res.status(200).send({
        msg: "Group deleted",
      });
    } else {
      return res.status(400).send({
        msg: "Failed to delete",
      });
    }
  })
);
module.exports = userGroupRouter;
