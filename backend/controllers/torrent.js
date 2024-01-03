const fs = require('fs');
const path = require('path');
var torrentStream = require('torrent-stream');

ACCEPTED_FILES = [".mp4", ".mkv"]
PATH_DOWNLOAD_DIR = "/app/download"

MIN_BYTES = 30000000;

COUNT_BEFORE_ERROR = 30;
COUNT_BEFORE_ERROR_WHEN_DOWNLOADSTARTED = 30;

PREDATOR_YTS_ID = 2390;
PREDATOR_MKV_MAGNET = "magnet:?xt=urn:btih:FDB569EC7F853672103FB82EA79F5FAB20247591&dn=Predator%20(1987)%20720p%20BrRip%20mkv%20-%20650MB%20-%20YIFY&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Ftracker.bittor.pw%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fpublic.popcorn-tracker.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce"
TEST_MAGNET = "magnet:?xt=urn:btih:79816060ea56d56f2a2148cd45705511079f9bca&dn=TPB.AFK.2013.720p.h264-SimonKlose&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969"

const green = "\x1b[32m";
const red = "\x1b[31m";
const reset = "\x1b[0m";

class Torrent {
    
    ytsId = 0;
    freeId = 0;
    imdbId = "";
    torrents = [];

    torrentName;
    fileSize;
    path;

    downloaded;
    downloadStarted;

    _percentageDownloaded;
    engine;
    countBeforeError;
    lastFileSize;
    isMKV;
    isWebm;
    noFilesToDownload;

    constructor(ytsId, freeId, imdbId, sortedTorrents) {
        this.ytsId = ytsId;
        this.freeId = freeId;
        this.imdbId = imdbId;
        this.torrents = sortedTorrents;
        this.torrentName = "";
        this.fileSize = 0;
        this.path = "";
        this.downloaded = false;
        this.downloadStarted = false;
        this._percentageDownloaded = 0;
        this.engine = null;
        this.countBeforeError = 0;
        this.lastFileSize = 0;
        this.isMKV = false;
        this.isWebm = false;
        this.noFilesToDownload = false;
    }

    checkDownload() {
        const currentSize = this.getDownloadedSize();
        console.log("currentSize = " + currentSize + ", lastFileSize = " + this.lastFileSize);
        if (this.noFilesToDownload) {
            return false;
        }
        if (currentSize == this.lastFileSize && currentSize < this.fileSize) {
            console.log("this.countBeforeError", this.countBeforeError)
            if (this.downloadStarted) {
                if (this.countBeforeError > COUNT_BEFORE_ERROR_WHEN_DOWNLOADSTARTED) {
                    return false;
                } else {
                    this.countBeforeError++;
                    return true;
                }
            } else {
                if (this.countBeforeError > COUNT_BEFORE_ERROR) {
                    return false;
                } else {
                    this.countBeforeError++;
                    return true;
                }
            }
        } else {
            this.lastFileSize = currentSize;
            this.countBeforeError = 0;
            return true;
        }
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
        var magnet = this.torrents[0].magnet;
        if (PREDATOR_YTS_ID == this.ytsId) {
            magnet = PREDATOR_MKV_MAGNET;
        }
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
                console.log(green + 'TORRENT ready file ' + file.name + ', path: ' + file.path + reset);
                if (path.extname(file.name) == '.mp4' || path.extname(file.name) == '.webm' || path.extname(file.name) == '.mkv') { 
                    if (path.extname(file.name) == '.mkv') {
                        this.isMKV = true;
                    }
                    if (path.extname(file.name) == '.webm') {
                        this.isWebm = true;
                    }
                    checkAcceptedFiles = true;
                    console.log(green + 'TORRENT ready file accepted ' + file.name + ', path: ' + file.path + reset);
                    this.torrentName = file.name;
                    this.fileSize = file.length;
                    var stream = file.createReadStream();
                    const extname = path.extname(file.name);
                    var destinationPath = path.join(PATH_DOWNLOAD_DIR, this.imdbId + extname);
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
            if (!checkAcceptedFiles) {
                this.noFilesToDownload = true;
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