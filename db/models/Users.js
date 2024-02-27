const mongoose = require("mongoose");

const schema = mongoose.schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      select: false,
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    first_name: String,
    last_name: String,
    phone_number: String,
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

class Users extends mongoose.model {}

schema.loadClass(Users);
module.exports = mongoose.model("Users", schema);
