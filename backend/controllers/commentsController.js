const { Comments, Movies } = require("../models");
class CommentsController {
    // Add your controller methods here
    addComment = async (req, res) => {
        const { author_id, text, imdb_id, parent_id } = req.body;
        try {
            console.log(req.body);
            const comment = await Comments.create({ author_id, text, imdb_id, parent_id: parent_id || null });
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

}

module.exports = new CommentsController();
