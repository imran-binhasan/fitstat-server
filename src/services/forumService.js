const { Forum } = require('../models');
const { 
  notFoundError, 
  validationError, 
  conflictError 
} = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class ForumService {
  async createPost(postData) {
    try {
      const newPost = new Forum({
        ...postData,
        voteCount: 0,
        viewCount: 0
      });
      
      await newPost.save();
      
      logger.info('New forum post created:', { 
        postId: newPost._id, 
        title: newPost.title,
        author: newPost.author.email
      });

      return newPost;
    } catch (error) {
      logger.error('Error creating forum post:', error);
      throw error;
    }
  }

  async getAllPosts(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 6,
        category,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        author
      } = options;

      const skip = (page - 1) * limit;
      const query = { isActive: true };

      // Filter by category
      if (category) {
        query.category = { $regex: new RegExp(category, 'i') };
      }

      // Filter by author
      if (author) {
        query['author.email'] = author;
      }

      // Search functionality
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Prioritize pinned posts
      const posts = await Forum.find(query)
        .sort({ isPinned: -1, ...sortOptions })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Forum.countDocuments(query);

      return {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching forum posts:', error);
      throw error;
    }
  }

  async getPostById(postId) {
    try {
      const post = await Forum.findById(postId);
      if (!post) {
        throw notFoundError('Forum post');
      }

      // Increment view count
      await Forum.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } });
      post.viewCount += 1;

      return post;
    } catch (error) {
      logger.error('Error fetching forum post by ID:', error);
      throw error;
    }
  }

  async updatePost(postId, updateData, userEmail) {
    try {
      const post = await Forum.findById(postId);
      if (!post) {
        throw notFoundError('Forum post');
      }

      // Check if user is the author or admin
      if (post.author.email !== userEmail) {
        throw validationError('You can only edit your own posts');
      }

      const updatedPost = await Forum.findByIdAndUpdate(
        postId, 
        updateData, 
        { 
          new: true, 
          runValidators: true 
        }
      );

      logger.info('Forum post updated:', { 
        postId, 
        author: userEmail,
        updatedFields: Object.keys(updateData) 
      });

      return updatedPost;
    } catch (error) {
      logger.error('Error updating forum post:', error);
      throw error;
    }
  }

  async deletePost(postId, userEmail, userRole) {
    try {
      const post = await Forum.findById(postId);
      if (!post) {
        throw notFoundError('Forum post');
      }

      // Check if user is the author or admin
      if (post.author.email !== userEmail && userRole !== 'admin') {
        throw validationError('You can only delete your own posts');
      }

      await Forum.findByIdAndUpdate(postId, { isActive: false });

      logger.info('Forum post deleted:', { 
        postId, 
        deletedBy: userEmail,
        originalAuthor: post.author.email
      });

      return { message: 'Post deleted successfully' };
    } catch (error) {
      logger.error('Error deleting forum post:', error);
      throw error;
    }
  }

  async upvotePost(postId) {
    try {
      const updatedPost = await Forum.findByIdAndUpdate(
        postId,
        { $inc: { voteCount: 1 } },
        { new: true }
      );

      if (!updatedPost) {
        throw notFoundError('Forum post');
      }

      logger.info('Post upvoted:', { postId, newVoteCount: updatedPost.voteCount });
      return updatedPost;
    } catch (error) {
      logger.error('Error upvoting post:', error);
      throw error;
    }
  }

  async downvotePost(postId) {
    try {
      const updatedPost = await Forum.findByIdAndUpdate(
        postId,
        { $inc: { voteCount: -1 } },
        { new: true }
      );

      if (!updatedPost) {
        throw notFoundError('Forum post');
      }

      logger.info('Post downvoted:', { postId, newVoteCount: updatedPost.voteCount });
      return updatedPost;
    } catch (error) {
      logger.error('Error downvoting post:', error);
      throw error;
    }
  }

  async getLatestPosts(limit = 6) {
    try {
      const posts = await Forum.find({ isActive: true })
        .sort({ voteCount: -1, createdAt: -1 })
        .limit(limit);

      return posts;
    } catch (error) {
      logger.error('Error fetching latest posts:', error);
      throw error;
    }
  }

  async getTrendingPosts(limit = 10) {
    try {
      // Get posts from last 7 days, sorted by vote count and view count
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const posts = await Forum.find({ 
        isActive: true,
        createdAt: { $gte: sevenDaysAgo }
      })
        .sort({ voteCount: -1, viewCount: -1 })
        .limit(limit);

      return posts;
    } catch (error) {
      logger.error('Error fetching trending posts:', error);
      throw error;
    }
  }

  async getPostsByCategory() {
    try {
      const categories = await Forum.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalVotes: { $sum: '$voteCount' },
            totalViews: { $sum: '$viewCount' },
            recentPosts: {
              $push: {
                _id: '$_id',
                title: '$title',
                author: '$author.name',
                voteCount: '$voteCount',
                createdAt: '$createdAt'
              }
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return categories;
    } catch (error) {
      logger.error('Error fetching posts by category:', error);
      throw error;
    }
  }

  async pinPost(postId, userRole) {
    try {
      if (userRole !== 'admin') {
        throw validationError('Only administrators can pin posts');
      }

      const updatedPost = await Forum.findByIdAndUpdate(
        postId,
        { isPinned: true },
        { new: true }
      );

      if (!updatedPost) {
        throw notFoundError('Forum post');
      }

      logger.info('Post pinned:', { postId });
      return updatedPost;
    } catch (error) {
      logger.error('Error pinning post:', error);
      throw error;
    }
  }

  async unpinPost(postId, userRole) {
    try {
      if (userRole !== 'admin') {
        throw validationError('Only administrators can unpin posts');
      }

      const updatedPost = await Forum.findByIdAndUpdate(
        postId,
        { isPinned: false },
        { new: true }
      );

      if (!updatedPost) {
        throw notFoundError('Forum post');
      }

      logger.info('Post unpinned:', { postId });
      return updatedPost;
    } catch (error) {
      logger.error('Error unpinning post:', error);
      throw error;
    }
  }

  async getForumStats() {
    try {
      const stats = await Forum.aggregate([
        {
          $group: {
            _id: null,
            totalPosts: { $sum: 1 },
            activePosts: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            totalVotes: { $sum: '$voteCount' },
            totalViews: { $sum: '$viewCount' },
            pinnedPosts: {
              $sum: { $cond: [{ $eq: ['$isPinned', true] }, 1, 0] }
            }
          }
        }
      ]);

      const categoryStats = await Forum.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgVotes: { $avg: '$voteCount' },
            totalViews: { $sum: '$viewCount' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return {
        overview: stats[0] || {
          totalPosts: 0,
          activePosts: 0,
          totalVotes: 0,
          totalViews: 0,
          pinnedPosts: 0
        },
        categoryStats
      };
    } catch (error) {
      logger.error('Error fetching forum stats:', error);
      throw error;
    }
  }

  async searchPosts(searchTerm, options = {}) {
    try {
      const { limit = 10, page = 1 } = options;
      const skip = (page - 1) * limit;

      const searchQuery = {
        isActive: true,
        $text: { $search: searchTerm }
      };

      const posts = await Forum.find(searchQuery)
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit);

      const total = await Forum.countDocuments(searchQuery);

      return {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalResults: total
        }
      };
    } catch (error) {
      logger.error('Error searching posts:', error);
      throw error;
    }
  }
}

module.exports = new ForumService();