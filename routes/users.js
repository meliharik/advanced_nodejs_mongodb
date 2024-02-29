var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const Users = require("../db/models/Users");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const UserRoles = require("../db/models/UserRoles");
const is = require("is_js");
const Enum = require("../config/Enum");
const Roles = require("../db/models/Roles");

/* GET users listing. */
router.get("/", async function (req, res, next) {
  try {
    let users = await Users.find({});

    res.json(Response.successResponse(users));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/add", async function (req, res, next) {
  let body = req.body;
  try {
    if (!body.email) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        "Email is required"
      );
    }
    if (!is.email(body.email)) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        "Email is not valid"
      );
    }

    if (!body.password) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        "Password is required"
      );
    }

    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        `Password must be at least ${Enum.PASS_LENGTH} characters`
      );
    }

    if (!body.roles || !Array.isArray(body.roles) || body.roles.length == 0) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        "roles is required"
      );
    }

    let roles = await Roles.find({ _id: { $in: body.roles } });

    if (roles.length == 0) {
      throw new CustomError(
        Enum.HTTP_CODES.NOT_FOUND,
        "Validation Error",
        "Role not found"
      );
    }

    let password = bcrypt.hashSync(body.password, 8);

    console.log("hashed password", password);

    let user = await Users.create({
      email: body.email,
      password: password,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
    });

    for (let i = 0; i < roles.length; i++) {
      await UserRoles.create({
        role_id: roles[i]._id,
        user_id: user._id,
      });
    }

    res.status(Enum.HTTP_CODES.CREATED).json(
      Response.successResponse(
        {
          success: true,
        },
        Enum.HTTP_CODES.CREATED
      )
    );
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/update", async function (req, res, next) {
  let body = req.body;
  try {
    if (!body._id) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        "_id is required"
      );
    }

    let user = await Users.findById(body._id);

    if (!user) {
      throw new CustomError(
        Enum.HTTP_CODES.NOT_FOUND,
        "Validation Error",
        "User not found"
      );
    }

    if (body.email) {
      if (!is.email(body.email)) {
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          "Validation Error",
          "Email is not valid"
        );
      }
      user.email = body.email;
    }

    if (body.password) {
      if (body.password.length < Enum.PASS_LENGTH) {
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          "Validation Error",
          `Password must be at least ${Enum.PASS_LENGTH} characters`
        );
      }
      user.password = bcrypt.hashSync(body.password, 8);
    }

    if (body.first_name) {
      user.first_name = body.first_name;
    }

    if (body.last_name) {
      user.last_name = body.last_name;
    }

    if (body.phone_number) {
      user.phone_number = body.phone_number;
    }

    if (typeof body.is_active === "boolean") {
      user.is_active = body.is_active;
    }

    if (Array.isArray(body.roles) && body.roles.length > 0) {
      let userRoles = await UserRoles.find({ user_id: body._id });
      let removedRoles = userRoles.filter(
        (role) => !body.roles.includes(role.role_id.toString())
      );
      let newRoles = body.roles.filter(
        (role) => !userRoles.map((r) => r.role_id.toString()).includes(role)
      );
      if (removedRoles.length > 0) {
        await UserRoles.deleteMany({
          _id: { $in: removedRoles.map((p) => p._id) },
        });
      }

      if (newRoles.length > 0) {
        for (let i = 0; i < newRoles.length; i++) {
          let userRole = new UserRoles({
            role_id: newRoles[i],
            user_id: body._id,
          });
          await userRole.save();
        }
      }
    }

    let roles = await Roles.find({ _id: { $in: body.roles } });

    if (roles.length == 0) {
      throw new CustomError(
        Enum.HTTP_CODES.NOT_FOUND,
        "Validation Error",
        "Role not found"
      );
    }

    await user.save();

    res.json(
      Response.successResponse({
        success: true,
      })
    );
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/delete", async function (req, res, next) {
  let body = req.body;
  try {
    if (!body._id) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        "_id is required"
      );
    }

    let user = await Users.findById(body._id);

    if (!user) {
      throw new CustomError(
        Enum.HTTP_CODES.NOT_FOUND,
        "Validation Error",
        "User not found"
      );
    }

    await user.deleteOne({ _id: body._id });

    await UserRoles.deleteMany({ user_id: body._id });

    res.json(
      Response.successResponse({
        success: true,
      })
    );
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/register", async function (req, res, next) {
  let body = req.body;
  try {
    let user = await Users.findOne({ email: body.email });

    if (user) {
      throw new CustomError(
        Enum.HTTP_CODES.NOT_FOUND,
        "Validation Error",
        "User already exists"
      );
    }

    if (!body.email) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        "Email is required"
      );
    }
    if (!is.email(body.email)) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        "Email is not valid"
      );
    }

    if (!body.password) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        "Password is required"
      );
    }

    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        `Password must be at least ${Enum.PASS_LENGTH} characters`
      );
    }

    let password = bcrypt.hashSync(body.password, 8);

    console.log("hashed password", password);

    let createdUser = await Users.create({
      email: body.email,
      password: password,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
    });

    let role = await Roles.create({
      role_name: Enum.SUPER_ADMIN,
      is_active: true,
      created_by: createdUser._id,
    });

    await UserRoles.create({
      role_id: role._id,
      user_id: createdUser._id,
    });

    res.status(Enum.HTTP_CODES.CREATED).json(
      Response.successResponse(
        {
          success: true,
        },
        Enum.HTTP_CODES.CREATED
      )
    );
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;
