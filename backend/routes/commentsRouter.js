const express = require('express');
const commentsRouter = express.Router();
const auth = require('../middlewares/auth/auth');
const CommentsController = require('../controllers/commentsController');
const commentsMiddleware = require('../middlewares/validation/commentsMiddleware');

commentsRouter.post('/addComment', auth, commentsMiddleware.validateAddComment, async (req, res) => {
    try {
        await CommentsController.addComment(req, res);
    } catch (error) {
        console.error(error);
    }
});

commentsRouter.get('/getComments/:imdb_id', auth, commentsMiddleware.validateGetComments, async (req, res) => {
    try {
        await CommentsController.getComments(req, res);
    } catch (error) {
        console.error(error);
    }
});

commentsRouter.put('/updateComment/', auth, commentsMiddleware.validateUpdateComment, async (req, res) => {
    try {
        await CommentsController.updateComment(req, res);
    } catch (error) {
        console.error(error);
    }
});

commentsRouter.delete('/deleteComment/:id', auth, commentsMiddleware.validateDeleteComment, async (req, res) => {
    try {
        await CommentsController.deleteComment(req, res);
    } catch (error) {
        console.error(error);
    }
});

module.exports = commentsRouter;