# 🚴 TerraGravel

> Connect, ride, and explore with fellow cyclists

![Deploy Backend](https://github.com/YOUR_USERNAME/terragravel/actions/workflows/deploy-backend.yml/badge.svg)
![Build Flutter](https://github.com/YOUR_USERNAME/terragravel/actions/workflows/build-flutter.yml/badge.svg)
![CI Pipeline](https://github.com/YOUR_USERNAME/terragravel/actions/workflows/ci.yml/badge.svg)

TerraGravel is a mobile-first social platform for cyclists to connect, organize rides, and share their adventures. Built with Flutter for mobile and Node.js + PostgreSQL for the backend

---

## 🌟 Features

### 🚴 RideMatch (Tinder-style Matching)
- **Swipe to connect** with cyclists near you
- **Smart matching** based on location, preferences, and riding style
- **Elastic animations** for smooth card interactions
- **Real-time updates** for new matches

### 💬 Messaging System
- **Real-time chat** with your cycling connections
- **Conversation threads** with message history
- **Typing indicators** and read receipts
- **Push notifications** (coming soon)

### 🗺️ Ride Planning
- **Create and join rides** with your community
- **Route planning** with GPX support
- **Difficulty ratings** (Easy, Moderate, Hard, Expert)
- **Weather integration** for ride conditions

### 👥 Community Features
- **User profiles** with bio, stats, and preferences
- **Activity feed** to see what others are riding
- **Follow system** to stay connected
- **Achievement badges** for milestones

---

## 🏗️ Tech Stack

### Frontend (Mobile)
- **Flutter 3.19.0** - Cross-platform mobile development
- **Dart** - Programming language
- **Provider** - State management
- **Dio** - HTTP client for API calls
- **flutter_card_swiper** - Tinder-style card interactions

### Backend
- **Node.js 20** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL 15** - Relational database
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Infrastructure
- **Vercel** - Backend hosting (serverless)
- **Neon** - PostgreSQL cloud database
- **GitHub Actions** - CI/CD pipelines
- **Docker** - Containerization (optional local dev)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Flutter 3.19.0+
- PostgreSQL 15+ (or Neon account)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/terragravel.git
cd terragravel
```

### 2. Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
# DB_HOST, DB_USER, DB_PASSWORD, etc.

# Run migrations
psql $DATABASE_URL -f ../db/init_db.sql
psql $DATABASE_URL -f ../db/seed_db.sql

# Start server
npm start
# Backend running on http://localhost:3000
```

### 3. Setup Flutter App
```bash
cd terragravel_app

# Install dependencies
flutter pub get

# Run on Android emulator
flutter run

# Or build APK
flutter build apk --release
```

### 4. Test It Out
- Open the app
- Auto-login with test account
- Go to Community tab → Start swiping
- Go to Messages tab → See conversations
- Enjoy exploring!

---

## 📱 Mobile App Features

### 🎨 Design Highlights
- **Material Design 3** with custom TerraGravel theme
- **Smooth animations** throughout the app
- **Responsive UI** adapts to different screen sizes
- **Dark mode ready** (coming soon)

### 📱 Screens
- **RideMatch Screen** - Swipe through cyclist profiles
- **Match Screen** - Celebrate new connections
- **Messages Screen** - Chat with your matches
- **Profile Screen** - Manage your cyclist profile
- **Ride Details** - View and join rides

### 🎯 Key Components
- `card_stack.dart` - Swipeable card stack for RideMatch
- `chat_screen.dart` - Real-time messaging interface
- `api_service.dart` - Centralized API communication
- `auth_service.dart` - JWT authentication

---

## 🔧 Development

### Backend Development
```bash
cd backend

# Run in development mode (auto-reload)
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Check for security issues
npm audit
```

### Flutter Development
```bash
cd terragravel_app

# Run on specific device
flutter devices
flutter run -d <device-id>

# Hot reload: Press 'r' in terminal
# Hot restart: Press 'R' in terminal

# Run tests
flutter test

# Analyze code
flutter analyze

# Format code
dart format lib/
```

### Database Development
```bash
# Create new migration
touch db/migrations/005_your_migration.sql

# Test migration locally
psql $LOCAL_DATABASE_URL -f db/migrations/005_your_migration.sql

# Deploy migration via GitHub Actions
# See: .github/README.md
```

---

## 🚀 Deployment

### Automated Deployment (Recommended)

**Backend to Vercel**:
1. Push to `main` branch
2. GitHub Actions automatically deploys to Vercel
3. Check deployment at https://terragravel.vercel.app

**Flutter APK Build**:
1. Push to `main` branch
2. GitHub Actions builds APK
3. Download from Actions → Artifacts
4. Or from Releases page

See [`.github/README.md`](.github/README.md) for detailed CI/CD setup.

### Manual Deployment

**Backend**:
```bash
cd backend
vercel --prod
```

**Flutter**:
```bash
cd terragravel_app
flutter build apk --release
# APK in: build/app/outputs/flutter-apk/app-release.apk
```

See [`DEPLOY_GUIDE.md`](DEPLOY_GUIDE.md) for comprehensive deployment guide.

---

## 📊 Project Structure

```
terragravel/
├── backend/                    # Node.js backend
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Auth, validation, etc.
│   │   ├── routes/           # API routes
│   │   ├── config/           # Database, env config
│   │   └── server.js         # Express app entry
│   ├── package.json
│   └── vercel.json           # Vercel deployment config
│
├── terragravel_app/          # Flutter mobile app
│   ├── lib/
│   │   ├── models/          # Data models
│   │   ├── screens/         # UI screens
│   │   ├── services/        # API, auth services
│   │   ├── widgets/         # Reusable components
│   │   └── main.dart        # App entry point
│   └── pubspec.yaml
│
├── db/                       # Database files
│   ├── init_db.sql          # Schema initialization
│   ├── seed_db.sql          # Test data
│   └── migrations/          # Database migrations
│
├── .github/                  # GitHub Actions workflows
│   ├── workflows/
│   │   ├── deploy-backend.yml
│   │   ├── build-flutter.yml
│   │   ├── ci.yml
│   │   └── db-migration.yml
│   └── README.md            # CI/CD documentation
│
├── docs/                     # Documentation
│   └── MESSAGING_SYSTEM_COMPLETE.md
│
├── DEPLOY_GUIDE.md          # Deployment guide
├── AGENTS.md                # Development agents guide
└── README.md                # This file
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test

# With coverage
npm test -- --coverage
```

### Flutter Tests
```bash
cd terragravel_app
flutter test

# With coverage
flutter test --coverage
```

### E2E Testing
```bash
# Start backend
cd backend && npm start

# Run Flutter integration tests
cd terragravel_app
flutter drive --target=test_driver/app.dart
```

---

## 📖 API Documentation

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user

### RideMatch
- `GET /api/v1/ridematch/stack` - Get stack of potential matches
- `POST /api/v1/ridematch/swipe` - Swipe right (like) or left (pass)
- `GET /api/v1/ridematch/matches` - Get all matches

### Messaging
- `GET /api/v1/messaging/conversations` - Get all conversations
- `GET /api/v1/messaging/conversations/:id` - Get conversation details
- `POST /api/v1/messaging/conversations/:id/messages` - Send message
- `PUT /api/v1/messaging/messages/:id/read` - Mark message as read

### Rides
- `GET /api/v1/rides` - Get all rides
- `GET /api/v1/rides/:id` - Get ride details
- `POST /api/v1/rides` - Create new ride
- `POST /api/v1/rides/:id/join` - Join a ride

See backend routes in `backend/src/routes/` for complete API reference.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/my-feature`
3. **Make changes**: Add features or fix bugs
4. **Test thoroughly**: Run tests and manual testing
5. **Commit changes**: `git commit -m "feat: Add my feature"`
6. **Push to branch**: `git push origin feature/my-feature`
7. **Open Pull Request**: Describe your changes

### Code Style
- **Backend**: Follow ESLint configuration
- **Flutter**: Follow official Dart style guide
- **Commits**: Use conventional commits (feat, fix, docs, etc.)

### Testing Requirements
- Add tests for new features
- Ensure all tests pass before PR
- Maintain or improve code coverage

---

## 🐛 Known Issues

- [ ] iOS build requires manual codesigning setup
- [ ] Real-time messaging uses polling (WebSocket planned)
- [ ] Push notifications not yet implemented
- [ ] Dark mode UI incomplete

See [Issues](https://github.com/YOUR_USERNAME/terragravel/issues) for full list.

---

## 🗺️ Roadmap

### Q1 2026
- [x] Core RideMatch functionality
- [x] Messaging system
- [x] Basic ride planning
- [ ] Push notifications
- [ ] iOS TestFlight release

### Q2 2026
- [ ] WebSocket real-time messaging
- [ ] Advanced route planning with GPX
- [ ] Weather integration
- [ ] Activity feed

### Q3 2026
- [ ] Group rides and events
- [ ] Achievement system
- [ ] Premium features
- [ ] Android Play Store release

### Q4 2026
- [ ] Ride tracking with GPS
- [ ] Social features (follow, like, comment)
- [ ] Advanced matching algorithm
- [ ] iOS App Store release

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Lead Developer**: [Your Name]
- **Backend**: Node.js + PostgreSQL
- **Mobile**: Flutter + Dart
- **Design**: Material Design 3

---

## 🙏 Acknowledgments

- Flutter team for excellent mobile framework
- Vercel for simple serverless hosting
- Neon for managed PostgreSQL
- All contributors and beta testers

---

## 📞 Contact

- **Email**: contact@terragravel.app
- **Website**: https://terragravel.app
- **Discord**: [Join our community]
- **Twitter**: [@terragravel]

---

## 🔗 Links

- [Deployment Guide](DEPLOY_GUIDE.md) - Complete deployment instructions
- [CI/CD Setup](.github/README.md) - GitHub Actions configuration
- [API Documentation](docs/API.md) - Complete API reference
- [Development Guide](AGENTS.md) - Development workflow

---

*Built with ❤️ by cyclists, for cyclists*

**Ready to ride? Download TerraGravel today!**
