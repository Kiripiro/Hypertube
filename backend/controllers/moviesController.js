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
        const omdbApiUrl = 'http://www.omdbapi.com/';

        try {
            const omdbResponse = await axios.get(`${omdbApiUrl}?i=${imdb_id}&apikey=${process.env.OMDB_API_KEY}`);

            const omdbData = omdbResponse.data;
            if (omdbData.Poster === 'N/A' || omdbData.Poster === undefined) {
                return res.status(200).json({ movie: this._filteredMovieData(omdbData) });
            } else if (omdbData.Poster) {
                return res.status(200).json({ movie: this._filteredMovieData(omdbData) });
            } else {
                return res.status(200).json({ movie: this._filteredMovieData(omdbData) });
            }
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
}

module.exports = new MoviesController();
