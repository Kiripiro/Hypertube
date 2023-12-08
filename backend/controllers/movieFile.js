const fs = require('fs');

ACCEPTED_FILES = [".mp4"]
PATH_DOWNLOAD_DIR = "/app/download"

class MovieFile {
    
    fileName;
    filePath;
    expectedFileSize;

    constructor(fileName, filePath, expectedFileSize) {
        this.fileName = fileName;
        this.filePath = filePath;
        this.expectedFileSize = expectedFileSize;
    }

    checkExist() {
        return fs.existsSync(this.filePath);
    }
}

module.exports = MovieFile;