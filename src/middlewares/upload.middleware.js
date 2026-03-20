const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');

// SECURITY: Allowed MIME types and their expected magic bytes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Magic bytes for file type validation
const MAGIC_BYTES = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG magic bytes
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG magic bytes
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46], // %PDF
  ],
};

/**
 * Validates file content against magic bytes.
 * Returns true if file matches expected type, false otherwise.
 */
function validateMagicBytes(filePath, mimeType) {
  const expectedMagicArrays = MAGIC_BYTES[mimeType];
  if (!expectedMagicArrays) {
    return false;
  }

  try {
    // Read first 8 bytes of file
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(8);
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    // Check if any of the expected magic byte patterns match
    return expectedMagicArrays.some((magicBytes) => {
      for (let i = 0; i < magicBytes.length; i++) {
        if (buffer[i] !== magicBytes[i]) {
          return false;
        }
      }
      return true;
    });
  } catch (err) {
    logger.error(`Magic byte validation error: ${err.message}`);
    return false;
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(__dirname, '../../uploads/receipts'));
  },
  filename: (_req, file, cb) => {
    // SECURITY: Generate secure filename, don't trust user input
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    // Force safe extension based on declared MIME type
    const safeExtensions = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'application/pdf': '.pdf',
    };
    const ext = safeExtensions[file.mimetype] || '.bin';
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Invalid file type: ${file.mimetype}. Allowed: jpg, png, pdf`
      ),
      false
    );
  }
};

const uploadReceipt = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * Middleware to validate uploaded file content against magic bytes.
 * Must be used AFTER multer upload middleware.
 */
function validateFileContent(req, res, next) {
  if (!req.file) {
    return next(); // No file uploaded, proceed
  }

  const { path: filePath, mimetype } = req.file;

  // SECURITY: Validate file content matches declared MIME type
  const isValid = validateMagicBytes(filePath, mimetype);

  if (!isValid) {
    // Delete the invalid file
    try {
      fs.unlinkSync(filePath);
      logger.warn(`Deleted invalid file (magic byte mismatch): ${filePath}`);
    } catch (err) {
      logger.error(`Failed to delete invalid file: ${err.message}`);
    }

    return next(
      new BadRequestError(
        'File content does not match declared type. Possible file type spoofing detected.'
      )
    );
  }

  next();
}

module.exports = { uploadReceipt, validateFileContent };
