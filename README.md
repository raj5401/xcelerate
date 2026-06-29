# Xcelerate - Production LMS Platform

## Overview

Xcelerate is a **fully-featured Learning Management System (LMS)** built for online education. Designed for teaching PCMB subjects (Physics, Chemistry, Math, Biology) to Classes 11 & 12, it supports:

- 👨‍🏫 **Teachers**: Create courses, upload videos, conduct live classes, create assessments
- 👨‍🎓 **Students**: Enroll, watch videos, take tests, submit assignments, ask doubts
- 👨‍💼 **Admins**: Manage users, payments, courses, analytics

## Tech Stack

### Backend
- **Framework**: Express.js 4.19
- **Database**: PostgreSQL 12+
- **Authentication**: JWT
- **Storage**: AWS S3
- **Payments**: Razorpay
- **Email**: Nodemailer (Gmail SMTP)
- **Real-time**: Jitsi Meet (live classes)

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS 3.4
- **State Management**: Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts

## Features

### Core Features ✅
- ✅ User Authentication (Student/Teacher/Admin)
- ✅ Course Management (CRUD operations)
- ✅ Video Hosting (S3 integration)
- ✅ Live Classes (Jitsi Meet)
- ✅ Assessments (Tests/Quizzes)
- ✅ Assignments with submission tracking
- ✅ Payment Processing (Razorpay)
- ✅ Student Progress Tracking
- ✅ Doubt Resolution Forum
- ✅ Certificate Generation
- ✅ Analytics & Reporting
- ✅ Email Notifications

## Project Structure

```
xcelerate/
├── backend/
│   ├── src/
│   │   ├── index.js                 # Main Express app
│   │   ├── db/
│   │   │   ├── index.js             # PostgreSQL connection
│   │   │   ├── migrate.js           # Database schema
│   │   │   └── seed.js              # Sample data
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verification
│   │   │   ├── validation.js        # Input validation
│   │   │   ├── errorHandler.js      # Error handling
│   │   │   └── rateLimiter.js       # Rate limiting
│   │   ├── routes/                  # API endpoints (15+ route files)
│   │   │   ├── auth.js              # Authentication
│   │   │   ├── courses.js           # Course management
│   │   │   ├── videos.js            # Video management
│   │   │   ├── tests.js             # Test/Quiz engine
│   │   │   ├── assignments.js       # Assignment management
│   │   │   ├── payments.js          # Payment processing
│   │   │   ├── enrollments.js       # Student enrollments
│   │   │   ├── doubts.js            # Q&A Forum
│   │   │   └── ... (more routes)
│   │   └── utils/
│   │       ├── emailService.js      # Email notifications
│   │       ├── paymentService.js    # Razorpay integration
│   │       ├── s3Service.js         # AWS S3 upload
│   │       └── helpers.js           # Utility functions
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                  # Main router
│   │   ├── pages/                   # React pages (20+ components)
│   │   │   ├── Home.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── CourseDetail.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TestAttempt.jsx
│   │   │   ├── admin/               # Admin pages
│   │   │   └── teacher/             # Teacher pages
│   │   ├── components/              # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── TestEngine.jsx
│   │   │   └── ... (more components)
│   │   ├── store/                   # Zustand stores
│   │   │   ├── authStore.js
│   │   │   ├── courseStore.js
│   │   │   └── ... (more stores)
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── utils/                   # Utilities
│   │   │   ├── api.js               # Axios instance
│   │   │   └── helpers.js
│   │   ├── index.css                # Global styles
│   │   └── vite.config.js
│   └── package.json
│
├── docker-compose.yml               # Docker setup
├── .github/workflows/               # CI/CD pipelines
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- AWS S3 bucket
- Razorpay account
- Gmail account (for SMTP)

### Backend Setup

1. **Clone & Install**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
```

2. **Database Setup**
```bash
npm run migrate    # Create tables
npm run seed       # Load sample data (1 admin, 4 teachers, 60 students)
```

3. **Start Server**
```bash
npm run dev        # Development
npm start          # Production
```

Server runs on `http://localhost:5000`

### Frontend Setup

1. **Install & Build**
```bash
cd frontend
npm install
npm run dev        # Development
npm run build      # Production build
```

App runs on `http://localhost:5173`

## API Documentation

### Authentication
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login              # Login
POST   /api/auth/send-otp           # Send OTP
POST   /api/auth/verify-otp         # Verify OTP
GET    /api/auth/profile            # Get user profile
PATCH  /api/auth/profile            # Update profile
```

### Courses
```
GET    /api/courses                 # List courses (with filters)
GET    /api/courses/:id             # Get course details
POST   /api/courses                 # Create course (Teacher/Admin)
PATCH  /api/courses/:id             # Update course
```

### Videos
```
GET    /api/videos/course/:courseId # Get course videos
POST   /api/videos/upload           # Upload video (S3)
POST   /api/videos/:id/progress     # Track watch progress
```

### Tests & Assessments
```
GET    /api/tests                   # List tests
POST   /api/tests                   # Create test
POST   /api/tests/:id/questions     # Add questions
POST   /api/tests/:id/start         # Start test attempt
POST   /api/tests/:id/submit        # Submit answers
GET    /api/tests/:id/results       # Get results & leaderboard
```

### Payments
```
POST   /api/payments/create-order   # Create Razorpay order
POST   /api/payments/verify         # Verify payment
GET    /api/payments/stats          # Payment statistics (Admin)
```

### Live Classes
```
GET    /api/live-classes            # List live classes
POST   /api/live-classes            # Schedule class
POST   /api/live-classes/:id/start  # Start class
POST   /api/live-classes/:id/attendance # Mark attendance
```

### Full API Reference
See [API_DOCS.md](./API_DOCS.md) for complete endpoint documentation.

## Database Schema

### Key Tables
- **users** - Students, Teachers, Admins, Parents
- **courses** - Course catalog with subject, class level, pricing
- **chapters** - Course sections
- **videos** - Video lessons (S3 hosted)
- **batches** - Class schedules & groups
- **live_classes** - Live class sessions (Jitsi)
- **enrollments** - Student course enrollments
- **tests** - Quizzes, mock exams, assessments
- **questions** - Test questions with options
- **attempts** - Student test submissions
- **assignments** - Homework & projects
- **assignment_submissions** - Student submissions
- **doubts** - Q&A forum threads
- **payments** - Transaction records
- **certificates** - Completion certificates

**Total: 30+ tables with comprehensive indexing**

## Default Credentials (After Seed)

```
Admin:
  Email: admin@xcelerate.com
  Password: admin123

Teacher:
  Email: physics@xcelerate.com (or chemistry/math/biology)
  Password: teacher123

Student:
  Email: student1@xcelerate.com (to student60@xcelerate.com)
  Password: student123
```

## Environment Variables

See `.env.example` for all required variables:

```
# Core
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=xcelerate
DB_USER=postgres
DB_PASS=password

# JWT
JWT_SECRET=your_secret_min_32_chars
JWT_EXPIRES_IN=7d

# Email
SMTP_USER=your@gmail.com
SMTP_PASS=app_password

# Razorpay
RAZORPAY_KEY_ID=key_xxxxx
RAZORPAY_KEY_SECRET=secret_xxxxx

# AWS S3
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_S3_BUCKET=xcelerate-uploads

# Frontend
FRONTEND_URL=http://localhost:5173
```

## Deployment

### Docker
```bash
docker-compose up -d
```

### Heroku / Railway / Render
1. Set environment variables
2. Push to main branch
3. CI/CD automatically deploys

### AWS / DigitalOcean
1. Create EC2/Droplet
2. Install Node.js, PostgreSQL
3. Clone repo
4. Configure .env
5. Run migrations
6. Start with PM2:
```bash
pm2 start src/index.js --name xcelerate-api
```

## Performance Features

- ✅ Database query optimization with indexes
- ✅ Rate limiting on auth endpoints
- ✅ CORS security
- ✅ Input validation & sanitization
- ✅ Error handling middleware
- ✅ JWT token expiration
- ✅ S3 storage for large files
- ✅ Pagination on list endpoints
- ✅ Caching ready (Redis compatible)

## Security Features

- ✅ Password hashing (bcryptjs)
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Input validation (express-validator)
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection

## Scaling for 60+ Students

The system is optimized for 60 students with:

- Database indexes on frequently queried columns
- Connection pooling configured
- S3 for file storage (no disk space issues)
- Rate limiting to prevent abuse
- Pagination on list endpoints
- Ready for Redis caching
- Docker setup for easy scaling

## Common Issues & Solutions

### Database Connection Failed
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Create database
creatdb xcelerate
```

### S3 Upload Fails
- Verify AWS credentials
- Check bucket name & region
- Ensure IAM user has S3 permissions

### Email Not Sending
- Use Gmail App Password (not regular password)
- Enable "Less Secure App Access"
- Check SMTP settings

### Payment Integration Issues
- Verify Razorpay API keys
- Check payment verification logic
- Test in sandbox mode first

## Contributing

1. Create feature branch: `git checkout -b feature/xyz`
2. Commit changes: `git commit -m "feat: Add xyz"`
3. Push: `git push origin feature/xyz`
4. Create Pull Request

## License

MIT License - See LICENSE file

## Support

For issues, questions, or feature requests:
- Create GitHub Issue
- Email: support@xcelerate.com

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Live video streaming optimization (HLS/DASH)
- [ ] Advanced analytics dashboard
- [ ] AI-powered doubt resolution
- [ ] Gamification (badges, leaderboards)
- [ ] Integration with educational platforms
- [ ] Multi-language support
- [ ] Whiteboard for live classes

---

**Built with ❤️ for Education**

Xcelerate - Where Teaching Meets Technology
