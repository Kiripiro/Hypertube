const { MoviesHistory } = require('../models');
require('dotenv').config();
const axios = require('axios');

const NodeCloudflareBypasser = require('../helpers/NodeCloudflareBypasser');

let cf = new NodeCloudflareBypasser();

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
        const omdbApiUrl = 'http://www.omdbapi.com/';

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
            const responseBody = JSON.parse(response.body);
            const { movie_count, movies } = responseBody.data;
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
                                yts_id: movie.id,
                                seen: await this._isMovieSeen(userId, movie.imdb_code),
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
                                filteredMovieData.seen = await this._isMovieSeen(userId, movie.imdb_code);
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
        const omdbApiUrl = 'http://www.omdbapi.com/';
        try {
            const omdbResponse = await axios.get(`${omdbApiUrl}?i=${imdb_id}&apikey=${process.env.OMDB_API_KEY}`);
            console.log("omdbResponse", omdbResponse);
            const omdbData = omdbResponse.data;
            return res.status(200).json({ movie: this._filteredMovieData(omdbData) });
        } catch (error) {
            console.log("error", error);
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
            poster: omdbData.Poster
        };
    };

    addMovieHistory = async (req, res) => {
        try {
            const userId = req.user.userId;
            const { imdbId, title } = req.body;
            const seen = await MoviesHistory.findOne({
                where: {
                    userId,
                    imdbId,
                    title
                }
            });
            if (seen) {
                return res.status(200).json({ seen });
            } else {
                const movieHistory = await MoviesHistory.create({
                    userId,
                    imdbId,
                    title
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

    // getTestMovies = async (req, res) => { // FOR TESTS, TO DELETE
    //     try {
    //         const url = "https://www.opensubtitles.com/download/EA95FB8C292FB904BE59DEB90A12FD29EDC0830EB015AF2A09BEECB876D87F2B4D1C3BAEF0F0D643FF8A8A5CC4CF65231BD872807AD0BF41790B0EDF01191FFE18FC923B1A7624B1BE6AC7F5F6CEACDF8E996523A3D40DDE17C6AE570995CDCF88460E8EF3122EA3ED7936BE946368B15B91DF3643C2D0E0CFB4E1DB6A93B16561C5D1917448DDFDAC2FD06E1CE9FB77B2D6CCE81D0F6ECDF5376559F442CE18CC87E90F41B45968D20582CC97EC3EA11A36760846E3ADEDDFD5EC9229B3D690DF4BCC86D297F14AFD7762983C29FF9DCD089CB4D4498B65F40CB56ADEF1FC91B757CAAC608C349D30B32F32F98D0ACA4C064749201EDA65910D8601565FAA2CECE54D483A8E2CAA4D7F36D3272F1C08A18D0D25331A409B3E32C8510F14B1FDC7373436B7D1468C6F5C65AA726050EC/subfile/Dark.World.2021.THAI.WEBRip.x264-RARBG.srt"
    //         const path = '/app/download/test.srt'

    //         SubtitlesHelper.getSubtitles('tt1981115', 'en');
            
    //         return res.status(200).json({});
    //     } catch (error) {
    //         console.error('Error getTestMovies:', error);
    //         return res.status(500).json({ message: 'Internal Server Error' });
    //     }
    // };
}

module.exports = new MoviesController();
