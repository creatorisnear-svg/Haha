import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { getDb } from "../lib/mongodb";
import { ObjectId } from "mongodb";
import { adminAuthMiddleware } from "../auth";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.post(
  "/admin/images/upload",
  adminAuthMiddleware,
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    try {
      const db = await getDb();
      const result = await db.collection("images").insertOne({
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        data: req.file.buffer,
        size: req.file.size,
        uploadedAt: new Date(),
      });

      const imageUrl = `/api/images/${result.insertedId}`;
      res.json({ url: imageUrl });
    } catch (err) {
      req.log.error({ err }, "Image upload failed");
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

router.get("/images/:id", async (req: Request, res: Response) => {
  try {
    let objectId: ObjectId;
    try {
      const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      objectId = new ObjectId(rawId);
    } catch {
      res.status(400).json({ error: "Invalid image ID" });
      return;
    }

    const db = await getDb();
    const image = await db.collection("images").findOne({ _id: objectId });

    if (!image) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    res.setHeader("Content-Type", image.contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000");
    res.send(image.data.buffer);
  } catch (err) {
    req.log.error({ err }, "Failed to serve image");
    res.status(500).json({ error: "Failed to serve image" });
  }
});

export default router;
