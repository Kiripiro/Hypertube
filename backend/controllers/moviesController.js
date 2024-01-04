const { Comments, MoviesHistory } = require('../models');
require('dotenv').config();
const axios = require('axios');
const FreeTorrentScrapper = require('../helpers/freeTorrentScrapper.helper');
const SubtitlesHelper = require('../helpers/subtitles.helper');

const NodeCloudflareBypasser = require('../helpers/NodeCloudflareBypasser');

let cf = new NodeCloudflareBypasser();

const languagesForSubtitles = [
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

class MoviesController {

    torrentTab = [];
    fileTab = [];
    lastByteSent = 0;

    fetchYTSMovies = async (req, res) => {
        const userId = req.user.userId;
        const params = {
            limit: req.query.limit || 20,
            page: req.query.page || 1,
            query_term: req.query.query_term || '0',
            genre: req.query.genre || 'all',
            sort_by: req.query.sort_by || 'download_count',
            order_by: req.query.order_by || 'desc',
            quality: req.query.quality || 'all',
            minimum_rating: req.query.minimum_rating || '0',
        };
        const torrentApiUrl = process.env.TORRENT_API + 'list_movies.json';

        try {
            const response = await cf.request({
                url: torrentApiUrl,
                qs: {
                    limit: params.limit,
                    page: params.page,
                    query_term: params.query_term,
                    genre: params.genre,
                    sort_by: params.sort_by,
                    order_by: params.order_by,
                    quality: params.quality,
                    minimum_rating: params.minimum_rating
                }
            });
            const freeTorrentMoviesBrut = await FreeTorrentScrapper.init();
            let freeTorrentMovies = [];
            if (freeTorrentMoviesBrut && freeTorrentMoviesBrut.length > 0) {
                for (let i = 0; i < freeTorrentMoviesBrut.length; i++) {
                    let movie = freeTorrentMoviesBrut[i];
                    const movieRet = await this._omdbMovieData(userId, movie.imdbId, null, null);
                    if (movieRet != null) {
                        if (this._checkQueryMatchForMovie(params, movieRet)) {
                            console.log(movieRet);
                            freeTorrentMovies.push(movieRet);
                        }
                    }
                }
            }
            const responseBody = JSON.parse(response.body);
            const { movie_count, movies } = responseBody.data;
            if (movie_count === 0 && freeTorrentMovies.length === 0) {
                return res.status(200).json({ movies: [], hasMore: false });
            }
            const hasMore = movie_count > params.limit * params.page;
            
            var ytsMovies = [];
            if (movies) {
                ytsMovies = await Promise.all(
                    movies.map(async (movie) => {
                        if (movie.year === 0)
                            return null;
                        if (movie.medium_cover_image && (await this._isImageAvailable(movie.medium_cover_image))) {
                            let data = {
                                title: movie.title,
                                poster_path: movie.medium_cover_image,
                                genre: movie.genres,
                                imdb_id: movie.imdb_code,
                                imdb_rating: movie.rating,
                                plot: movie.synopsis,
                                language: movie.language,
                                release_date: movie.year,
                                yts_id: movie.id,
                                seen: await this._isMovieSeen(userId, movie.imdb_code),
                            }
                            return data;
                        } else {
                            return await this._omdbMovieData(userId, movie.imdb_code, movie.thumbnail, movie.id);
                        }
                    }),
                );      
            }
            const filteredMovies = freeTorrentMovies.concat(ytsMovies);
            const validMovies = filteredMovies.filter(movie => movie !== null);
            return res.status(200).json({ movies: validMovies, hasMore });
        } catch (e) {
            console.error(e);
            return { movies: [], hasMore: false };
        }
    };

    
    _checkQueryMatchForMovie = (params, movie) => {
        if (params.query_term !== '0') {
            const lowercaseMovieTitle = movie.title.toLowerCase();
            const lowercaseQueryTerm = params.query_term.toLowerCase();
    
            return lowercaseMovieTitle.includes(lowercaseQueryTerm);
        }
        return true;
    };
    
    
    async _omdbMovieData(userId, imdb_code, thumbnail, ytsId) {
        try {
            const omdbApiUrl = 'http://www.omdbapi.com/';
            const omdbResponse = await axios.get(`${omdbApiUrl}?i=${imdb_code}&apikey=${process.env.OMDB_API_KEY}`);
            const omdbData = omdbResponse.data;

            if (omdbData.Poster === 'N/A' || omdbData.Poster === undefined) {
                return null;
            } else if (omdbData.Poster) {
                thumbnail = omdbData.Poster;
            } else {
                return null;
            }

            const filteredMovieData = this._filteredMovieData(omdbData);
            filteredMovieData.poster_path = (thumbnail !== null) ? thumbnail : filteredMovieData.poster_path;
            filteredMovieData.seen = await this._isMovieSeen(userId, imdb_code);
            if (ytsId) {
                filteredMovieData.yts_id = ytsId;
            } else {
                filteredMovieData.free_movie_id = imdb_code;
            }
            return filteredMovieData;
        } catch (error) {
            console.error(`Error fetching OMDB data for movie with imdb_code ${imdb_code}: ${error.message}`);
            return null;
        }
    }

    fetchMovieDetails = async (req, res) => {
        const { imdb_id } = req.params;
        const omdbApiUrl = 'http://www.omdbapi.com/';
        try {
            const omdbResponse = await axios.get(`${omdbApiUrl}?i=${imdb_id}&apikey=${process.env.OMDB_API_KEY}`);
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
            poster: omdbData.Poster,
            runtime: omdbData.Runtime
        };
    };

    addMovieHistory = async (req, res) => {
        try {
            const userId = req.user.userId;
            const { imdbId, title, timestamp } = req.body;
            const seen = await MoviesHistory.findOne({
                where: {
                    userId,
                    imdbId,
                    title,
                }
            });
            if (seen) {
                //update the updatedAt field and timestamp if it's > than the previous one
                if (seen.timestamp < timestamp) {
                    seen.timestamp = timestamp;
                    await seen.save();
                }
            } else {
                const movieHistory = await MoviesHistory.create({
                    userId,
                    imdbId,
                    title,
                    timestamp
                });
                return res.status(200).json({ movieHistory });
            }

        } catch (error) {
            console.error('Error adding movie history:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    getMovieHistory = async (req, res) => {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            let condition = id ? id : userId;
            const movieHistory = await MoviesHistory.findAll({
                where: {
                    userId: condition
                }
            });
            return res.status(200).json({ movieHistory });
        } catch (error) {
            console.error('Error getting movie history:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    _isMovieSeen = async (userId, imdbId) => {
        const movieHistory = await MoviesHistory.findOne({
            where: {
                userId,
                imdbId
            }
        });
        return movieHistory !== null;
    };

    getTestMovies = async (req, res) => { // FOR TESTS, TO DELETE
        try {
            FreeTorrentScrapper.getTorrentById(942);
            return res.status(200).json({});
        } catch (error) {
            console.error('Error getTestMovies:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    apiGetMovies = async (req, res) => {
        const torrentApiUrl = process.env.TORRENT_API + 'list_movies.json';
        try {
            const params = {
                limit: 20,
                page: 1,
                query_term: '0',
                genre: 'all',
                sort_by: 'download_count',
                order_by: 'desc',
                quality: 'all',
                minimum_rating: '0',
            };
            const response = await cf.request({
                qs: {
                    limit: params.limit,
                    page: params.page,
                    query_term: params.query_term,
                    genre: params.genre,
                    sort_by: params.sort_by,
                    order_by: params.order_by,
                    quality: params.quality,
                    minimum_rating: params.minimum_rating
                },
                url: torrentApiUrl
            });
            const responseBody = JSON.parse(response.body);
            const { movies } = responseBody.data;
            const freeTorrentMoviesBrut = await FreeTorrentScrapper.init();
            let freeTorrentMovies = [];
            if (freeTorrentMoviesBrut && freeTorrentMoviesBrut.length > 0) {
                for (const freeMovie of freeTorrentMoviesBrut) {
                    const omdbApiUrl = 'http://www.omdbapi.com/';
                    const omdbResponse = await axios.get(`${omdbApiUrl}?i=${freeMovie.imdbId}&apikey=${process.env.OMDB_API_KEY}`);
                    const omdbData = omdbResponse.data;
                    freeTorrentMovies.push({
                        imdb_id: freeMovie.imdbId,
                        title: omdbData.Title,
                    });
                }
            }
            var ytsMovies = [];
            if (movies) {
                ytsMovies = await Promise.all(
                    movies.map(async (movie) => {
                        let data = {
                            imdb_id: movie.imdb_code,
                            title: movie.title
                        }
                        return data;
                    }),
                );
            }
            const filteredMovies = freeTorrentMovies.concat(ytsMovies);
            const validMovies = filteredMovies.filter(movie => movie !== null);
            return res.status(200).json({ movies: validMovies });
        } catch (e) {
            console.error(e);
            return { movies: [] };
        }
    };

    apiGetMovieById = async (req, res) => {
        try {
            const omdbApiUrl = 'http://www.omdbapi.com/';
            const id = req.params.id;
            const omdbResponse = await axios.get(`${omdbApiUrl}?i=${id}&apikey=${process.env.OMDB_API_KEY}`);
            if (omdbResponse.data.Response === "False" || omdbResponse.data.Response === false || omdbResponse.data.error) {
                return res.status(400).json({ error: "Movie not found" });
            }
            const omdbData = omdbResponse.data;
            let subtitles = "";
            for (const lang of languagesForSubtitles) {
                const fileId = await SubtitlesHelper.getSubtitlesFileId(omdbData.imdbID, lang);
                if (fileId > 0) {
                    if (subtitles.length == 0) {
                        subtitles = subtitles + lang;
                    } else {
                        subtitles = subtitles + "-" + lang;
                    }
                }
            }
            const comments = await Comments.findAll({
                where: { imdb_id: omdbData.imdbID },
                include: [
                    {
                        model: Comments,
                        as: "children",
                        include: [
                            {
                                model: Comments,
                                as: "children",
                            },
                        ],
                    },
                ],
            });
            const commentsCount = comments ? comments.length : 0;
            const movieData = {
                title: omdbData.Title,
                id: omdbData.imdbID,
                imdb_rating: omdbData.imdbRating,
                production_year: omdbData.Year,
                length: omdbData.Runtime,
                available_subtitles: subtitles,
                comments_count: commentsCount,
            }
            return res.status(200).json({ movie: movieData });
        } catch (e) {
            console.error(e);
            return { movies: [] };
        }
    };
}

module.exports = new MoviesController();
