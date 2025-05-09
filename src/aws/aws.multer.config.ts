import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
export const uploadsPath = path.join(process.cwd(), 'uploads');
export const multerOptions = {
  storage: diskStorage({
    destination: (req, file, callback) => {
      if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
      }
      callback(null, uploadsPath);
    },
    filename: (req, file, callback) => {
      const ext = file.mimetype.split('/')[1];
      let fileName;
      if (ext == 'mpeg') {
        fileName =
          Date.now() + '-' + file.originalname.split('.')[0] + '.' + 'mp3';
      } else {
        fileName = Date.now() + '-' + file.originalname + '.' + ext;
      }
      const uniqueSuffix = fileName;
      callback(null, uniqueSuffix);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (!file) {
      callback(null, true); // Allow request without file
    } else {
      callback(null, true); // Accept the file
    }
  },
};
export interface UploadedFileType {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  filename: string;
  path: string;
}