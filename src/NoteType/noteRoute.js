const express = require("express");
const router = express.Router();
const expressAsyncHandler = require("express-async-handler");
const service = require("./noteServices");

router.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    let { serviceProvider, noteType, note, status } = req.body;
    if (!serviceProvider || !noteType || !note) {
      return res
        .status(400)
        .send({ msg: "serviceProvider or noteType or note field is missing" });
    }

    // Check if a note with the same noteType already exists for the given serviceProvider
    const existingNote = await service.findNoteByServiceProviderAndNoteType(
      serviceProvider,
      noteType
    );

    // If a note with the same noteType exists, return a 400 status with a message
    if (existingNote) {
      return res.status(400).send({ msg: "Note with the same noteType already exists" });
    }

    // If no existing note with the same noteType, proceed to add the new note
    const result = await service.addNote(
      serviceProvider,
      noteType,
      note,
      status
    );
    
    if (result) {
      return res.status(200).send({ msg: "New note added", data: result });
    } else {
      return res.status(400).send({ msg: "Note not added" });
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
    let { noteTypeId } = req.query;

    const result = await service.getByUserID(noteTypeId);
    if (result) {
      return res.status(200).send({ msg: "notes", data: result });
    } else {
      return res.status(400).send({ msg: "no notes found" });
    }
  })
);
router.put(
  "/update",
  expressAsyncHandler(async (req, res) => {
    let { noteTypeId, serviceProvider, noteType, note } = req.body;
    const result = await service.update(
      noteTypeId,
      serviceProvider,
      noteType,
      note
    );
    if (result) {
      return res.status(200).send({ msg: "new note added", data: result });
    } else {
      return res.status(400).send({ msg: "not added" });
    }
  })
);
router.put(
  "/statusUpdate",
  expressAsyncHandler(async (req, res) => {
    let { noteTypeId, status } = req.body;
    console.log("Received request body:", req.body); // Log the entire request body

    console.log(noteTypeId, status);
    if (status == "" || status == null) {
      return res.status(400).send({ msg: "status field is missing" });
    }
    const result = await service.statusUpdate(noteTypeId, status);
    if (result) {
      return res.status(200).send({ msg: "new note added", data: result });
    } else {
      return res.status(400).send({ msg: "not added" });
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

module.exports = router;
