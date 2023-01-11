const multer = require('multer');
var randomstring = require("randomstring");
const path = require('path');
const fs = require('fs');

let uploadFile = (field, folderDes = 'users', fileNameLength = 10, fileSizeMB = 2, fileExtension = 'jpeg|jpg|png|gif') => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, __path_uploads + folderDes + '/');
    },

    filename: (req, file, cb) => {
      // console.log(file);
      cb(null, randomstring.generate(fileNameLength) + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: fileSizeMB * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      const filetypes = new RegExp(fileExtension);
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      }
      else {
        cb('Phần mở rộng của tập tin không phù hợp!');
      }
    }
  }).single(field);
  return upload;
}
let removeFile = (folder, fileName) => {
  if(fileName !== "" && fileName !== undefined)
  {
    let path = folder + fileName;
    if (fs.existsSync(path)) {
      fs.unlink(path, (err) => { if (err) throw err; });
    }
  }

}
module.exports = {
  upload: uploadFile,
  remove: removeFile
}