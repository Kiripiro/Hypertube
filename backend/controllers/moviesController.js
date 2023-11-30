const { Movies } = require('../models');
require('dotenv').config();
const axios = require('axios');

class MoviesController {
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
        };
    };
}

module.exports = new MoviesController();
