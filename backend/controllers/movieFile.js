const fs = require('fs');
const path = require('path');

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
        // console.log("this.filePath", this.filePath)
        // console.log("fs.existsSync(this.filePath)", fs.existsSync(this.filePath))
        return fs.existsSync(this.filePath);
    }

    getPercentageDownloaded() {
        if (!this.checkExist()) {
            console.log("getPercentageDownloaded checkExist false")
            return 0;
        }
        const stat = fs.statSync(filePath);
        const size = stat.size;
        // console.log("size", size)
        // console.log("this.expectedFileSize", this.expectedFileSize)

        return size / this.expectedFileSize * 100;
    }

    getHeadWithRange(range) {
        if (range) {
            console.log("range yes")
            console.log(range)
            const parts = range.replace(/bytes=/, "").split("-")
            const start = parseInt(parts[0], 10)
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
            // console.log("start", start)
            // console.log("end", end)
            const chunksize = (end - start) + 1

            const file = fs.createReadStream(path, { start, end })

            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            }

            res.writeHead(206, head)
            file.pipe(res)

        } else {
            console.log("range no")
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            }
            res.writeHead(200, head)
            fs.createReadStream(path).pipe(res)
        }
    }
}

module.exports = MovieFile;