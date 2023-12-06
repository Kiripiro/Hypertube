const fs = require('fs');
const path = require('path');
var torrentStream = require('torrent-stream');
var parseTorrent = require('parse-torrent');
var parseTorrentRemote = require('parse-torrent');

ACCEPTED_FILES = [".mp4"]
PATH_DOWNLOAD_DIR = "/app/download"

class Torrent {
    
    torrentMagnet;
    torrentName;
    fileSize;
    path;
    downloaded;
    error;
    downloadStarted;
    ytsId = 0;
    torrents = [];
    engine;

    percentageDownloaded;

    constructor(ytsId, sortedTorrents) {
        this.ytsId = ytsId;
        this.torrents = sortedTorrents;
        this.torrentName = "";
        this.fileSize = 0;
        this.path = "";
        this.downloaded = false;
        this.error = false;
        this.downloadStarted = false;
        this.percentageDownloaded = 0;
        this.engine = null;
        // const parsedTorrent = parseTorrent(torrentMagnet);
        // console.log(parsedTorrent);
    }

    checkCanStream() {
        // console.log("checkCanStream percentageDownloaded", this.percentageDownloaded)
        if (this.path.length > 0 && fs.existsSync(this.path)) {
            const stat = fs.statSync(this.path);
            const size = stat.size;
            // console.log("checkCanStream size", size);
            const estimatedTime = size / 25;
            // console.log("checkCanStream estimatedTime", estimatedTime);
            if (this.percentageDownloaded > 3) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    getDownloadedSize() {
        if (this.path.length > 0 && fs.existsSync(this.path)) {
            const stat = fs.statSync(this.path);
            const size = stat.size;
            return size;
        }
        return 0;
    }

    startDownload(callbackDownload, callbackTorrentReady, callbackWriteStreamFinish) {
        console.log("startDownload")
        if (this.torrents.length <= 0 || this.torrents[0] == undefined || this.torrents[0] == null) {
            console.error("startDownload error")
            return ;
        }
        console.log("magnet", this.torrents[0].magnet)
        this.engine = torrentStream(this.torrents[0].magnet);

        this.engine.on('download', data => {
            if (this.path.length > 0 && fs.existsSync(this.path)) {
                const stat = fs.statSync(this.path);
                const size = stat.size;
                const percentage = size / this.fileSize * 100;
                if (this.percentageDownloaded != Math.floor(percentage)) {
                    this.percentageDownloaded = Math.floor(percentage);
                    console.log("download " + this.percentageDownloaded + "%, file size = " + size + ", expected size = " + this.fileSize);
                }
            } else {
                console.log("download torrent but file don't exist");
            }
            callbackDownload();
        });

        this.engine.on('ready', () => {
            console.log('ready');
            this.engine.files.forEach(async (file) => {
                if (ACCEPTED_FILES.includes(path.extname(file.name))) {
                    // console.log("file.name", file.name)
                    // console.log("file.path", file.path)
                    this.torrentName = file.name;
                    this.fileSize = file.length;
                    this.downloadStarted = true;
                    var stream = file.createReadStream();
                    var destinationPath = path.join(PATH_DOWNLOAD_DIR, file.name);
                    this.path = destinationPath;
                    var writeStream = fs.createWriteStream(destinationPath);
                    stream.pipe(writeStream);
                    writeStream.on('finish', function () {
                        // console.log('writeStream finish');
                        // console.log('this.fileSize', this.fileSize);
                        const stat = fs.statSync(destinationPath);
                        const size = stat.size;
                        // console.log('real size', size);
                        this.downloaded = true;
                        callbackWriteStreamFinish();
                    });
                    callbackTorrentReady();
                }
            });
        });

        this.engine.on('idle', function () {
            console.log('idle');
        });

        this.engine.on('torrent', function () {
            console.log('torrent');
        });

        this.engine.on('error', function () {
            console.log('error');
        });
    }

    stopDownload() {
        console.log("stopDownload")
        if (this.engine != null) {
            this.engine.destroy();
        }
    }
}

module.exports = Torrent;