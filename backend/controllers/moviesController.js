const { Movies } = require('../models');
require('dotenv').config();
const axios = require('axios');

class MoviesController {
    fetchYTSMovies = async (req, res) => {
        let movies = [];
        let hasMore = true;
        const params = {
            limit: req.query.limit || 40,
            page: req.query.page || 1,
            query_term: req.query.query_term || '0',
            genre: req.query.genre || 'all',
            sort_by: req.query.sort_by || 'year',
            order_by: req.query.order_by || 'desc',
        };

        try {
            let res = await axios.get(process.env.TORRENT_API + 'list_movies.json');
            const moviesData = res.data.data;
            const movieList = res.data.data.movies;

            if (moviesData.movie_count === 0) {
                throw notFoundError();
            }
            if (moviesData.movie_count <= params.limit * params.page) {
                hasMore = false;
            }
            if (movieList) {
                await Promise.all(
                    movieList.map(async (movie) => {
                        res = await axios.get(`http://www.omdbapi.com/?i=${movie.imdb_code}&apikey=${process.env.OMDB_API_KEY}`);
                        movie.thumbnail = res.data.Poster;
                    }),
                );
                movies = movieList.map((movie) => this._filteredMovieData(movie));
            }
        } catch (e) {
            console.error(e);
            return { movies: [], hasMore: false };
        }
        console.log(movies, hasMore);
        return res.status(200).json({ movies, hasMore });
    };

    _filteredMovieData = (movie) => {
        return {
            title: movie.title,
            genre: movie.genres,
            poster_path: movie.thumbnail,
            imbd_id: movie.imdb_code,
            imbd_rating: movie.rating,
            plot: movie.description_full,
            director: movie.director,
            writer: movie.writer,
            actors: movie.actors,
            language: movie.language,
            awards: movie.awards,
            release_date: movie.year,
            seeds: movie.torrents.reduce((acc, torrent) => acc + torrent.seeds, 0),
        };
    };
}

module.exports = new MoviesController();