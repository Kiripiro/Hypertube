require('dotenv').config();
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

module.exports = ffmpeg;
const Torrent = require('./torrent');
const MovieFile = require('./movieFile');
const TorrentHelper = require('../helpers/torrent.helper');
const axios = require('axios');
const SubtitlesHelper = require('../helpers/subtitles.helper');
const FreeTorrentScrapper = require('../helpers/freeTorrentScrapper.helper');
const s = require('torrent-stream');

const YTS_MOVIE_DETAUILS_URL = 'movie_details.json?movie_id=';

const red = "\x1b[31m";
const blue = "\x1b[34m";
const reset = "\x1b[0m";

const languages = [
    'en',
    'fr',
    'es',
    'de',
    'it',
    'ru',
    'zh',
    'ja',
    'ko',
    'ar'
];

class StreamController {

    torrentTab = [];
    fileTab = [];
    lastByteSent = 0;

    streamLauncher = async (req, res) => {
        try {
            const ytsId = req.params.ytsId;
            const freeId = req.params.freeId;
            const imdbId = req.params.imdbId;
            if (ytsId > 0) {
                var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
            } else {
                var torrent = this.torrentTab.find(it => it.freeId == freeId);
            }
            if (torrent && (torrent.downloadStarted || torrent.downloaded)) {
                const size = torrent.getDownloadedSize();
                const totalSize = torrent.fileSize;
                const error = !torrent.checkDownload();
                const isMKV = torrent.isMKV ? torrent.isMKV : false;
                const isWebm = torrent.isWebm ? torrent.isWebm : false;
                console.log(blue + 'streamLauncher torrent exist and started. size: ' + size + ' totalSize: ' + totalSize + '' + reset);
                return res.status(200).json({ data: { size: size, totalSize: totalSize, downloadError: error, isMKV: isMKV, isWebm: isWebm } });
            } else {
                if (!torrent) {
                    console.log(blue + 'streamLauncher torrent not exist' + reset);
                    var sortedTorrents = [];
                    if (ytsId > 0) {
                        const ytsApiResponse = await axios.get(`${process.env.TORRENT_API}${YTS_MOVIE_DETAUILS_URL}${ytsId}`);
                        if (!ytsApiResponse || !ytsApiResponse.data || !ytsApiResponse.data.data || !ytsApiResponse.data.data.movie) {
                            console.error('Error streamLauncher with YTS API response');
                            return res.status(400).json({ error: 'Error with YTS API response' });
                        }
                        sortedTorrents = TorrentHelper.sortTorrents(
                            ytsApiResponse.data.data.movie.torrents,
                            ytsApiResponse.data.data.movie.title_long
                        );
                        if (sortedTorrents == null) {
                            console.error('Error streamLauncher with YTS API response');
                            return res.status(400).json({ error: 'Error with YTS API torrent response' });
                        }
                    } else {
                        sortedTorrents = [{
                            magnet: FreeTorrentScrapper.getMovieMagnet(freeId),
                            hash: "",
                            quality: "",
                            size_bytes: "",
                            seeds: 1000
                        }]
                        if (sortedTorrents[0].magnet == null || sortedTorrents[0].magnet == undefined) {
                            console.error('Error streamLauncher with FreeTorrentScrapper');
                            return res.status(400).json({ error: 'Error with FreeTorrentScrapper' });
                        }
                    }
                    torrent = new Torrent(ytsId, freeId, imdbId, sortedTorrents);
                    this.torrentTab.push(torrent);
                }
                if (!torrent.downloadStarted) {
                    console.log(blue + 'streamLauncher torrent not started' + reset);
                    torrent.startDownload(
                        () => { },
                        () => {
                            const file = this.fileTab.find(it => it.fileName == (torrent ? (torrent.torrentName ? torrent.torrentName : "") : ""));
                            if (!file) {
                                const newFile = new MovieFile(torrent.torrentName, torrent.path, torrent.fileSize);
                                this.fileTab.push(newFile);
                            }
                        },
                        () => { }
                    );
                }
                const size = torrent.getDownloadedSize();
                const totalSize = torrent.fileSize;
                const isMKV = torrent.isMKV ? torrent.isMKV : false;
                console.log(blue + 'streamLauncher torrent not exist and/or not started. size: ' + size + ' totalSize: ' + totalSize + reset);
                return res.status(200).json({ data: { size: size, totalSize: totalSize, isMKV: isMKV } });
            }
        } catch (error) {
            console.error('Error streamLauncher:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    _sendRange(range, torrent, res, time) {
        if (!torrent.checkCanStream()) {
            console.log(red + 'sendRange torrent can\'t stream' + reset);
            setTimeout(() => {
                this._sendRange(range, torrent, res, time);
            }, 5000);
        } else {
            const file = this.fileTab.find(it => it.fileName == torrent.torrentName);
            if (!file) {
                console.log("error file not found")
                return;
            }
            var filePath = file.filePath;
            const stat = fs.statSync(filePath)
            const fileSize = stat.size
            const expectedFileSize = file.expectedFileSize;
            const readStream = fs.createReadStream(filePath)
            if (torrent.isMKV) {
                var startTime = 0;
                if (time > 0) {
                    startTime = time;
                }
                console.log("startTime", startTime);
                const startTimeString = startTime.toString();
                ffmpeg()
                .input(readStream)
                .outputOptions([
                    '-ss ' + startTime.toString(),
                    '-deadline realtime',
                    '-preset ultrafast',
                    '-movflags frag_keyframe+separate_moof+omit_tfhd_offset+empty_moov+faststart',
                    '-g 52',
                ])
                .outputFormat('mp4')
                .on('start', () => {
                    console.log('start')
                })
                .on('progress', (progress) => {
                    console.log(`progress: ${progress.timemark}`)
                })
                .on('end', () => {
                    console.log('Finished processing')
                    readStream.destroy()
                })
                .on('error', (err) => {
                    console.log(`ERROR: ${err.message}`)
                })
                .pipe(res)
                res.on('close', () => {
                    console.log('res.on close')
                })
            } else {
                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-")
                    const fileSizeSecuNormalized = 0.95;
                    var chunkSizeToSend = 1000000;
                    var start = parseInt(parts[0], 10)
                    const startNormalized = start / fileSize;
                    if (startNormalized >= fileSizeSecuNormalized) {
                        chunkSizeToSend = 10000;
                    }
                    if (start >= fileSize) {
                        console.log(red + 'sendRange start > fileSize, start = ' + start + reset);
                        var end = parts[1] ? parseInt(parts[1], 10) : start + chunkSizeToSend;
                        if (end > file.expectedFileSize) {
                            end = file.expectedFileSize - 1;
                        }
                        if (start > end) {
                            start = end - 1;
                        }
                        const chunksize = ((end - start) > 0 ? (end - start) : -1) + 1
                        const startData = fileSize - (chunksize * 4) - 1;
                        // const startData = 0; // TODO
                        const endData = start + chunksize;
    
                        const readStream = fs.createReadStream(filePath, { startData, endData })
    
                        const head = {
                            'Content-Range': `bytes ${start}-${end}/${expectedFileSize}`,
                            'Accept-Ranges': 'bytes',
                            'Content-Length': chunksize,
                            'Content-Type': 'video/mp4',
                        }
                        res.writeHead(206, head)
                        readStream.pipe(res)
                    } else {
                        var end = parts[1] ? parseInt(parts[1], 10) : start + chunkSizeToSend;
                        if (end > fileSize) {
                            end = fileSize - 1;
                        }
                        if (start > end) {
                            console.log("start" + start + " end" + end + " fileSize" + fileSize);
                            start = end - 1;
                        }
                        this.lastByteSent = end;
                        const chunksize = ((end - start) > 0 ? (end - start) : -1) + 1
                        const readStream = fs.createReadStream(filePath, { start, end })
                        const head = {
                            'Content-Range': `bytes ${start}-${end}/${expectedFileSize}`,
                            'Accept-Ranges': 'bytes',
                            'Content-Length': chunksize,
                            'Content-Type': 'video/mp4',
                        }
                        res.writeHead(206, head)
                        readStream.pipe(res)
                    }
                } else {
                    console.log(red + 'No range' + reset);
                    const head = {
                        'Content-Length': fileSize,
                        'Content-Type': 'video/mp4',
                    }
                    res.writeHead(200, head)
                    fs.createReadStream(filePath).pipe(res)
                }
            }
        }
    }

    getStream = async (req, res) => {
        try {
            const ytsId = req.params.ytsId;
            const freeId = req.params.freeId;
            const time = req.params.time;
            if (ytsId > 0) {
                var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
            } else {
                var torrent = this.torrentTab.find(it => it.freeId == freeId);
            }
            const file = this.fileTab.find(it => it.fileName == (torrent.torrentName ? torrent.torrentName : ""));
            if (torrent && file && file.checkExist()) {
                const range = req.headers.range;
                this._sendRange(range, torrent, res, time);
            } else {
                console.error("getStream torrent or file not exist");
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        } catch (error) {
            console.error('Error getStream:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    getFileSize = async (req, res) => {
        try {
            const ytsId = req.params.ytsId;
            const freeId = req.params.freeId;
            if (ytsId > 0) {
                var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
            } else {
                var torrent = this.torrentTab.find(it => it.freeId == freeId);
            }
            if (torrent) {
                let size = torrent.getDownloadedSize();
                return res.status(200).json({ data: { size: size, duration: 0 } });
            } else {
                return res.status(200).json({ data: { size: 0 } });
            }
        } catch (error) {
            console.error('Error getFileSize:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    stopStream = async (req, res) => {
        try {
            const ytsId = req.params.ytsId;
            const freeId = req.params.freeId;
            if (ytsId > 0) {
                var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
            } else {
                var torrent = this.torrentTab.find(it => it.freeId == freeId);
            }
            if (torrent) {
                console.log(blue + 'stopStream' + reset);
                torrent.stopDownload();
                return res.status(200).json({ message: 'Torrent stopped' });
            } else {
                console.log(red + 'stopStream but torrent not exist' + reset);
                return res.status(200).json({ message: 'Torrent don\'t exist' });
            }
        } catch (error) {
            console.error('Error getMovieLoading:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    downloadSubtitles = async (req, res) => {
        try {
            console.log("downloadSubtitles");
            const imdbId = req.params.imdbId;
            const lang = req.params.lang;
            const tabLang = lang.split("-");
            const time = req.params.time;
            const userId = req.user.userId;
            console.log('time', time);
            if (tabLang.length <= 0) {
                return res.status(400).json({ message: 'Missing language parameter' });
            } else if (tabLang.length > 2) {
                return res.status(400).json({ message: 'Max two language parameters' });
            }
            console.log("tabLang", tabLang);
            let retTab = [];
            for (let i = 0; i < tabLang.length; i++) {
                if (languages.indexOf(tabLang[i]) == -1) {
                    retTab.push({
                        lang: tabLang[i],
                        filePath: null,
                        error: "Unsupported language"
                    });
                } else {
                    const filePath = await SubtitlesHelper.getSubtitles(imdbId, tabLang[i]);
                    if (filePath == -1) {
                        retTab.push({
                            lang: tabLang[i],
                            filePath: null,
                            error: "Error with OpenSubtitles API response"
                        });
                    } else if (filePath == 0) {
                        retTab.push({
                            lang: tabLang[i],
                            filePath: null,
                            error: "Subtitles not found"
                        });
                    } else if (filePath != null && filePath != undefined && filePath.length > 0) {
                        if (time > 0) {
                            const fileName = filePath.replace('.vtt', '-forMKV-' + userId + '.vtt');
                            const timeOffset = time;
                            const ret = await this.processVTT(filePath, fileName, timeOffset, this._updateTime);
                            if (ret == null || ret == undefined) {
                                retTab.push({
                                    lang: tabLang[i],
                                    filePath: null,
                                    error: "Error processing subtitles"
                                });
                            } else {
                                const fileName = ret.replace('/app/subtitles/vtt/', '');
                                retTab.push({
                                    lang: tabLang[i],
                                    filePath: fileName,
                                    error: ""
                                });
                            }
                        } else {
                            const fileName = filePath.replace('/app/subtitles/vtt/', '');
                            retTab.push({
                                lang: tabLang[i],
                                filePath: fileName,
                                error: ""
                            });
                        }
                    } else {
                        retTab.push({
                            lang: tabLang[i],
                            filePath: null,
                            error: "Error OpenSubtitles API response (1)"
                        });
                    }
                }
            }
            return res.status(200).json({ subtitles: retTab });
        } catch (error) {
            console.error('Error downloadSubtitles:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    _updateTime = (originalTime, offset) => {
        let parts = originalTime.split(':');
        let originalTimeSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
        let seconds = originalTimeSeconds - offset;
        if (seconds < 0) {
            return "TOREMOVE_TOREMOVE";
        }
        seconds = seconds.toFixed(3);
        let hoursPat = Math.floor(seconds / 3600);
        seconds -= hoursPat * 3600;
        let minutesPat = Math.floor(seconds / 60);
        let secondsPat = seconds - minutesPat * 60;
        let [wholeSeconds, fractional] = String(secondsPat).split(".");
        if (fractional && fractional.length > 0) {
            if (fractional.length == 1) {
                fractional = fractional + "00";
            } else if (fractional.length == 2) {
                fractional = fractional + "0";
            } else {
                fractional = fractional.substring(0, 3)
            }
        } else {
            fractional = "000";
        }
        if(fractional.length === 1) {
            fractional = fractional + "0";
        }
        let hoursStr = hoursPat.toString().padStart(2, '0');
        let minutesStr = minutesPat.toString().padStart(2, '0');
        let secondsStr = wholeSeconds.toString().padStart(2, '0');
        const timeString = `${hoursStr}:${minutesStr}:${secondsStr}.${fractional}`;
        return timeString;
    }
      
    async processVTT(inputPath, outputPath, offsetSeconds, _updateTime) {
        try {
            const data = await fsPromises.readFile(inputPath, 'utf8')
            if (data == null || data == undefined || data.length <= 0) {
                return null;
            }
            let segments = data.split('\r\n\r\n');
            let newSegments = segments.map(segment => {
                let lines = segment.split('\n');
                if (lines.length >= 2 && lines[0].includes('-->')) {
                    let times = lines[0].split(' --> ');
                    const time0 = _updateTime(times[0], offsetSeconds);
                    if (time0 == "TOREMOVE_TOREMOVE") {
                        return "TOREMOVE_TOREMOVE";
                    } else {
                        times[0] = time0;
                    }
                    const time1 = _updateTime(times[1], offsetSeconds);
                    if (time1 == "TOREMOVE_TOREMOVE") {
                        return "TOREMOVE_TOREMOVE";
                    } else {
                        times[1] = time1;
                    }
                    lines[0] = times.join(' --> ');
                }
                return lines.join('\n');
            }).filter(segment => {
                if (segment.includes('TOREMOVE_TOREMOVE')) {
                    return false;
                }
                return true;
            });
            console.log("newSegments.length", newSegments.length);

            let newContent = newSegments.join('\n\n');
            await fsPromises.writeFile(outputPath, newContent);
            console.log("File was saved as", outputPath);
            console.log("ret 1", outputPath);
            return outputPath;
        } catch (err) {
            console.error("An error occurred:", err);
            return null;
        }
    }
}

module.exports = new StreamController();
