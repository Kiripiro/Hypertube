const express = require('express');
const commentsRouter = express.Router();
const auth = require('../middlewares/auth');
const CommentsController = require('../controllers/commentsController');

commentsRouter.post('/addComment', auth, async (req, res) => {
    try {
        await CommentsController.addComment(req, res);
    } catch (error) {
        console.error(error);
    }
});

commentsRouter.get('/getComments/:imdb_id', auth, async (req, res) => {
    try {
        await CommentsController.getComments(req, res);
    } catch (error) {
        console.error(error);
    }
});

commentsRouter.put('/updateComment/', auth, async (req, res) => {
    try {
        await CommentsController.updateComment(req, res);
    } catch (error) {
        console.error(error);
    }
});

module.exports = commentsRouter;