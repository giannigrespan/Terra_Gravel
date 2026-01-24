# TerraGravel Backend API

Backend API server for TerraGravel - A cyclist matching platform with Tinder-style swipe interface.

## Features

- **User Authentication** - JWT-based auth with refresh tokens
- **Cyclist Profiles** - Detailed cyclist data (speed, vibe, bike type)
- **RideMatch System** - Tinder-style matching with sophisticated compatibility algorithm
- **Messaging** - Real-time chat between matched cyclists
- **Ride Feedback** - Post-ride rating system with reputation tracking
- **Location-based Matching** - PostGIS geospatial queries for proximity matching
- **Rate Limiting** - Protection against abuse and spam
- **Security** - Helmet, CORS, input validation, password hashing

## Tech Stack

- **Node.js 20+** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL 15+** - Database with PostGIS extension
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **express-rate-limit** - API rate limiting

## Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 15+ with PostGIS extension
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=terragravel
   DB_SSL=false

   JWT_SECRET=your-secret-key-change-this
   JWT_EXPIRES_IN=7d
   ```

4. **Set up the database**

   Create the database:
   ```bash
   psql -U postgres -c "CREATE DATABASE terragravel;"
   ```

   Run the schema migration:
   ```bash
   psql -U postgres -d terragravel -f src/db/schema.sql
   ```

5. **Start the server**

   Development mode (with auto-reload):
   ```bash
   npm run dev
   ```

   Production mode:
   ```bash
   npm start
   ```

6. **Verify the server is running**
   ```bash
   curl http://localhost:3000/health
   ```

## API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication

All authenticated endpoints require an `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

---

### Auth Endpoints

#### Sign Up
```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "username": "john_cyclist",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "john_cyclist",
      "email": "john@example.com"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

---

### User Endpoints

#### Get Current User
```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

#### Update User Profile
```http
PATCH /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "new_username",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

#### Update Location
```http
PUT /api/v1/users/me/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 45.4642,
  "longitude": 9.1900
}
```

---

### Cyclist Profile Endpoints

#### Get Cyclist Profile
```http
GET /api/v1/cyclist-profile
Authorization: Bearer <token>
```

#### Update Cyclist Profile
```http
PUT /api/v1/cyclist-profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "avg_speed_gravel": 22.5,
  "ride_vibe": "SPORT",
  "bike_type": "GRAVEL_MUSCLE",
  "bio": "Love long gravel rides!",
  "max_distance_km": 25,
  "min_speed_preference": 18,
  "max_speed_preference": 26
}
```

**Enum Values:**
- `ride_vibe`: CHILL, SPORT, RACE
- `bike_type`: GRAVEL_MUSCLE, GRAVEL_EBIKE, MTB, ROAD

#### Get Recent Rides
```http
GET /api/v1/cyclist-profile/recent-rides?limit=10
Authorization: Bearer <token>
```

#### Add Recent Ride
```http
POST /api/v1/cyclist-profile/recent-rides
Authorization: Bearer <token>
Content-Type: application/json

{
  "ride_name": "Morning Gravel Loop",
  "distance_km": 45.5,
  "difficulty": 3,
  "ride_date": "2026-01-20"
}
```

---

### RideMatch Endpoints

#### Get Match Stack
```http
GET /api/v1/ridematch/stack?limit=50
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "maria_cyclist",
      "avatar_url": "https://...",
      "age_estimate": 2,
      "avg_speed_gravel": 21.5,
      "ride_vibe": "SPORT",
      "bike_type": "GRAVEL_MUSCLE",
      "bio": "Weekend warrior",
      "distance_km": 8,
      "strava_verified": true,
      "compatibility_score": 85,
      "recent_rides": [
        {
          "ride_name": "Sunday Loop",
          "distance_km": 50,
          "difficulty": 3
        }
      ]
    }
  ],
  "count": 50
}
```

#### Swipe
```http
POST /api/v1/ridematch/swipe
Authorization: Bearer <token>
Content-Type: application/json

{
  "target_id": "user-uuid",
  "action": "LIKE"
}
```

**Actions:** LIKE, PASS, SUPERLIKE

**Response:**
```json
{
  "success": true,
  "data": {
    "swipe_id": "uuid",
    "action": "LIKE",
    "matched": true,
    "match_id": "uuid",
    "matched_at": "2026-01-24T10:30:00Z"
  }
}
```

#### Get Matches
```http
GET /api/v1/ridematch/matches?status=ACTIVE&limit=20&offset=0
Authorization: Bearer <token>
```

#### Unmatch
```http
POST /api/v1/ridematch/unmatch
Authorization: Bearer <token>
Content-Type: application/json

{
  "match_id": "uuid"
}
```

---

### Message Endpoints

#### Get Messages
```http
GET /api/v1/matches/{matchId}/messages?limit=50&offset=0
Authorization: Bearer <token>
```

#### Send Message
```http
POST /api/v1/matches/{matchId}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hey! Want to ride this Saturday?"
}
```

#### Mark Messages as Read
```http
PUT /api/v1/matches/{matchId}/messages/read
Authorization: Bearer <token>
```

---

### Feedback Endpoints

#### Submit Ride Feedback
```http
POST /api/v1/ridematch/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "match_id": "uuid",
  "reviewed_id": "uuid",
  "showed_up": true,
  "rating": 5,
  "was_appropriate": true
}
```

---

## Matching Algorithm

The compatibility score (0-100) is calculated based on:

1. **Distance** (30 points) - Geographic proximity using PostGIS
2. **Speed Compatibility** (40 points) - Similar average gravel speed
3. **Ride Vibe Match** (20 points) - Same cycling style preference
4. **Recent Activity** (10 points) - Active users get priority

**SQL Query Example:**
```sql
-- Distance calculation
(1 - LEAST(ST_Distance(location_a, location_b) / 1000 / max_distance, 1)) * 30

-- Speed similarity
(1 - LEAST(ABS(speed_a - speed_b) / 10, 1)) * 40

-- Same vibe bonus
CASE WHEN vibe_a = vibe_b THEN 20 ELSE 0 END

-- Recent activity bonus
CASE WHEN last_seen < 7 days THEN 10 ELSE 0 END
```

## Rate Limits

- **General API**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes
- **Swipes**: 200 per day
- **Feedback**: 10 per day

## Database Schema

See `src/db/schema.sql` for complete schema.

**Key Tables:**
- `users` - Base user authentication
- `cyclist_profile` - Cyclist-specific data
- `swipes` - Swipe history
- `matches` - Mutual matches
- `messages` - Chat messages
- `ride_feedback` - Post-ride ratings
- `recent_rides` - Ride history

**Automatic Triggers:**
- Auto-create match on mutual like
- Update last_message_at on new message
- Update updated_at timestamp

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation with express-validator
- Rate limiting per endpoint
- SQL injection protection (parameterized queries)
- CORS configuration
- Helmet security headers
- Location privacy (rounded to 1km)

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── db/            # Database schema and migrations
│   ├── middleware/     # Express middleware
│   ├── routes/        # API routes
│   ├── utils/         # Utility functions
│   └── server.js      # Main entry point
├── tests/             # Test files
├── .env.example       # Environment template
└── package.json       # Dependencies
```

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Set environment variables in Vercel dashboard

### Docker (Alternative)

Build and run:
```bash
docker build -t terragravel-backend .
docker run -p 3000:3000 --env-file .env terragravel-backend
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | terragravel |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | Access token expiry | 7d |

## Troubleshooting

### Database connection fails
- Ensure PostgreSQL is running
- Check credentials in `.env`
- Verify PostGIS extension is installed: `CREATE EXTENSION postgis;`

### Port already in use
- Change `PORT` in `.env`
- Or kill process: `lsof -ti:3000 | xargs kill`

### JWT token expired
- Use refresh token endpoint to get new access token
- Or login again

## License

MIT

## Support

For issues and questions, open an issue on GitHub.
