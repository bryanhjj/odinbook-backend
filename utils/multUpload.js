var multer = require("multer");
var { v4: uuidv4 } = require("uuid");

var DIR = "./public/images";

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    const fileName = new Date().toISOString().replace(/:/g, '-') + file.originalname;
    cb(null, uuidv4() + "-" + fileName);
  },
});

module.exports = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Invalid file!"));
    }
  },
});