const mongoose = require("mongoose");

const schema = mongoose.schema(
  {
    role_name: {
      type: String,
      required: true,
    },
    is_active: {
      type: Boolean,
      required: true,
      default: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

class Roles extends mongoose.model {}

schema.loadClass(Roles);
module.exports = mongoose.model("Roles", schema);
