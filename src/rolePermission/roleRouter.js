const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const roleServices = require("./roleServices");
const roleRouter = express.Router();
roleRouter.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    const { serviceProvider } = req.query;
    const result = await roleServices.get(serviceProvider);
    console.log(result);
    if (result.length !== 0) {
      return res.status(200).send({ msg: "roles", data: result });
    } else {
      return res.status(400).send({ msg: "Roles Not Found" });
    }
  })
);
roleRouter.get(
  "/getLabelRole",
  expressAsyncHandler(async (req, res) => {
    const { serviceProvider } = req.query;
    const result = await roleServices.getLabelRole(serviceProvider);
    console.log(result);
    if (result.length !== 0) {
      return res.status(200).send({ msg: "roles", data: result });
    } else {
      return res.status(400).send({ msg: "Roles Not Found" });
    }
  })
);
roleRouter.get(
  "/inActive",
  expressAsyncHandler(async (req, res) => {
    const result = await roleServices.inActiveRoles();
    res.status(200).send({ msg: "roles", data: result });
  })
);
roleRouter.get(
  "/roleDetails",
  expressAsyncHandler(async (req, res) => {
    const { roleId } = req.query;

    const result = await roleServices.getRoleByID(roleId);
    if (result) {
      return res.status(200).send({ msg: "Roles", data: result });
    } else {
      return res.status(400).send({ msg: "Role not found" });
    }
  })
);
roleRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { serviceProvider, permissions, role, description } = req.body;
    if (!serviceProvider || !role || !description || !permissions) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await roleServices.addNew(
      serviceProvider,
      permissions,
      role,
      description,
      false
    );
    if (result) {
      return res.status(200).send({ msg: "Role added.", data: result });
    } else {
      return res.status(400).send({ msg: "Role not added" });
    }
  })
);
roleRouter.patch(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { roleId, role, description } = req.body;
    if (!roleId || !role || !description) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await roleServices.update(roleId, role, description);
    if (result) {
      return res.status(200).send({ msg: "Role updated.", data: result });
    } else {
      return res.status(400).send({ msg: "Role not updated" });
    }
  })
);

roleRouter.patch(
  "/permissions",
  expressAsyncHandler(async (req, res) => {
    const { roleId, permissions } = req.body;
    if (!roleId || !permissions) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await roleServices.updatePermissions(roleId, permissions);
    if (result) {
      return res
        .status(200)
        .send({ msg: "Role's permissions updated.", data: result });
    } else {
      return res.status(400).send({ msg: "Role's permission not updated" });
    }
  })
);
roleRouter.patch(
  "/updateStatus",
  expressAsyncHandler(async (req, res, next) => {
    const { roleId, status } = req.body;
    const result = await roleServices.updateStatus(roleId, status);
    if (result) {
      return res.status(200).send({ msg: "Role updated.", data: result });
    } else {
      return res.status(400).send({ msg: "Role not updated" });
    }
  })
);

roleRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { roleId } = req.query;
    if (!roleId) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await roleServices.delete(roleId);
    if (result.deletedCount == 0) {
      return res.status(400).send({ msg: "ID Not found" });
    }
    if (result) {
      return res.status(200).send({ msg: "Role deleted.", data: result });
    } else {
      return res.status(400).send({ msg: "Role not deleted" });
    }
  })
);

module.exports = roleRouter;
