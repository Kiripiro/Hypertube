const fs = require('fs');
const path = require('path');
var torrentStream = require('torrent-stream');

ACCEPTED_FILES = [".mp4"]
PATH_DOWNLOAD_DIR = "/app/download"

MIN_BYTES = 30000000;

const green = "\x1b[32m";
const red = "\x1b[31m";
const reset = "\x1b[0m";

class Torrent {
    
    ytsId = 0;
    torrents = [];

    torrentName;
    fileSize;
    path;

    downloaded;
    downloadStarted;

    _percentageDownloaded;
    engine;

    constructor(ytsId, sortedTorrents) {
        this.ytsId = ytsId;
        this.torrents = sortedTorrents;
        this.torrentName = "";
        this.fileSize = 0;
        this.path = "";
        this.downloaded = false;
        this.downloadStarted = false;
        this._percentageDownloaded = 0;
        this.engine = null;
    }

    checkCanStream() {
        if (this.path.length > 0 && fs.existsSync(this.path)) {
            const stat = fs.statSync(this.path);
            const size = stat.size;
            if (size >= MIN_BYTES) {
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
        console.log(green + 'TORRENT startDownload' + reset);
        this.downloadStarted = true;
        if (this.torrents.length <= 0 || this.torrents[0] == undefined || this.torrents[0] == null) {
            console.error("TORRENT torrents empty or null")
            throw Error("TORRENT torrents empty or null");
        }
        if (this.torrents[0].seeds < 5) { //TODO
            console.log(red + 'TORRENT torrent.seeds = ' + this.torrents[0].seeds);
        }
        const magnet = this.torrents[0].magnet;
        console.log(green + 'TORRENT magnet = ' + magnet + reset);
        this.engine = torrentStream(magnet);

        this.engine.on('download', data => {
            if (this.path.length > 0 && fs.existsSync(this.path)) {
                const stat = fs.statSync(this.path);
                const size = stat.size;
                const percentage = size / this.fileSize * 100;
                if (this._percentageDownloaded != Math.floor(percentage)) {
                    this._percentageDownloaded = Math.floor(percentage);
                    console.log(green + "TORRENT download " + this._percentageDownloaded + "%, file size = " + size + ", expected size = " + this.fileSize + ", torrentName = " + this.torrentName + reset);
                }
            } else {
                console.error("TORRENT download torrent but file don't exist")
            }
            callbackDownload();
        });

        this.engine.on('ready', () => {
            console.log(green + 'TORRENT ready' + reset);
            var checkAcceptedFiles = false;
            this.engine.files.forEach(async (file) => {
                if (ACCEPTED_FILES.includes(path.extname(file.name))) {
                    checkAcceptedFiles = true;
                    console.log(green + 'TORRENT ready file accepted ' + file.name + ', path: ' + file.path + reset);
                    this.torrentName = file.name;
                    this.fileSize = file.length;
                    var stream = file.createReadStream();
                    var destinationPath = path.join(PATH_DOWNLOAD_DIR, file.name);
                    this.path = destinationPath;
                    var writeStream = fs.createWriteStream(destinationPath);
                    stream.pipe(writeStream);
                    writeStream.on('finish', function () {
                        console.log(green + 'TORRENT writeStream finish' + reset);
                        this.downloaded = true;
                        callbackWriteStreamFinish();
                    });
                    callbackTorrentReady();
                }
            });
            if (!checkAcceptedFiles) { //TODO
                console.log(red + "TORRENT no accepted files found" + reset);
                this.engine.files.forEach(async (file) => {
                    console.log(green + 'TORRENT file ' + file.name + reset);
                });
            }
        });

        this.engine.on('idle', function () {
            console.log(green + 'TORRENT idle' + reset);
        });

        this.engine.on('torrent', function () {
            console.log(green + 'TORRENT torrent' + reset);
        });

        this.engine.on('error', function () {
            console.error('TORRENT engine error');
        });
    }

    stopDownload() {
        console.log(green + 'TORRENT stopDownload' + reset);
        this.downloadStarted = false;
        if (this.engine != null) {
            this.engine.destroy();
        }
    }
}

module.exports = Torrent;