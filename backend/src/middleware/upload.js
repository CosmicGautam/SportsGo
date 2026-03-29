import multer from "multer";
import path from "path";

// Store files in /uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // e.g., 1680001234567.jpg
  },
});

export const upload = multer({ storage });