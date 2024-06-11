const moduleModel = require("./moduleModel");

const moduleServices = {
  new: async (name, route = "", icon = "", orderPosition) => {
    const result = await moduleModel.create({
      name,
      route,
      icon,
      orderPosition,
    });
    return result;
  },

  isExist: async (name) => {
    const result = await moduleModel.findOne({ name });
    return result;
  },
  getById: async (id) => {
    const result = await moduleModel.findById(id);
    return result;
  },

  isOrderPositionExist: async (orderPosition) => {
    const result = await moduleModel.findOne({ orderPosition });
    return result;
  },

  getOrderPosition: async () => {
    const result = await moduleModel.findOne({}).sort("-orderPosition");
    if (result) {
      return result.orderPosition + 1;
    }
    return 1;
  },

  getAll: async () => {
    // const result = await moduleModel.aggregate([
    //   {
    //     $lookup: {
    //       from: "submodules",
    //       localField: "_id",
    //       foreignField: "module",
    //       as: "submodule",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "permissions",
    //       localField: "submodules.actions",
    //       foreignField: "_id",
    //       as: "actions",
    //     },
    //   },
    // ]);
    const result = await moduleModel.aggregate([
      {
        $lookup: {
          from: "submodules",
          localField: "_id",
          foreignField: "module",
          as: "submodule",
        },
      },
      {
        $unwind: "$submodule", // Unwind the submodule array
      },
      {
        $lookup: {
          from: "permissions",
          localField: "submodule.actions", // Assuming "_id" is the unique identifier for submodules
          foreignField: "_id",
          as: "submodule.actions",
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" }, // Include the "role" field
          route: { $first: "$route" }, // Include the "description"
          icon: { $first: "$icon" },
          orderPosition: { $first: "$orderPosition" },
          submodule: { $push: "$submodule" }, // Re-group the submodules into an array
        },
      },
      {
        $sort: { orderPosition: 1 } // Sort in ascending order by the "name" field
      }
    ]);

    return result;
  },

  updateById: async (id, name, route) => {
    const result = await moduleModel.findByIdAndUpdate(
      id,
      { name, route },
      { new: true }
    );
    return result;
  },
};

module.exports = moduleServices;
