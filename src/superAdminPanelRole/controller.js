const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const service = require("./service");
const superAdminPanelUserService=require("../superAdminPanelUser/service")
const { createRole,updateRole,updateRolePermissions } = require("./validator");
const ApiError = require("../helpers/apiError");
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.get();
  res.status(200).send({ msg: "roles", data: result });
});
exports.inActiveRoles = expressAsyncHandler(async (req, res) => {
  const result = await service.inActiveRoles();
  res.status(200).send({ msg: "roles", data: result });
});
exports.details = expressAsyncHandler(async (req, res) => {
  const { roleId } = req.query;
  const result = await service.getRoleByID(roleId);
  if (result) {
    return res.status(200).send({ msg: "Role", data: result });
  } else {
    return res.status(400).send({ msg: "Role not found" });
  }
});
exports.create= expressAsyncHandler(async (req, res) => {
    const {
      permissions,
      role,
      description,
    } = req.body;
    if (!role || !description || !permissions) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await service.addNew(
      permissions,
      role,
      description,
      true
    );
    if (result) {
      return res.status(200).send({ msg: "Role added.", data: result });
    } else {
      return res.status(400).send({ msg: "Role not added" });
    }
  });
exports.updateRole=expressAsyncHandler(async (req, res) => {
    const { roleId, role, description } = req.body;
    if (!roleId || !role || !description) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await service.update(roleId, role, description);
    if (result) {
      return res.status(200).send({ msg: "Role updated.", data: result });
    } else {
      return res.status(400).send({ msg: "Role not updated" });
    }
  });

exports.rolePermission=expressAsyncHandler(async (req, res) => {
    const { roleId, permissions } = req.body;
    if (!roleId || !permissions) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await service.updatePermissions(roleId, permissions);
    if (result) {
      return res
        .status(200)
        .send({ msg: "Role's permissions updated.", data: result });
    } else {
      return res.status(400).send({ msg: "Role's permission not updated" });
    }
  });

exports.updateStatus = expressAsyncHandler(async (req, res, next) => {
  const { roleId, status } = req.body;
  const result = await service.updateStatus(roleId, status);
  if (result) {
    return res.status(200).send({ msg: "Role updated.", data: result });
  } else {
    return res.status(400).send({ msg: "Role not updated" });
  }
});
exports.delete = expressAsyncHandler(async (req, res) => {
  const { roleId } = req.query;
  const isAssign=await superAdminPanelUserService.isAssignRole(roleId);
  if(isAssign){
    return res.status(400).send({msg:"This role is assigned first update role then delete!"})
  }
  const result = await service.delete(roleId);
  if (result.deletedCount == 0) {
    return res.status(400).send({ msg: "ID Not found" });
  }
  if (result) {
    return res.status(200).send({ msg: "Role deleted", data: result });
  } else {
    return res.status(400).send({ msg: "Role not deleted" });
  }
});
