const mongoose = require("mongoose");
const RolePrivileges = require("./RolePrivileges");

const schema = mongoose.Schema(
  {
    role_name: {
      type: String,
      required: true,
      unique: true,
    },
    is_active: {
      type: Boolean,
      required: true,
      default: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
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

class Roles extends mongoose.model {
  static async remove(query) {
    if (query._id) {
      await RolePrivileges.remove({ role_id: query._id });
    }

    await super.remove(query);
  }
}

schema.loadClass(Roles);
module.exports = mongoose.model("Roles", schema);
