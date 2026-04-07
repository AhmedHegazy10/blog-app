# Blog Application API

A production-ready Blog Application built with **Express.js**, **MongoDB**, **JWT Auth**, and **ImageKit** for media uploads.

---

## 🚀 Setup & Installation

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd blog-app
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
# Fill in all values in .env
```

### 3. Run locally
```bash
npm run dev     # development (nodemon)
npm start       # production
```

---

## ⚙️ Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | JWT expiry (e.g. `7d`) |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit URL endpoint |

---

## 📁 Project Structure

```
/blog-app
  /controllers
    auth.controller.js       ← Register, Login
    user.controller.js       ← Users CRUD
    post.controller.js       ← Posts CRUD + Likes + Comments
    group.controller.js      ← Groups CRUD + Members + Permissions
  /models
    user.model.js            ← User schema (bcrypt hashing built-in)
    post.model.js            ← Post schema (images array, comments sub-doc)
    group.model.js           ← Group schema (admins, members, allowedToPost)
  /routes
    auth.routes.js
    user.routes.js
    post.routes.js
    group.routes.js
  /middleware
    auth.middleware.js       ← protect (JWT verify) + restrictTo (RBAC)
    upload.middleware.js     ← multerUpload + uploadOnImageKit
    error.middleware.js      ← Global error handler
  /utils
    AppError.js              ← Custom error class
    imagekit.js              ← ImageKit upload helpers
  /config
    db.js                    ← MongoDB connection
  /validation
    auth.validation.js       ← Joi schemas for auth
    post.validation.js       ← Joi schemas for posts
    group.validation.js      ← Joi schemas for groups
  server.js                  ← Entry point
  app.js                     ← Express app
  vercel.json                ← Vercel deployment config
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login & get JWT | ❌ |

### Users
| Method | Endpoint | Description | Auth | Role |
|---|---|---|---|---|
| GET | `/api/users/me` | Get current user | ✅ | any |
| GET | `/api/users` | Get all users | ✅ | admin+ |
| GET | `/api/users/:id` | Get single user | ✅ | any |
| PATCH | `/api/users/:id` | Update user | ✅ | admin+ |
| DELETE | `/api/users/:id` | Delete user | ✅ | admin+ |

### Posts
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/posts` | Get all accessible posts (paginated, searchable) | ✅ |
| POST | `/api/posts` | Create post (with images) | ✅ |
| GET | `/api/posts/my-posts` | Get my posts | ✅ |
| GET | `/api/posts/user/:userId` | Get posts by user | ✅ |
| GET | `/api/posts/:id` | Get single post | ✅ |
| PATCH | `/api/posts/:id` | Update post | ✅ |
| DELETE | `/api/posts/:id` | Delete post | ✅ |
| POST | `/api/posts/:id/like` | Like / Unlike post | ✅ |
| POST | `/api/posts/:id/comments` | Add comment | ✅ |
| DELETE | `/api/posts/:id/comments/:commentId` | Delete comment | ✅ |

### Groups
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/groups` | Get all groups | ✅ |
| POST | `/api/groups` | Create group | ✅ |
| GET | `/api/groups/:id` | Get single group | ✅ |
| PATCH | `/api/groups/:id` | Update group (admin) | ✅ |
| DELETE | `/api/groups/:id` | Delete group (admin) | ✅ |
| POST | `/api/groups/:id/members` | Add member | ✅ |
| DELETE | `/api/groups/:id/members` | Remove member | ✅ |
| POST | `/api/groups/:id/admins` | Promote to admin | ✅ |
| PATCH | `/api/groups/:id/permissions` | Toggle post permission | ✅ |

---

## 🔐 Auth Usage

All protected routes require the JWT in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📤 Image Upload

Posts use `multipart/form-data`. Use the `images` field (supports multiple):
```
Content-Type: multipart/form-data
images: <file1>
images: <file2>
```

---

## 📋 Query Parameters

### GET /api/posts
| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10) |
| `search` | string | Search in title & content |

---

## 👥 Roles & Permissions

| Action | user | admin | super-admin |
|---|---|---|---|
| Register / Login | ✅ | ✅ | ✅ |
| Create post | ✅ | ✅ | ✅ |
| Edit/Delete own post | ✅ | ✅ | ✅ |
| Edit/Delete any post | ❌ | ❌ | ✅ |
| Manage users | ❌ | ✅ | ✅ |
| Create group | ✅ | ✅ | ✅ |
| Add/Remove group members | group admin only | group admin only | ✅ |
| Override all rules | ❌ | ❌ | ✅ |

---

## 🌍 Deployment

### Vercel
1. Push code to GitHub
2. Connect repo to [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel project settings
4. Deploy — `vercel.json` handles the routing automatically

---

## ✅ Bonus Features Implemented

- 💬 Comments system (add / delete)
- ❤️ Likes / Unlike system
- 📄 Pagination on all list endpoints
- 🔍 Search posts by title & content
- 🛡️ Rate limiting (100 req / 15 min per IP)
