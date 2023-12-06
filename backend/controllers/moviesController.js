const { Movies } = require('../models');
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
var torrentStream = require('torrent-stream');
const Torrent = require('./torrent');
const MovieFile = require('./movieFile');

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
            sort_by: req.query.sort_by || 'year',
            order_by: req.query.order_by || 'desc',
        };
        const torrentApiUrl = process.env.TORRENT_API + 'list_movies.json';
        const omdbApiUrl = 'http://www.omdbapi.com/';

        try {
            const { data } = await axios.get(torrentApiUrl, { params });
            const { movie_count, movies } = data.data;
            // const omdbResponse = await axios.get(`${omdbApiUrl}?i=${movie.imdb_code}&apikey=${process.env.OMDB_API_KEY}`);
            if (movie_count === 0) {
                return res.status(200).json({ movies: [], hasMore: false });
            }
            const hasMore = movie_count > params.limit * params.page;

            if (movies) {
                const filteredMovies = await Promise.all(
                    movies.map(async (movie) => {
                        try {
                            const omdbResponse = await axios.get(`${omdbApiUrl}?i=${movie.imdb_code}&apikey=${process.env.OMDB_API_KEY}`);
                            const omdbData = omdbResponse.data;

                            if (omdbData.Poster === 'N/A' || omdbData.Poster === undefined) {
                                if (movie.medium_cover_image && (await this.isImageAvailable(movie.medium_cover_image))) {
                                    movie.thumbnail = movie.medium_cover_image;
                                } else {
                                    return null;
                                }
                            } else if (omdbData.Poster) {
                                movie.thumbnail = omdbData.Poster;
                            } else {
                                return null;
                            }
                            return this._filteredMovieData(movie, omdbData);
                        } catch (error) {
                            console.log(error);
                            console.error(`Error fetching OMDB data for movie with imdb_code ${movie.imdb_code}: ${error.message}`);
                            return null;
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

    isImageAvailable = async (imageUrl) => {
        try {
            const response = await axios.head(imageUrl);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    };

    _filteredMovieData = (movie, omdbData) => {
        return {
            title: movie.title || omdbData.Title,
            genre: movie.genres || omdbData.Genre,
            poster_path: movie.thumbnail || omdbData.Poster,
            imdb_id: movie.imdb_code || omdbData.imdbID,
            imdb_rating: movie.rating || omdbData.imdbRating,
            plot: omdbData.Plot || movie.description,
            director: omdbData.Director,
            writer: omdbData.Writer,
            actors: omdbData.Actors,
            language: movie.language || omdbData.Language,
            awards: movie.awards || omdbData.Awards,
            release_date: movie.year || omdbData.Year,
            yts_id: movie.id
        };
    };

    sendRange(range, torrent, res) {
        if (!torrent.checkCanStream()) {
            console.log("can't stream !")
            setTimeout(() => {
                this.sendRange(range, torrent, res);
            }, 5000);
        } else {
            const file = this.fileTab.find(it => it.fileName == torrent.torrentName);
            console.log("file", file);
            if (!file) {
                console.log("error file not found")
                return ;
            }
            const filePath = file.filePath;
            console.log("path", filePath)
            const stat = fs.statSync(filePath)
            const fileSize = stat.size
            console.log("fileSize", fileSize)
            const expectedFileSize = file.expectedFileSize;
            console.log("expectedFileSize", expectedFileSize)
            
            if (range) {
                console.log("range yes")
                console.log(range)
                const parts = range.replace(/bytes=/, "").split("-")
                const chunkSizeToSend = 100000;
                var start = parseInt(parts[0], 10)

                if (start > fileSize) {
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
                    console.log("head", head)
                    res.writeHead(206, head)
                    readStream.pipe(res)

                    // const availableRange = `bytes */${expectedFileSize}`;
                    // res.writeHead(206, {
                    //     'Content-Range': availableRange,
                    //     'Accept-Ranges': 'bytes',
                    //     'Content-Length': 0,
                    //     'Content-Type': 'video/mp4',
                    // });
                    // res.end();
                } else {

                    var end = parts[1] ? parseInt(parts[1], 10) : start + chunkSizeToSend;
                    if (end > fileSize) {
                        end = fileSize - 1;
                    }
                    console.log("start", start)
                    console.log("end", end)
                    if (start > end) {
                        console.log("AIE")
                        start = end - 1;
                    }
                    this.lastByteSent = end;
                    const chunksize = ((end - start) > 0 ? (end - start) : -1) + 1
                    console.log("chunksize", chunksize)
                    
                    const readStream = fs.createReadStream(filePath, { start, end })

                    const head = {
                        'Content-Range': `bytes ${start}-${end}/${expectedFileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunksize,
                        'Content-Type': 'video/mp4',
                    }
                    console.log("head", head)
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
            // const magnet2 = "magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fbig-buck-bunny.torrent"
            // const magnet3 = "magnet:?xt=urn:btih:c9e15763f722f23e98a29decdfae341b98d53056&dn=Cosmos+Laundromat&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fcosmos-laundromat.torrent"
            // const magnet4 = "magnet:?xt=urn:btih:7B1996E90511DFBA36A51437A892C4AA06F0CC3A&amp;dn=Any%20Number%20Can%20Win%20(1963)&amp;tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&amp;tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337"
            // const magnet5 = "magnet:?xt=urn:btih:7568465048279D0BDBD1BD9EE13C95C0A9662AE2&amp;dn=A%20Chinese%20Ghost%20Story%20II%20(1990)&amp;tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&amp;tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337"
            // const magnet6 = "magnet:?xt=urn:btih:A0CE6D77D182B0F868E9169B871779E94DDF5E47&amp;dn=Say%20Goodnight%20to%20the%20Bad%20Guys%20(2008)&amp;tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&amp;tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337"
            // const ytsId = req.params.id;
            const ytsId = req.params.id;
            // const magnet = magnet6;
            var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
            const range = req.headers.range;
            const file = this.fileTab.find(it => it.fileName == (torrent.torrentName ? torrent.torrentName : ""));
            if (torrent && file && file.checkExist()) {
                console.log("torrent and file exist");
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

    sortTorrents(torrents, slug) {
        if (torrents == null || torrents == undefined || torrents.length <= 0) {
            return null;
        }
        let retTab = [];
        let retTab2 = [];
        const encodedUrl = slug.replaceAll("-", "%20");
        for (let i = 0; i < torrents.length; i++) {
            if (torrents[i].quality != undefined && torrents[i].quality == "720p") {
                const magnet = `magnet:?xt=urn:btih:${torrents[i].hash}&dn=${encodedUrl}`;
                retTab.push(
                {
                    magnet: magnet,
                    hash: torrents[i].hash,
                    quality: torrents[i].quality,
                    size_bytes: torrents[i].size_bytes
                });
            }
            else {
                const magnet = `magnet:?xt=urn:btih:${torrents[i].hash}&dn=${encodedUrl}`;
                retTab2.push(
                {
                    magnet: magnet,
                    hash: torrents[i].hash,
                    quality: torrents[i].quality,
                    size_bytes: torrents[i].size_bytes
                });
            }
        }
        return retTab.concat(retTab2);
    }

    getMovieLoading = async (req, res) => {
        try {
            const ytsId = req.params.id;
            var torrent = this.torrentTab.find(it => it.ytsId == ytsId);
            const file = this.fileTab.find(it => it.fileName == (torrent ? (torrent.torrentName ? torrent.torrentName : "") : ""));
            if (torrent && file && file.checkExist()) {
                console.log("getMovieLoading torrent and file exist");
                const size = torrent.size;
                const percentageDownloaded = torrent.percentageDownloaded;
                console.log("getMovieLoading size", size);
                console.log("getMovieLoading percentageDownloaded", percentageDownloaded);
                return res.status(200).json({ data: { size: size, percentage: percentageDownloaded} });
            } else {
                console.log("getMovieLoading Torrent or file not exist");
                if (!torrent) {
                    console.log("getMovieLoading Torrent not exist");
                    const moveDetailsUrl = 'movie_details.json?movie_id=';
                    const ytsApiResponse = await axios.get(`${process.env.TORRENT_API}${moveDetailsUrl}${ytsId}`);
                    if (!ytsApiResponse || !ytsApiResponse.data || !ytsApiResponse.data.data || !ytsApiResponse.data.data.movie) {
                        return res.status(400).json({ error: 'Error with YTS API response' });
                    }
                    const ytsApiTorrents = ytsApiResponse.data.data.movie.torrents;
                    const slug = ytsApiResponse.data.data.movie.slug;
                    console.log("ytsApiResponse.data.data.movie", ytsApiResponse.data.data.movie)
                    const sortedTorrents = this.sortTorrents(ytsApiTorrents, slug);
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
                            const file = new MovieFile(torrent.torrentName, torrent.path, torrent.fileSize);
                            this.fileTab.push(file);
                        },
                        () => {
                            console.log('callbackWriteStreamFinish');
                        }
                    );
                }
                const size = torrent.getDownloadedSize();
                const percentageDownloaded = torrent.percentageDownloaded;
                return res.status(200).json({ data: { size: size, percentage: percentageDownloaded} });
            }
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
            // const ytsId = req.params.id;
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
