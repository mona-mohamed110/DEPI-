const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const allowedExts = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomBytes(16).toString("hex") + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(ext)) {
      const err = new Error("file_type");
      err.code = "file_type";
      return cb(err);
    }
    cb(null, true);
  },
});

const single = upload.single("files");

function sendErr(res, code) {
  return res.status(400).json({ code: code, message: code });
}

// لو الطلب فيه ملف (multipart) بيحفظه، ولو JSON عادي (المريض) بيعدّي زي ما هو
function uploadCertificate(req, res, next) {
  if (!req.is("multipart/form-data")) {
    return next();
  }
  single(req, res, function (err) {
    if (!err) {
      return next();
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendErr(res, "file_too_big");
    }
    if (err.code === "file_type") {
      return sendErr(res, "file_type");
    }
    return sendErr(res, "invalid_data");
  });
}

module.exports = { uploadCertificate };