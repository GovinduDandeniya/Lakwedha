const multer = require('multer');

/**
 * Basic multer disk config tailored for uploading files safely.
 * We want to process the buffer in Memory first so we can AES encrypt it
 * efficiently before flushing it to disk via fs.writeFileSync!
 */
const storage = multer.memoryStorage();

const memoryUpload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB Limit
    }
});

module.exports = memoryUpload;
