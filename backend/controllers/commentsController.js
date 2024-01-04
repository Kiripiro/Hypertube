const { Comments, User } = require("../models");
const axios = require('axios');

class CommentsController {
    addComment = async (req, res) => {
        const { author_id, text, imdb_id, parent_id } = req.body;
        try {
            const user = await User.findOne({ where: { id: author_id } });
            if (!user) {
                return res.status(400).json({ error: "User not found" });
            }
            let username = user.dataValues.username;
            const comment = await Comments.create({ author_id, author_username: username, text, imdb_id, parent_id: parent_id || null });
            if (!comment) {
                return res.status(400).json({ error: "Comment could not be added" });
            }
            return res.status(200).json({ message: "Comment added", comment });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    getComments = async (req, res) => {
        const { imdb_id } = req.params;
        try {
            const comments = await Comments.findAll({
                where: { imdb_id },
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
            return res.status(200).json({ comments: comments });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    updateComment = async (req, res) => {
        const { comment } = req.body;
        try {
            const commentExists = await Comments.findOne({ where: { id: comment.id, author_id: req.user.userId } });
            if (!commentExists) {
                return res.status(400).json({ error: "Comment not found" });
            }
            const updatedComment = await Comments.update({ text: comment.text, updated_at: new Date() }, { where: { id: comment.id } });
            if (!updatedComment) {
                return res.status(400).json({ error: "Comment could not be updated" });
            }
            return res.status(200).json({ message: "Comment updated", comment: comment });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    deleteComment = async (req, res) => {
        const { id } = req.params;
        try {
            const commentExists = await Comments.findOne({ where: { id: id, author_id: req.user.userId } });
            const commentId = commentExists.dataValues.id;
            if (!commentExists) {
                return res.status(400).json({ error: "Comment not found" });
            }
            const deletedComment = await Comments.destroy({ where: { id: id } });
            if (!deletedComment) {
                return res.status(400).json({ error: "Comment could not be deleted" });
            }
            return res.status(200).json({ message: "Comment deleted", comment: commentId });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    apiGetLatestComments = async (req, res) => {
        try {
            const comments = await Comments.findAll({
                limit: 10,
                order: [['createdAt', 'DESC']],
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
            let commentTab = [];
            for (const comment of comments) {
                const commentData = {
                    id: comment.dataValues.id,
                    author_username: comment.dataValues.author_username,
                    text: comment.dataValues.text,
                    imdb_id: comment.dataValues.imdb_id,
                    createdAt: comment.dataValues.createdAt,
                    updatedAt: comment.dataValues.updatedAt
                };
                commentTab.push(commentData);
            }
            return res.status(200).json({ comments: commentTab });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    apiGetCommentById = async (req, res) => {
        try {
            const id = req.params.id;
            const comment = await Comments.findOne({ where: { id: id } });
            if (!comment) {
                return res.status(400).json({ error: "Comment not found" });
            }
            const commentData = {
                id: comment.dataValues.id,
                author_username: comment.dataValues.author_username,
                text: comment.dataValues.text,
                imdb_id: comment.dataValues.imdb_id,
                createdAt: comment.dataValues.createdAt,
                updatedAt: comment.dataValues.updatedAt
            };
            return res.status(200).json({ comment: commentData });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    apiPatchCommentById = async (req, res) => {
        try {
            const id = req.params.id;
            const { comment, username } = req.body;
            const commentCheck = await Comments.findOne({ where: { id: id } });
            if (!commentCheck) {
                return res.status(404).json({ message: 'Comment not found' });
            }
            const user = await User.findOne({ where: { username: username } });
            if (!user) {
                return res.status(404).json({ message: 'Username doesn\'t exist' });
            }
            const updatedComment = await Comments.update({ author_username: username, text: comment }, { where: { id: id } });
            return res.status(200).json({message: 'Comment has been updated'});
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    apiDeleteCommentById = async (req, res) => {
        try {
            const id = req.params.id;
            const commentCheck = await Comments.findOne({ where: { id: id } });
            if (!commentCheck) {
                return res.status(404).json({ message: 'Comment not found' });
            }
            const deletedComment = await Comments.destroy({ where: { id: id } });
            if (!deletedComment) {
                return res.status(400).json({ error: "Comment could not be deleted" });
            }
            return res.status(200).json({message: 'Comment has been deleted'});
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    apiPostComment = async (req, res) => {
        try {
            const { comment, movie_id } = req.body;
            const userId = req.user.userId
            const user = await User.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(400).json({ error: "User not found" });
            }
            const omdbApiUrl = 'http://www.omdbapi.com/';
            const omdbResponse = await axios.get(`${omdbApiUrl}?i=${movie_id}&apikey=${process.env.OMDB_API_KEY}`);
            if (omdbResponse.data.Response === "False" || omdbResponse.data.Response === false || omdbResponse.data.error) {
                return res.status(400).json({ error: "Movie not found" });
            }
            const commentCreated = await Comments.create({
                author_id: user.id,
                author_username: user.username,
                text: comment,
                imdb_id: movie_id,
                parent_id: null
            });
            if (!comment) {
                return res.status(400).json({ error: "Comment could not be added" });
            }
            return res.status(200).json({message: 'Comment has been created'});
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    apiPostCommentByMoviesRoute = async (req, res) => {
        try {
            const comment = req.body.comment;
            const movie_id = req.params.movie_id;
            const userId = req.user.userId
            const user = await User.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(400).json({ error: "User not found" });
            }
            const omdbApiUrl = 'http://www.omdbapi.com/';
            const omdbResponse = await axios.get(`${omdbApiUrl}?i=${movie_id}&apikey=${process.env.OMDB_API_KEY}`);
            if (omdbResponse.data.Response === "False" || omdbResponse.data.Response === false || omdbResponse.data.error) {
                return res.status(400).json({ error: "Movie not found" });
            }
            const commentCreated = await Comments.create({
                author_id: user.id,
                author_username: user.username,
                text: comment,
                imdb_id: movie_id,
                parent_id: null
            });
            if (!comment) {
                return res.status(400).json({ error: "Comment could not be added" });
            }
            return res.status(200).json({message: 'Comment has been created'});
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new CommentsController();
