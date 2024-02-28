var express = require("express");
var router = express.Router();
const Categories = require("../db/models/Categories");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");

// CRUD - Create, Read, Update, Delete

/* GET categories listing with try catch block */
router.get("/", async function (req, res, next) {
  try {
    let categories = await Categories.find();
    res.json(Response.successResponse(categories));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/add", async function (req, res, next) {
  let body = req.body;
  try {
    if (!body.name) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error!",
        "Name is required."
      );
    }

    let category = new Categories({
      name: body.name,
      is_active: true,
      created_by: req.user?.id,
    });

    await category.save();

    res.json(Response.successResponse({ success: true }));
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
        "Validation Error!",
        "_id is required."
      );
    }

    let updates = {};

    if (body.name) {
      updates.name = body.name;
    }

    if (typeof body.is_active === "boolean") {
      updates.is_active = body.is_active;
    }

    await Categories.updateOne(
      {
        _id: body._id,
      },
      updates
    );

    res.json(Response.successResponse({ success: true }));
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
        "Validation Error!",
        "_id is required."
      );
    }

    await Categories.deleteOne({
      _id: body._id,
    });

    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;
