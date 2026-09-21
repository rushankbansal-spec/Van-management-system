import multer, { StorageEngine, FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config/environment';

// Simple ID generator
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

const createLocalStorage = (): StorageEngine => {
  const uploadsDir = config.upload.local.uploadsDir;
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `${generateId()}${ext}`;
      cb(null, filename);
    },
  });
};

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedPdfTypes = ['application/pdf'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

  const mimetype = file.mimetype;

  if (allowedImageTypes.includes(mimetype) ||
      allowedPdfTypes.includes(mimetype) ||
      allowedVideoTypes.includes(mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${mimetype} not allowed`));
  }
};

// Initialize storage
const storage = createLocalStorage();

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5,
  },
});

export const storageService = {
  getProvider: (): string => 'local',
  deleteFile: async (filePath: string): Promise<boolean> => {
    if (filePath) {
      const fullPath = path.join(config.upload.local.uploadsDir, filePath);
      try {
        await fs.promises.unlink(fullPath);
        return true;
      } catch (err) {
        console.error('Failed to delete file:', err);
        return false;
      }
    }
    return true;
  },
};
