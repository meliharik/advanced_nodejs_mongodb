const express = require("express");
const router = express.Router();

const Roles = require("../db/models/Roles");
const RolePrivileges = require("../db/models/RolePrivileges");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const role_privileges = require("../config/role_privileges");

router.get("/", async (req, res) => {
  try {
    let roles = await Roles.find();
    res.json(Response.successResponse(roles));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/add", async (req, res) => {
  let body = req.body;
  try {
    if (!body.role_name)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Error",
        "role_name is required"
      );

    if (
      !body.permissions ||
      !Array.isArray(body.permissions) ||
      body.permissions.length == 0
    ) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Error",
        "permissions is required"
      );
    }

    let role = Roles({
      role_name: req.body.role_name,
      is_active: true,
      created_by: req.body.created_by,
    });
    await role.save();

    for (let i = 0; i < body.permissions.length; i++) {
      let rolePrivilege = new RolePrivileges({
        role_id: role._id,
        permission: body.permissions[i],
        created_by: req.body.created_by,
      });
      await rolePrivilege.save();
    }

    res.json(
      Response.successResponse({
        success: true,
      })
    );
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/update", async (req, res) => {
  let body = req.body;
  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Error",
        "_id is required"
      );

    let updates = {};

    if (req.body.role_name) updates.role_name = req.body.role_name;
    if (typeof req.body.is_active === "boolean")
      updates.is_active = req.body.is_active;

    if (
      body.permissions &&
      !Array.isArray(body.permissions) &&
      body.permissions.length > 0
    ) {
      let permissions = await RolePrivileges.find({ role_id: req.body._id });

      let removedPermissions = permmissions.filter(
        (permission) => !body.permissions.includes(permission.permission)
      );

      let newPermissions = body.permissions.filter(
        (permission) =>
          !permissions.map((p) => p.permission).includes(permission)
      );

      if (removedPermissions.length > 0) {
        await RolePrivileges.remove({
          _id: { $in: removedPermissions.map((p) => p._id) },
        });
      }

      if (newPermissions.length > 0) {
        for (let i = 0; i < newPermissions.length; i++) {
          let rolePrivilege = new RolePrivileges({
            role_id: body._id,
            permission: newPermissions[i],
            created_by: req.body.created_by,
          });
          await rolePrivilege.save();
        }
      }
    }

    await Roles.updateOne({ _id: req.body._id }, updates);

    res.json(
      Response.successResponse({
        success: true,
      })
    );
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/delete", async (req, res) => {
  let body = req.body;
  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Error",
        "_id is required"
      );

    await Roles.deleteOne({ _id: req.body._id });

    res.json(
      Response.successResponse({
        success: true,
      })
    );
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.get("/role_privileges", async (req, res) => {
  try {
    res.json(role_privileges);
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;
