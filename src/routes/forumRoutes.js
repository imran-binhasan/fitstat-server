const express = require('express');
const Joi = require('joi');
const forumController = require('../controllers/forumController');
const { verifyToken, authorize, optionalAuth } = require('../middleware/auth');
const { 
  validate, 
  validateObjectId, 
  schemas 
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', 
  validate(schemas.pagination.keys({
    category: Joi.string().optional(),
    search: Joi.string().optional(),
    sortBy: Joi.string().valid('createdAt', 'voteCount', 'viewCount').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
    author: Joi.string().email().optional()
  }), 'query'),
  forumController.getAllPosts
);

router.get('/latest', 
  validate(schemas.pagination.keys({
    limit: Joi.number().min(1).max(100).optional()
  }), 'query'),
  forumController.getLatestPosts
);

router.get('/trending', 
  validate(schemas.pagination.keys({
    limit: Joi.number().min(1).max(100).optional()
  }), 'query'),
  forumController.getTrendingPosts
);

router.get('/categories', forumController.getPostsByCategory);

router.get('/search', 
  validate(schemas.search.keys({
    q: Joi.string().required()
  }), 'query'),
  forumController.searchPosts
);

router.get('/:id', 
  validateObjectId(),
  optionalAuth, // Optional auth to track views
  forumController.getPostById
);

// Voting routes (no authentication required but can be rate-limited)
router.patch('/:id/upvote', 
  validateObjectId(),
  forumController.upvotePost
);

router.patch('/:id/downvote', 
  validateObjectId(),
  forumController.downvotePost
);

// Protected routes - require authentication
router.use(verifyToken);

// Create and manage posts
router.post('/', 
  validate(schemas.forumPost),
  forumController.createPost
);

router.patch('/:id', 
  validateObjectId(),
  validate(schemas.forumPost.fork(
    ['title', 'content', 'category'],
    (schema) => schema.optional()
  )),
  forumController.updatePost
);

router.delete('/:id', 
  validateObjectId(),
  forumController.deletePost
);

// Admin only routes
router.use(authorize('admin'));

router.patch('/:id/pin', 
  validateObjectId(),
  forumController.pinPost
);

router.patch('/:id/unpin', 
  validateObjectId(),
  forumController.unpinPost
);

router.get('/admin/stats', forumController.getForumStats);

module.exports = router;