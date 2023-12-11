require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const Torrent = require('./torrent');
const MovieFile = require('./movieFile');
var parseTorrent = require('parse-torrent');
const torrentInfos = require('./torrentInfos');
const TorrentHelper = require('../helpers/torrent.helper');

class MoviesController {

    torrentTab = [];
    fileTab = [];
    lastByteSent = 0;

    fetchYTSMovies = async (req, res) => {
        const params = {
            limit: req.query.limit || 20,
            page: req.query.page || 1,
            query_term: req.query.query_term || '0',
            genre: req.query.genre || 'all',
            sort_by: req.query.sort_by || 'download_count',
            order_by: req.query.order_by || 'desc',
            quality: req.query.quality || 'all',
        };
        const torrentApiUrl = process.env.TORRENT_API + 'list_movies.json';
        const omdbApiUrl = 'http://www.omdbapi.com/';

        try {
            console.log("params", params);
            const { data } = await axios.get(torrentApiUrl + `?limit=${params.limit}&page=${params.page}&query_term=${params.query_term}&genre=${params.genre}&sort_by=${params.sort_by}&order_by=${params.order_by}`);
            const { movie_count, movies } = data.data;
            if (movie_count === 0) {
                return res.status(200).json({ movies: [], hasMore: false });
            }
            const hasMore = movie_count > params.limit * params.page;

            if (movies) {
                const filteredMovies = await Promise.all(
                    movies.map(async (movie) => {
                        if (movie.year === 0)
                            return null;
                        if (movie.medium_cover_image && (await this._isImageAvailable(movie.medium_cover_image))) {
                            let data = {
                                title: movie.title,
                                poster_path: movie.medium_cover_image,
                                genre: movie.genre,
                                imdb_id: movie.imdb_code,
                                imdb_rating: movie.rating,
                                plot: movie.synopsis,
                                language: movie.language,
                                release_date: movie.year,
                                yts_id: movie.id
                            }
                            return data;
                        } else {
                            try {
                                const omdbResponse = await axios.get(`${omdbApiUrl}?i=${movie.imdb_code}&apikey=${process.env.OMDB_API_KEY}`);
                                const omdbData = omdbResponse.data;

                                if (omdbData.Poster === 'N/A' || omdbData.Poster === undefined) {
                                    return null;
                                } else if (omdbData.Poster) {
                                    movie.thumbnail = omdbData.Poster;
                                } else {
                                    return null;
                                }

                                const filteredMovieData = this._filteredMovieData(omdbData);
                                filteredMovieData.poster_path = movie.thumbnail;
                                return filteredMovieData;
                            } catch (error) {
                                console.error(`Error fetching OMDB data for movie with imdb_code ${movie.imdb_code}: ${error.message}`);
                                return null;
                            }
                        }
                    }),
                );
                const validMovies = filteredMovies.filter(movie => movie !== null);
                return res.status(200).json({ movies: validMovies, hasMore });
            }
        } catch (e) {
            console.error(e);
            return { movies: [], hasMore: false };
        }
    };

    fetchMovieDetails = async (req, res) => {
        const { imdb_id } = req.params;
        console.log("imdb_id", imdb_id);
        const omdbApiUrl = 'http://www.omdbapi.com/';
        // http://www.omdbapi.com/?apikey=[yourkey]&i=imd_id

        try {
            const omdbResponse = await axios.get(`${omdbApiUrl}?i=${imdb_id}&apikey=${process.env.OMDB_API_KEY}`);
            console.log("omdbResponse", omdbResponse);

            const omdbData = omdbResponse.data;
            return res.status(200).json({ movie: this._filteredMovieData(omdbData) });
        } catch (error) {
            console.error(`Error fetching OMDB data for movie with imdb_id ${imdb_id}: ${error.message}`);
            return res.status(200).json({ movie: {} });
        }
    }

    _isImageAvailable = async (imageUrl) => {
        try {
            const response = await axios.head(imageUrl);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    };

    _filteredMovieData = (omdbData) => {
        return {
            title: omdbData.Title,
            genre: omdbData.Genre,
            imdb_id: omdbData.imdbID,
            imdb_rating: omdbData.imdbRating,
            plot: omdbData.Plot,
            director: omdbData.Director,
            writer: omdbData.Writer,
            actors: omdbData.Actors,
            language: omdbData.Language,
            awards: omdbData.Awards,
            release_date: omdbData.Year,
        };
    };

    //streamPart

    getMovieLoading = async (req, res) => {
        try {
            const ytsId = req.params.id;
            var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
            if (torrent && torrent.downloadStarted) {
                console.log("getMovieLoading torrent and started");
                const size = torrent.getDownloadedSize();
                const percentageDownloaded = torrent.percentageDownloaded;
                const totalSize = torrent.fileSize;
                console.log("getMovieLoading size", size);
                console.log("getMovieLoading percentageDownloaded", percentageDownloaded);
                return res.status(200).json({ data: { size: size, percentage: percentageDownloaded, totalSize: totalSize} });
            } else {
                console.log("getMovieLoading Torrent not exist or not started");
                if (!torrent) {
                    console.log("getMovieLoading Torrent not exist");
                    const moveDetailsUrl = 'movie_details.json?movie_id=';
                    const ytsApiResponse = await axios.get(`${process.env.TORRENT_API}${moveDetailsUrl}${ytsId}`);
                    if (!ytsApiResponse || !ytsApiResponse.data || !ytsApiResponse.data.data || !ytsApiResponse.data.data.movie) {
                        return res.status(400).json({ error: 'Error with YTS API response' });
                    }
                    const ytsApiTorrents = ytsApiResponse.data.data.movie.torrents;
                    const slug = ytsApiResponse.data.data.movie.slug;
                    const titleLong = ytsApiResponse.data.data.movie.title_long;
                    // console.log("movie", ytsApiResponse.data.data.movie)
                    // const sortedTorrents = this.sortTorrents(ytsApiTorrents, titleLong);
                    const sortedTorrents = TorrentHelper.sortTorrents(ytsApiTorrents, titleLong);
                    if (sortedTorrents == null) {
                        return res.status(400).json({ error: 'Error with YTS API torrent response' });
                    }
                    torrent = new Torrent(ytsId, sortedTorrents);
                    this.torrentTab.push(torrent);
                    torrent.startDownload(
                        () => {

                        },
                        () => {
                            console.log('callbackTorrentReady');
                            const file = this.fileTab.find(it => it.fileName == (torrent ? (torrent.torrentName ? torrent.torrentName : "") : ""));
                            if (!file) {
                                const newFile = new MovieFile(torrent.torrentName, torrent.path, torrent.fileSize);
                                this.fileTab.push(newFile);
                            }
                        },
                        () => {
                            console.log('callbackWriteStreamFinish');
                        }
                    );
                } else if (!torrent.downloadStarted) {
                    torrent.startDownload(
                        () => {
    
                        },
                        () => {
                            console.log('callbackTorrentReady');
                            const file = this.fileTab.find(it => it.fileName == (torrent ? (torrent.torrentName ? torrent.torrentName : "") : ""));
                            if (!file) {
                                const newFile = new MovieFile(torrent.torrentName, torrent.path, torrent.fileSize);
                                this.fileTab.push(newFile);
                            }
                        },
                        () => {
                            console.log('callbackWriteStreamFinish');
                        }
                    );
                }
                const size = torrent.getDownloadedSize();
                const percentageDownloaded = torrent.percentageDownloaded;
                const totalSize = torrent.fileSize;
                return res.status(200).json({ data: { size: size, percentage: percentageDownloaded, totalSize: totalSize} });
            }
        } catch (error) {
            console.error('Error getMovieLoading:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    sendRange(range, torrent, res) {
        if (!torrent.checkCanStream()) {
            console.log("can't stream !")
            setTimeout(() => {
                this.sendRange(range, torrent, res);
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

                if (start > fileSize) { //doesn't work, stop streaming
                    const start = fileSize - chunkSizeToSend - 1;
                    const end = fileSize - 1;

                    const readStream = fs.createReadStream(filePath, { start, end });
                    const chunksize = ((end - start) > 0 ? (end - start) : -1) + 1;
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
                console.log("range no")
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                }
                res.writeHead(200, head)
                fs.createReadStream(filePath).pipe(res)
            }
        }
    }

    getMovieStream = async (req, res) => {
        try {
            const ytsId = req.params.id;
            var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
            const range = req.headers.range;
            const file = this.fileTab.find(it => it.fileName == (torrent.torrentName ? torrent.torrentName : ""));
            // console.log("fileTab", this.fileTab)
            // console.log("torrentTab", this.torrentTab)
            if (torrent && file && file.checkExist()) {
                this.sendRange(range, torrent, res);
            } else {
                console.error("Torrent or file not exist");
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        } catch (error) {
            console.error('Error getting movie:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    getMovieFileSize = async (req, res) => {
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
            console.error('Error getMovieLoading:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        } 
    };

    stopMovieLoading = async (req, res) => {
        try {
            const ytsId = req.params.id;
            var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
            if (torrent) {
                console.log("stopMovieLoading torrent exist");
                torrent.stopDownload();
                return res.status(200).json({ message: 'Torrent stopped' });
            } else {
                console.log("getMovieLoading Torrent not exist");
                return res.status(200).json({ message: 'Torrent don\'t exist' });
            }
        } catch (error) {
            console.error('Error getMovieLoading:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    getTorrentInfos = async (req, res) => {
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
                console.log("torrent", torrent);
                // torrentInfos.addTorrent(torrent.url);

                const encodedUrl = titleLong.replaceAll(" ", "%20");
                // const magnet = `magnet:?xt=urn:btih:${torrent.hash}`;
                const magnet = `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodedUrl}`;
                const a = parseTorrent(magnet);
                console.log("a", a);
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

    getMovieStreamOriginal = async (req, res) => {
        try {
            const magnet2 = "magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fbig-buck-bunny.torrent"
            const magnet3 = "magnet:?xt=urn:btih:c9e15763f722f23e98a29decdfae341b98d53056&dn=Cosmos+Laundromat&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fcosmos-laundromat.torrent"
            const magnet4 = "magnet:?xt=urn:btih:7B1996E90511DFBA36A51437A892C4AA06F0CC3A&amp;dn=Any%20Number%20Can%20Win%20(1963)&amp;tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&amp;tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337"
            const magnet5 = "magnet:?xt=urn:btih:7568465048279D0BDBD1BD9EE13C95C0A9662AE2&amp;dn=A%20Chinese%20Ghost%20Story%20II%20(1990)&amp;tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&amp;tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337"
            const magnet6 = "magnet:?xt=urn:btih:A0CE6D77D182B0F868E9169B871779E94DDF5E47&amp;dn=Say%20Goodnight%20to%20the%20Bad%20Guys%20(2008)&amp;tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&amp;tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337"
            const ytsId = req.params.id;
            const magnet = magnet6;
            var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
            const range = req.headers.range;
            const file = this.fileTab.find(it => it.fileName == (torrent.torrentName ? torrent.torrentName : ""));
            if (torrent && file && file.checkExist()) {
                console.log("torrent and file exist");
                this.sendRange(range, torrent, res);
            } else {
                console.log("Torrent or file not exist");
                if (!torrent) {
                    console.log("Torrent not exist");
                    const moveDetailsUrl = 'movie_details.json?movie_id=';
                    const ytsApiResponse = await axios.get(`${process.env.TORRENT_API}${moveDetailsUrl}${ytsId}`);
                    if (!ytsApiResponse || !ytsApiResponse.data || !ytsApiResponse.data.data || !ytsApiResponse.data.data.movie) {
                        return res.status(400).json({ error: 'Error with YTS API response' });
                    }
                    const ytsApiTorrents = ytsApiResponse.data.data.movie.torrents;
                    const torrentSelected = this.chooseTorrent(ytsApiTorrents);
                    if (torrentSelected == null) {
                        return res.status(400).json({ error: 'Error with YTS API torrent response' });
                    }
                    return;
                    torrent = new Torrent(magnet, ytsId);
                    this.torrentTab.push(torrent);
                }
                torrent.startDownload(
                    () => {

                    },
                    () => {
                        console.log('callbackTorrentReady');
                        const file = new MovieFile(torrent.torrentName, torrent.path, torrent.fileSize);
                        this.fileTab.push(file);
                        setTimeout(() => {
                            this.sendRange(range, torrent, res);
                        }, 5000);
                    },
                    () => {
                        console.log('callbackWriteStreamFinish');
                    }
                );
            }
        } catch (error) {
            console.error('Error getting movie:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };
}

module.exports = new MoviesController();

// sortTorrents(torrents, titleLong) {
//     if (torrents == null || torrents == undefined || torrents.length <= 0) {
//         return null;
//     }
//     let retTab = [];
//     let retTab2 = [];
//     console.log("titleLong", titleLong)
//     const encodedUrl = titleLong.replaceAll(" ", "%20");
//     for (let i = 0; i < torrents.length; i++) {
//         // console.log("torrents[i]", torrents[i])
//         const magnet = `magnet:?xt=urn:btih:${torrents[i].hash}&dn=${encodedUrl}`;
//         // const magnet = `magnet:?xt=urn:btih:0719223EC1C863C85454DAD4F297F2D35F22B15E&amp;dn=Kla%20Fun%20(2024)&amp;tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&amp;tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337`
//         if (torrents[i].quality != undefined && torrents[i].quality == "720p") {
//             retTab.push(
//                 {
//                     magnet: magnet,
//                     hash: torrents[i].hash,
//                     quality: torrents[i].quality,
//                     size_bytes: torrents[i].size_bytes,
//                     seeds: torrents[i].seeds
//                 });
//         }
//         else {
//             retTab2.push(
//                 {
//                     magnet: magnet,
//                     hash: torrents[i].hash,
//                     quality: torrents[i].quality,
//                     size_bytes: torrents[i].size_bytes,
//                     seeds: torrents[i].seeds
//                 });
//         }
//     }
//     retTab = retTab.concat(retTab2);
//     console.log("retTab 1 ", retTab)
//     retTab.sort((a, b) => {
//         return b.seeds - a.seeds
//     });
//     console.log("retTab 2 ", retTab)
//     return retTab;
// }