require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const Torrent = require('./torrent');
const MovieFile = require('./movieFile');
var parseTorrent = require('parse-torrent');
const TorrentHelper = require('../helpers/torrent.helper');

const YTS_MOVIE_DETAUILS_URL = 'movie_details.json?movie_id=';

const red = "\x1b[31m";
const yellow = "\x1b[33m";
const blue = "\x1b[34m";
const reset = "\x1b[0m";

class StreamController {

    torrentTab = [];
    fileTab = [];
    lastByteSent = 0;

    streamLauncher = async (req, res) => {
        try {
            const ytsId = req.params.id;
            var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
            if (torrent && torrent.downloadStarted) {
                const size = torrent.getDownloadedSize();
                const totalSize = torrent.fileSize;
                console.log(blue + 'streamLauncher torrent exist and started. size: ' + size + ' totalSize: ' + totalSize + '' + reset);
                return res.status(200).json({ data: { size: size, totalSize: totalSize} });
            } else {
                if (!torrent) {
                    console.log(blue + 'streamLauncher torrent not exist' + reset);
                    const ytsApiResponse = await axios.get(`${process.env.TORRENT_API}${YTS_MOVIE_DETAUILS_URL}${ytsId}`);
                    if (!ytsApiResponse || !ytsApiResponse.data || !ytsApiResponse.data.data || !ytsApiResponse.data.data.movie) {
                        console.error('Error streamLauncher with YTS API response');
                        return res.status(400).json({ error: 'Error with YTS API response' });
                    }
                    const sortedTorrents = TorrentHelper.sortTorrents(
                        ytsApiResponse.data.data.movie.torrents,
                        ytsApiResponse.data.data.movie.title_long
                        );
                    if (sortedTorrents == null) {
                        console.error('Error streamLauncher with YTS API response');
                        return res.status(400).json({ error: 'Error with YTS API torrent response' });
                    }
                    torrent = new Torrent(ytsId, sortedTorrents);
                    this.torrentTab.push(torrent);
                }
                if (!torrent.downloadStarted) {
                    console.log(blue + 'streamLauncher torrent not started' + reset);
                    torrent.startDownload(
                        () => {},
                        () => {
                            const file = this.fileTab.find(it => it.fileName == (torrent ? (torrent.torrentName ? torrent.torrentName : "") : ""));
                            if (!file) {
                                const newFile = new MovieFile(torrent.torrentName, torrent.path, torrent.fileSize);
                                this.fileTab.push(newFile);
                            }
                        },
                        () => {}
                    );
                }
                const size = torrent.getDownloadedSize();
                const totalSize = torrent.fileSize;
                console.log(blue + 'streamLauncher torrent not exist and/or not started. size: ' + size + ' totalSize: ' + totalSize + reset);
                return res.status(200).json({ data: { size: size, totalSize: totalSize} });
            }
        } catch (error) {
            console.error('Error streamLauncher:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    _sendRange(range, torrent, res) {
        if (!torrent.checkCanStream()) {
            console.log(red + 'sendRange torrent can\'t stream' + reset);
            setTimeout(() => {
                this._sendRange(range, torrent, res);
            }, 5000);
        } else {
            const file = this.fileTab.find(it => it.fileName == torrent.torrentName);
            if (!file) {
                console.log("error file not found")
                return;
            }
            const filePath = file.filePath;
            const stat = fs.statSync(filePath)
            const fileSize = stat.size
            const expectedFileSize = file.expectedFileSize;
            
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-")
                const chunkSizeToSend = 100000;
                var start = parseInt(parts[0], 10)

                if (start > fileSize) {
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
                        console.log("AIE")
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

    getStream = async (req, res) => {
        try {
            const ytsId = req.params.id;
            var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
            const file = this.fileTab.find(it => it.fileName == (torrent.torrentName ? torrent.torrentName : ""));
            if (torrent && file && file.checkExist()) {
                const range = req.headers.range;
                this._sendRange(range, torrent, res);
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
            const ytsId = req.params.id;
            var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
            if (torrent) {
                let size = torrent.getDownloadedSize();
                return res.status(200).json({ data: { size: size } });
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
            const ytsId = req.params.id;
            var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
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

    getTorrentInfos = async (req, res) => { //for test, WIP
        try {
            const ytsId = req.params.id;
            const moveDetailsUrl = 'movie_details.json?movie_id=';
            const ytsApiResponse = await axios.get(`${process.env.TORRENT_API}${moveDetailsUrl}${ytsId}`);
            if (!ytsApiResponse || !ytsApiResponse.data || !ytsApiResponse.data.data || !ytsApiResponse.data.data.movie) {
                return res.status(400).json({ error: 'Error with YTS API response' });
            }
            const ytsApiTorrents = ytsApiResponse.data.data.movie.torrents;
            const titleLong = ytsApiResponse.data.data.movie.title_long;
            if (ytsApiTorrents == null || ytsApiTorrents == undefined || ytsApiTorrents.length <= 0) {
                console.log("getTorrentInfos ytsApiTorrents null");
                return res.status(400).json({ error: 'Error with YTS API response, torrents null' });
            }
            ytsApiTorrents.forEach(torrent => {
                // console.log("torrent", torrent);
                // torrentInfos.addTorrent(torrent.url);

                const encodedUrl = titleLong.replaceAll(" ", "%20");
                // const magnet = `magnet:?xt=urn:btih:${torrent.hash}`;
                const magnet = `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodedUrl}`;
                const a = parseTorrent(magnet);
                // console.log("a", a);
            });
            // const b = 'magnet:?xt=urn:btih:0719223EC1C863C85454DAD4F297F2D35F22B15E&amp;dn=Kla%20Fun%20(2024)&amp;tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&amp;tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337';
            // const a2 = parseTorrent(b);
            // console.log("a2", a2);
            // const slug = ytsApiResponse.data.data.movie.slug;
            // const titleLong = ytsApiResponse.data.data.movie.title_long;
            // // console.log("movie", ytsApiResponse.data.data.movie)
            // const sortedTorrents = this.sortTorrents(ytsApiTorrents, titleLong);
            return res.status(200).json({});
        } catch (error) {
            console.error('Error getMovieLoading:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };
}

module.exports = new StreamController();


// if (start > fileSize) { //doesn't work, stop streaming
    // const start = fileSize - chunkSizeToSend - 1;
    // const end = fileSize - 1;
    // const readStream = fs.createReadStream(filePath, { start, end });
    // const chunksize = ((end - start) > 0 ? (end - start) : -1) + 1;
    // const head = {
    //     'Content-Range': `bytes ${start}-${end}/${expectedFileSize}`,
    //     'Accept-Ranges': 'bytes',
    //     'Content-Length': chunksize,
    //     'Content-Type': 'video/mp4',
    // }
    // res.writeHead(206, head)
    // readStream.pipe(res) //don't work

    // res.writeHead(204);
    // res.end(); //don't work

    // res.writeHead(200, {
    //     'Content-Length': 0
    // });
    // res.end(); //don't work

    // console.log(red + 'sendRange start > fileSize' + reset);
    // res.writeHead(416, {
    //     'Content-Range': `bytes */${fileSize}`,
    //     'Content-Type': 'text/plain'
    //   });
    // res.end('Requested Range Not Satisfiable'); //don't work
// }

//keep this for now

// getMovieStreamOriginal = async (req, res) => {
//     try {
//         const magnet2 = "magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fbig-buck-bunny.torrent"
//         const magnet3 = "magnet:?xt=urn:btih:c9e15763f722f23e98a29decdfae341b98d53056&dn=Cosmos+Laundromat&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fcosmos-laundromat.torrent"
//         const magnet4 = "magnet:?xt=urn:btih:7B1996E90511DFBA36A51437A892C4AA06F0CC3A&amp;dn=Any%20Number%20Can%20Win%20(1963)&amp;tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&amp;tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337"
//         const magnet5 = "magnet:?xt=urn:btih:7568465048279D0BDBD1BD9EE13C95C0A9662AE2&amp;dn=A%20Chinese%20Ghost%20Story%20II%20(1990)&amp;tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&amp;tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337"
//         const magnet6 = "magnet:?xt=urn:btih:A0CE6D77D182B0F868E9169B871779E94DDF5E47&amp;dn=Say%20Goodnight%20to%20the%20Bad%20Guys%20(2008)&amp;tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&amp;tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337"
//         const ytsId = req.params.id;
//         const magnet = magnet6;
//         var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
//         const range = req.headers.range;
//         const file = this.fileTab.find(it => it.fileName == (torrent.torrentName ? torrent.torrentName : ""));
//         if (torrent && file && file.checkExist()) {
//             console.log("torrent and file exist");
//             this.sendRange(range, torrent, res);
//         } else {
//             console.log("Torrent or file not exist");
//             if (!torrent) {
//                 console.log("Torrent not exist");
//                 const moveDetailsUrl = 'movie_details.json?movie_id=';
//                 const ytsApiResponse = await axios.get(`${process.env.TORRENT_API}${moveDetailsUrl}${ytsId}`);
//                 if (!ytsApiResponse || !ytsApiResponse.data || !ytsApiResponse.data.data || !ytsApiResponse.data.data.movie) {
//                     return res.status(400).json({ error: 'Error with YTS API response' });
//                 }
//                 const ytsApiTorrents = ytsApiResponse.data.data.movie.torrents;
//                 const torrentSelected = this.chooseTorrent(ytsApiTorrents);
//                 if (torrentSelected == null) {
//                     return res.status(400).json({ error: 'Error with YTS API torrent response' });
//                 }
//                 return;
//                 torrent = new Torrent(magnet, ytsId);
//                 this.torrentTab.push(torrent);
//             }
//             torrent.startDownload(
//                 () => {

//                 },
//                 () => {
//                     console.log('callbackTorrentReady');
//                     const file = new MovieFile(torrent.torrentName, torrent.path, torrent.fileSize);
//                     this.fileTab.push(file);
//                     setTimeout(() => {
//                         this.sendRange(range, torrent, res);
//                     }, 5000);
//                 },
//                 () => {
//                     console.log('callbackWriteStreamFinish');
//                 }
//             );
//         }
//     } catch (error) {
//         console.error('Error getting movie:', error);
//         return res.status(500).json({ message: 'Internal Server Error' });
//     }
// };