const { Comments, Movies, User } = require("../models");
class CommentsController {
    // Add your controller methods here
    addComment = async (req, res) => {
        const { author_id, text, imdb_id, parent_id } = req.body;
        try {
            // console.log(req.body);
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
            console.log(error);
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
        console.log(req.body, comment);
        try {
            const commentExists = await Comments.findOne({ where: { id: comment.id, author_id: req.user.userId } });
            if (!commentExists) {
                return res.status(400).json({ error: "Comment not found" });
            }
            const updatedComment = await Comments.update({ text: comment.text, updated_at: new Date() }, { where: { id: comment.id } });
            console.log(updatedComment);
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
        console.log(req.params);
        console.log(req.user);
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
}

module.exports = new CommentsController();
