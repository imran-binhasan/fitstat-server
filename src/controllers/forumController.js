const forumService = require('../services/forumService');
const { asyncHandler } = require('../middleware/errorHandler');

class ForumController {
  // Get all forum posts with pagination and filters
  getAllPosts = asyncHandler(async (req, res) => {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 6,
      category: req.query.category,
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      author: req.query.author
    };

    const result = await forumService.getAllPosts(options);

    res.status(200).json({
      success: true,
      message: 'Forum posts retrieved successfully',
      data: result
    });
  });

  // Get latest posts
  getLatestPosts = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 6;
    const posts = await forumService.getLatestPosts(limit);

    res.status(200).json({
      success: true,
      message: 'Latest posts retrieved successfully',
      data: posts
    });
  });

  // Get trending posts
  getTrendingPosts = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const posts = await forumService.getTrendingPosts(limit);

    res.status(200).json({
      success: true,
      message: 'Trending posts retrieved successfully',
      data: posts
    });
  });

  // Get post by ID
  getPostById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await forumService.getPostById(id);

    res.status(200).json({
      success: true,
      message: 'Forum post retrieved successfully',
      data: post
    });
  });

  // Create new post
  createPost = asyncHandler(async (req, res) => {
    const post = await forumService.createPost(req.body);

    res.status(201).json({
      success: true,
      message: 'Forum post created successfully',
      data: post
    });
  });

  // Update post
  updatePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await forumService.updatePost(id, req.body, req.user.email);

    res.status(200).json({
      success: true,
      message: 'Forum post updated successfully',
      data: post
    });
  });

  // Delete post
  deletePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await forumService.deletePost(id, req.user.email, req.user.role);

    res.status(200).json({
      success: true,
      message: 'Forum post deleted successfully'
    });
  });

  // Upvote post
  upvotePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await forumService.upvotePost(id);

    res.status(200).json({
      success: true,
      message: 'Post upvoted successfully',
      data: { voteCount: post.voteCount }
    });
  });

  // Downvote post
  downvotePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await forumService.downvotePost(id);

    res.status(200).json({
      success: true,
      message: 'Post downvoted successfully',
      data: { voteCount: post.voteCount }
    });
  });

  // Get posts by category
  getPostsByCategory = asyncHandler(async (req, res) => {
    const categories = await forumService.getPostsByCategory();

    res.status(200).json({
      success: true,
      message: 'Posts by category retrieved successfully',
      data: categories
    });
  });

  // Pin post (Admin only)
  pinPost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await forumService.pinPost(id, req.user.role);

    res.status(200).json({
      success: true,
      message: 'Post pinned successfully',
      data: post
    });
  });

  // Unpin post (Admin only)
  unpinPost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await forumService.unpinPost(id, req.user.role);

    res.status(200).json({
      success: true,
      message: 'Post unpinned successfully',
      data: post
    });
  });

  // Get forum statistics (Admin only)
  getForumStats = asyncHandler(async (req, res) => {
    const stats = await forumService.getForumStats();

    res.status(200).json({
      success: true,
      message: 'Forum statistics retrieved successfully',
      data: stats
    });
  });

  // Search posts
  searchPosts = asyncHandler(async (req, res) => {
    const { q: searchTerm } = req.query;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const result = await forumService.searchPosts(searchTerm, options);

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: result
    });
  });
}

module.exports = new ForumController();