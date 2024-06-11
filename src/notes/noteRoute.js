const express = require("express");
const router = express.Router();
const expressAsyncHandler = require("express-async-handler");
const service = require("./noteServices");
const NoteModel = require("./noteModel");
const userService = "../adminUser/adminUserServices";
const Notification = require("../notification/model"); // Import Notification model
const RoleModel = require("../rolePermission/roleModel"); // Import Role model
const adminUserServices = require("../adminUser/adminUserServices");
const { io } = require("../../server");

router.post("/addnotifcationNote", async (req, res) => {
  try {
    const {
      serviceProvider,
      userId,
      customerId,
      noteType,
      note,
      priority,
      assignTo,
    } = req.body;

    if (
      !serviceProvider ||
      !userId ||
      !noteType ||
      !note ||
      !customerId ||
      !priority
    ) {
      return res.status(400).send({
        msg: "serviceProvider or userId or noteType or note or customerId or priority field is missing",
      });
    }

    const result = await NoteModel.create({
      serviceProvider,
      user: userId,
      customerId,
      noteType,
      note,
      priority,
      assignTo,
      status: "Pending",
    });

    if (result) {
      // Generate notification for assignee with the note content
      const userNotification = new Notification({
        sender: userId,
        receiver: assignTo,
        customerId,
        message: `You have a new assigned note: ${note}`,
        noteId: result._id,
      });
      await userNotification.save();

      // Send notification to admins only if assignTo is provided
      if (assignTo) {
        const adminUsers = await RoleModel.find({ role: "Admin" });
        const adminNotifications = await Promise.all(
          adminUsers.map(async (admin) => {
            const adminNotification = new Notification({
              sender: userId,
              receiver: admin._id,
              customerId,
              message: `A new note has been assigned: ${note}`,
              noteId: result._id,
            });
            return adminNotification.save();
          })
        );
      }

      return res.status(200).send({ msg: "New note added", data: result });
    } else {
      return res.status(400).send({ msg: "Note not added" });
    }
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.post("/resolveNote", async (req, res) => {
  try {
    const { noteId } = req.body;

    if (!noteId) {
      return res.status(400).send({ msg: "Note ID is missing" });
    }

    const findNotes = await Notification.find({
      noteId: noteId,
      status: "Pending",
    });
    if (!findNotes) {
      return res.status(404).send({ msg: "Note not found" });
    }
    console.log(findNotes);
    let updateNotes = [];
    await Promise.all(
      findNotes.map(async (note) => {
        const updatedNote = await Notification.findOneAndUpdate(
          { _id: note._id },
          { status: "Resolved" },
          { new: true }
        );
        updateNotes.push(updatedNote);
      })
    );
    console.log(updateNotes);

    // Send notification to admins that the note has been resolved
    const adminUsers = await RoleModel.find({ role: "Admin" });
    const adminNotifications = await Promise.all(
      adminUsers.map(async (admin) => {
        const adminNotifications = [];
        for (const note of updateNotes) {
          const newMessage = note.message.replace(
            /You have a new assigned note: /,
            ""
          );
          const adminNotification = new Notification({
            sender: note.assignTo, // Sender is the assigned user
            receiver: admin._id,
            customerId: noteId,
            message: `The assigned note has been resolved: ${newMessage}`,
          });
          const newNote = await adminNotification.save();
          adminNotifications.push(newNote);
        }
        console.log("here", adminNotifications);
        return Promise.all(adminNotifications);
      })
    );

    return res.status(200).send({ msg: "Note resolved successfully" });
  } catch (error) {
    console.error("Error resolving note:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Endpoint to get notifications for a user
router.get("/notifications", async (req, res) => {
  try {
    const { userId } = req.query; // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    let UserId = userId;
    const user = await adminUserServices.getByUserID(userId);
    const userRole = user.role.role;
    console.log(userRole);
    if (userRole === "Admin" || userRole === "ADMIN") {
      UserId = user.role._id;
    }

    // Retrieve notifications for the logged-in user with custom sorting
    const notifications = await Notification.find({ receiver: UserId })
      .sort({
        read: 1, // Sort by read status (unread first)
        timestamp: -1, // Sort by timestamp (latest first)
      })
      .populate("sender", "name")
      .exec(); // Execute the query

    // Count the number of unread notifications
    const unreadCount = notifications.filter(
      (notification) => !notification.readBy.includes(userId)
    ).length;

    if (io) {
      io.emit(`notifications_${userId}`, { notifications, unreadCount });
    } else {
      console.error("Socket.IO object is not initialized.");
    }
    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
function emitNotificationToUser(userId, notification) {
  io.to(userId).emit("notification", notification);
}
// Route to get the count of unread notifications for a user
router.get("/notificationsUnreadCount", async (req, res) => {
  try {
    const { userId } = req.query; // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Retrieve notifications for the logged-in user
    const notifications = await Notification.find({ receiver: userId });

    // Count the number of unread notifications
    const unreadCount = notifications.filter(
      (notification) => !notification.readBy.includes(userId)
    ).length;

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error retrieving unread notification count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/notifications", async (req, res) => {
  try {
    const { userId } = req.query; // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Retrieve notifications for the logged-in user with custom sorting
    const notifications = await Notification.find({ receiver: userId })
      .sort({
        read: 1, // Sort by read status (unread first)
        timestamp: -1, // Sort by timestamp (latest first)
      })
      .populate("sender", "name");

    // Push notifications read by the user to the last
    notifications.sort((a, b) => {
      if (a.readBy.includes(userId) && !b.readBy.includes(userId)) {
        return 1;
      } else if (!a.readBy.includes(userId) && b.readBy.includes(userId)) {
        return -1;
      }
      return 0;
    });
    const notificationscount = await Notification.find({ receiver: userId });

    // Count the number of unread notifications
    const unreadCount = notifications.filter(
      (notification) => !notification.readBy.includes(userId)
    ).length;
    res.status(200).json({ notifications, notificationscount });
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.put("/markReadnotifications", async (req, res) => {
  try {
    const { notificationId, userId } = req.query;

    // Find the notification by ID and update its status to 'read'
    await Notification.findOneAndUpdate(
      { _id: notificationId },
      {
        read: true,
        $addToSet: { readBy: userId }, // Add the user to the readBy array if not already present
      }
    );

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    let { serviceProvider, userId, customerId, noteType, note, priority } =
      req.body;
    console.log(req.body);
    if (
      !serviceProvider ||
      !noteType ||
      !note ||
      !customerId ||
      !priority ||
      !userId
    ) {
      return res.status(400).send({
        msg: "serviceProvider or userId or noteType or note or customerId or priority field is missing",
      });
    }
    const result = await service.addNote(
      serviceProvider,
      userId,
      customerId,
      noteType,
      note,
      priority
    );
    if (result) {
      return res.status(200).send({ msg: "new note added", data: result });
    } else {
      return res.status(400).send({ msg: "not added" });
    }
  })
);

router.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    let { serviceProvider } = req.query;

    const result = await service.getAll(serviceProvider);
    if (result) {
      return res.status(200).send({ msg: "notes", data: result });
    } else {
      return res.status(400).send({ msg: "no notes found" });
    }
  })
);

router.get(
  "/getOne",
  expressAsyncHandler(async (req, res) => {
    let { noteId } = req.query;

    const result = await service.getByUserID(noteId);
    if (result) {
      return res.status(200).send({ msg: "note", data: result });
    } else {
      return res.status(400).send({ msg: "no note found" });
    }
  })
);
router.get(
  "/getbyCustomer",
  expressAsyncHandler(async (req, res) => {
    let { customerId } = req.query;
    console.log(customerId);
    const result = await service.getbyCustomer(customerId);
    if (result) {
      return res.status(200).send({ msg: "note", data: result });
    } else {
      return res.status(400).send({ msg: "no note found" });
    }
  })
);

router.put(
  "/update",
  expressAsyncHandler(async (req, res) => {
    let { noteId, serviceProvider, customerId, noteType, note, priority } =
      req.body;
    const result = await service.update(
      noteId,
      serviceProvider,
      customerId,
      noteType,
      note,
      priority
    );
    if (result) {
      return res.status(200).send({ msg: "update successfull", data: result });
    } else {
      return res.status(400).send({ msg: "failed" });
    }
  })
);
router.put(
  "/priorityUpdate",
  expressAsyncHandler(async (req, res) => {
    let { noteId, priority } = req.body;
    if (!priority || !noteId) {
      return res.status(400).send({ msg: "field is missing" });
    }
    const result = await service.statusUpdate(noteId, priority);
    if (result) {
      return res.status(200).send({ msg: "priority changed", data: result });
    } else {
      return res.status(400).send({ msg: "not changed" });
    }
  })
);
router.put(
  "/delete",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.query;
    if (!id) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await service.delete(id);
    if (result.deletedCount == 0) {
      return res.status(400).send({ msg: "ID Not found" });
    }
    if (result) {
      return res.status(200).send({ msg: "mail deleted.", data: result });
    } else {
      return res.status(400).send({ msg: "mail not deleted" });
    }
  })
);
router.put(
  "/markVoid",
  expressAsyncHandler(async (req, res) => {
    let { noteId, markVoid } = req.body;
    console.log(noteId, markVoid);
    if (markVoid === null || markVoid === "" || !noteId) {
      return res.status(400).send({ msg: "field is missing" });
    }
    const result = await service.markVoid(noteId, markVoid);
    if (result) {
      return res.status(200).send({ msg: "mark void", data: result });
    } else {
      return res.status(400).send({ msg: "not changed" });
    }
  })
);
router.get(
  "/getnotebypriority",
  expressAsyncHandler(async (req, res) => {
    try {
      const { user, customerId } = req.query;

      // Find notifications with status "Pending" for the specified user and customerId
      const pendingNotifications = await Notification.find({
        sender: user,
        status: "Pending",
        customerId,
      });
      console.log(pendingNotifications);
      // Extract noteIds from pendingNotifications corresponding to the specified customerId
      const noteIds = pendingNotifications.map(
        (notification) => notification.noteId
      );

      // Find notes with priority "highest" or "high" and matching noteIds and customerId
      const notes = await NoteModel.find({
        _id: { $in: noteIds },
        customerId,
        priority: { $in: ["highest", "high"] },
      });

      res.json(notes);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  })
);

module.exports = router;
