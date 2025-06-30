import { diskStorage } from "multer"
import { extname } from "path"

export interface UploadedFileType {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  destination: string
  filename: string
  path: string
  buffer: Buffer
}

export const multerOptions = {
  storage: diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join("")
      cb(null, `${randomName}${extname(file.originalname)}`)
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      cb(null, true)
    } else {
      cb(new Error("Unsupported file type"), false)
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
}
