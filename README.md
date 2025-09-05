# FitStat API - Enterprise Fitness Platform

🏋️‍♂️ **FitStat** is a comprehensive, enterprise-grade fitness platform API built with modern Node.js architecture. It provides a complete ecosystem for fitness enthusiasts, trainers, and administrators with advanced features including payment processing, community forums, analytics dashboard, and more.

## 🚀 Live Deployment

- **API Base URL:** `https://fitstat-api.herokuapp.com` *(Replace with your actual deployment URL)*
- **Frontend Application:** [https://fistat.vercel.app](https://fistat.vercel.app)
- **API Documentation:** `https://fitstat-api.herokuapp.com/api/docs`

## 🔑 Admin Credentials

- **Admin Email:** `admin@fitstat.com`
- **Admin Password:** `Admin1`

## 🏗️ Architecture Overview

This is a **complete enterprise-grade** Node.js/Express.js application following industry best practices:

```
src/
├── config/          # Database and environment configuration
├── controllers/     # HTTP request handlers
├── middleware/      # Authentication, validation, error handling
├── models/          # Mongoose schemas and database models
├── routes/          # API route definitions
├── services/        # Business logic layer
├── utils/           # Utility functions and helpers
└── app.js           # Main application entry point
```

### 🎯 Design Patterns Used:
- **MVC Architecture** (Model-View-Controller)
- **Service Layer Pattern** for business logic
- **Repository Pattern** with Mongoose ODM
- **Middleware Pattern** for cross-cutting concerns
- **Factory Pattern** for validation and error handling

## ✨ Key Features

### 🔐 Authentication & Authorization
- **JWT-based Authentication** with refresh tokens
- **Role-based Access Control** (Member, Trainer, Admin)
- **Social Login Support** (Google, Facebook, GitHub)
- **Password Hashing** with bcrypt
- **Rate Limiting** for security

### 💳 Payment System
- **Stripe Integration** for secure payments
- **Subscription Management** for premium features
- **Booking System** for trainer sessions
- **Payment Analytics** and reporting
- **Refund Processing** capabilities

### 🏃‍♀️ Fitness Management
- **Class Management** with categories and difficulty levels
- **Trainer Application System** with approval workflow
- **Slot Booking** for training sessions
- **Capacity Management** for classes
- **Progress Tracking** and analytics

### 💬 Community Features
- **Forum System** with voting and moderation
- **User Reviews** and ratings for classes/trainers
- **Newsletter Subscription** with preference management
- **Real-time Interactions** and notifications

### 📊 Analytics Dashboard
- **Comprehensive Analytics** for admins
- **Revenue Tracking** by category and time
- **User Engagement Metrics**
- **Trainer Performance Analytics**
- **System Health Monitoring**

### 🛡️ Security Features
- **Helmet.js** for security headers
- **CORS** configuration
- **Input Validation** with Joi
- **SQL Injection Protection**
- **XSS Protection**
- **Rate Limiting** per IP and endpoint

## 🛠️ Technology Stack

### Backend
- **Node.js** 16+ - JavaScript runtime
- **Express.js** 4.x - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** 8.x - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication

### Payment Processing
- **Stripe** - Payment processing platform
- **Webhooks** for payment confirmation

### Validation & Security
- **Joi** - Object schema validation
- **Helmet** - Security middleware
- **bcryptjs** - Password hashing
- **express-rate-limit** - Rate limiting

### Development Tools
- **Nodemon** - Development server
- **ESLint** - Code linting
- **Jest** - Testing framework
- **Morgan** - HTTP request logger

## 📦 Installation & Setup

### Prerequisites
- Node.js 16.0 or higher
- MongoDB 4.4 or higher
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/fitstat-api.git
cd fitstat-api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/fitstat-db
DB_NAME=fitstat-db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=4h

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Database Setup
Ensure MongoDB is running locally or provide a cloud MongoDB URI.

### 5. Start the Application

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

### 6. Verify Installation
Visit the following endpoints to confirm setup:
- **Health Check:** `http://localhost:4000/health`
- **API Documentation:** `http://localhost:4000/api/docs`

## 🔌 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Authentication Endpoints
```http
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
POST   /api/auth/refresh-token     # Refresh JWT token
GET    /api/auth/me                # Get current user
PATCH  /api/auth/change-password   # Change password
```

### User Management
```http
GET    /api/users                  # Get all users (Admin)
GET    /api/users/trainers         # Get all trainers
POST   /api/users/:id/apply        # Apply for trainer role
GET    /api/users/applications     # Get pending applications (Admin)
PATCH  /api/users/:id/slot         # Add trainer slot
```

### Class Management
```http
GET    /api/classes               # Get all classes
POST   /api/classes               # Create new class (Admin/Trainer)
GET    /api/classes/popular       # Get popular classes
PATCH  /api/classes/:id/book      # Book a class
GET    /api/classes/:id           # Get class details
```

### Payment System
```http
POST   /api/payments/create-payment-intent  # Create payment intent
POST   /api/payments                        # Process payment
GET    /api/payments/my-payments            # Get user payments
POST   /api/payments/:id/refund             # Refund payment (Admin)
```

### Forum System
```http
GET    /api/forums                # Get forum posts
POST   /api/forums                # Create new post
PATCH  /api/forums/:id/upvote      # Upvote post
PATCH  /api/forums/:id/downvote    # Downvote post
GET    /api/forums/trending       # Get trending posts
```

### Reviews & Ratings
```http
GET    /api/reviews               # Get all reviews
POST   /api/reviews               # Create review
GET    /api/reviews/class/:id     # Get class reviews
GET    /api/reviews/trainer/:email # Get trainer reviews
```

### Newsletter Management
```http
POST   /api/newsletters/subscribe   # Subscribe to newsletter
POST   /api/newsletters/unsubscribe # Unsubscribe
GET    /api/newsletters             # Get subscribers (Admin)
```

### Dashboard Analytics (Admin Only)
```http
GET    /api/dashboard/stats              # Main dashboard stats
GET    /api/dashboard/analytics          # Advanced analytics
GET    /api/dashboard/user-engagement    # User engagement metrics
GET    /api/dashboard/revenue/category   # Revenue by category
```

## 🔒 Authentication & Authorization

### JWT Token Structure
```javascript
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "member|trainer|admin",
  "iat": 1640995200,
  "exp": 1641009600
}
```

### Role Permissions
- **Member**: Basic user operations, bookings, reviews
- **Trainer**: Member permissions + class management, slot creation
- **Admin**: Full system access, user management, analytics

### Making Authenticated Requests
```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['member', 'trainer', 'admin'],
  status: Enum ['active', 'pending', 'rejected'],
  slots: [SlotSchema],
  skills: [String],
  // ... other fields
}
```

### Class Model
```javascript
{
  name: String,
  description: String,
  price: Number,
  difficulty: Enum ['Beginner', 'Intermediate', 'Advanced'],
  bookingCount: Number,
  maxCapacity: Number,
  // ... other fields
}
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/           # End-to-end tests
```

## 🚀 Deployment

### Environment Variables for Production
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fitstat
JWT_SECRET=your-production-jwt-secret
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

### Deployment Platforms
- **Heroku**: Ready for Heroku deployment
- **AWS EC2**: Full server control
- **DigitalOcean**: App Platform deployment
- **Railway**: Simple deployment solution

## 📈 Performance & Monitoring

### Performance Features
- **Database Indexing** for optimized queries
- **Connection Pooling** with Mongoose
- **Request Rate Limiting**
- **Response Compression**
- **Efficient Aggregation Pipelines**

### Monitoring
- **Health Check Endpoints**
- **System Resource Monitoring**
- **Error Tracking and Logging**
- **Performance Metrics**

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write comprehensive tests
- Document API endpoints
- Use meaningful commit messages
- Follow semantic versioning

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Contact

- **Email**: support@fitstat.com
- **Documentation**: [API Docs](http://localhost:4000/api/docs)
- **Issues**: [GitHub Issues](https://github.com/your-username/fitstat-api/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/fitstat-api/discussions)

## 🙏 Acknowledgments

- Express.js team for the robust framework
- MongoDB team for the flexible database
- Stripe for secure payment processing
- All contributors and the open-source community

---

**Built with ❤️ for the fitness community**