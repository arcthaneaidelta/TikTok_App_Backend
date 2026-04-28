# Loopz Backend

Node.js + Express + MongoDB + Cloudinary backend for the Loopz short-video platform.

## Setup

### 1. Install Node.js
Download from [nodejs.org](https://nodejs.org) (v18+ recommended).

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Configure environment
Edit `.env` and fill in:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/loopz?retryWrites=true&w=majority
JWT_SECRET=your_random_secret_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Get your credentials

**MongoDB Atlas (free):**
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Database Access → Add database user
4. Network Access → Add IP `0.0.0.0/0` (allow all, for dev)
5. Connect → Drivers → Copy connection string → paste into `MONGODB_URI`

**Cloudinary (free):**
1. Go to [cloudinary.com/console](https://cloudinary.com/console)
2. Copy `Cloud Name`, `API Key`, `API Secret` from the dashboard

### 5. Run the server
```bash
npm run dev    # development with auto-reload
# or
npm start      # production
```

Server runs on `http://localhost:5000`

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | - | Create account |
| POST | `/api/auth/login` | - | Get JWT token |
| GET | `/api/auth/me` | Bearer | Get current user |

### Videos
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/videos/feed` | - | Get all videos |
| GET | `/api/videos/liked` | Bearer | Get user's liked videos |
| GET | `/api/videos/creator/:id` | - | Get creator's videos |
| POST | `/api/videos/upload` | Creator | Upload video (multipart, field "video") |
| PUT | `/api/videos/:id/view` | - | Increment views |
| PUT | `/api/videos/:id/like` | Bearer | Toggle like |
| PUT | `/api/videos/:id/share` | - | Increment shares |
| DELETE | `/api/videos/:id` | Owner/Admin | Delete video |

### Comments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/comments/:videoId` | - | Get comments |
| POST | `/api/comments/:videoId` | Bearer | Add comment |

### Admin (all require Super Admin)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/analytics` | Dashboard stats |
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/pending` | Pending creators |
| GET | `/api/admin/videos?creator=&sortBy=` | Filter videos |
| PUT | `/api/admin/approve/:id` | Approve creator |
| PUT | `/api/admin/reject/:id` | Reject creator |

---

## Folder Structure
```
backend/
├── server.js              # Entry point
├── .env                   # Your credentials (gitignored)
├── .env.example           # Template
├── config/
│   ├── db.js              # MongoDB connection
│   └── cloudinary.js      # Cloudinary + multer storage
├── models/
│   ├── User.js
│   ├── Video.js
│   └── Comment.js
├── middleware/
│   ├── auth.js            # JWT protect + role authorize
│   └── errorHandler.js
├── controllers/
│   ├── authController.js
│   ├── videoController.js
│   ├── commentController.js
│   └── adminController.js
└── routes/
    ├── auth.js
    ├── videos.js
    ├── comments.js
    └── admin.js
```

---

## Deploy to Render.com (free)
1. Push backend to a GitHub repo
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo, set:
   - Build: `npm install`
   - Start: `npm start`
4. Add environment variables from `.env`
5. Deploy → copy the URL → use it in the Flutter app
