# 🚀 Guida Deploy TerraGravel

**Data**: 23 Gennaio 2026
**Stack**: Vercel (Backend) + Neon (Database) + Flutter (Mobile)

---

## 📋 Prerequisiti

### Account Necessari
- ✅ **Vercel Account** - https://vercel.com (Sign up with GitHub)
- ✅ **Neon Account** - https://neon.tech (PostgreSQL cloud, free tier)
- ✅ **GitHub Account** - Per connettere Vercel

### Tool Locali
```bash
# Installa Vercel CLI
npm install -g vercel

# Verifica installazione
vercel --version
```

---

## 🗄️ STEP 1: Setup Database (Neon PostgreSQL)

### 1.1 Crea Database su Neon

1. Vai su https://neon.tech
2. Sign up / Login
3. Click **"Create a new project"**
4. Nome progetto: `terragravel-db`
5. Regione: **Europe (Frankfurt)** o più vicina
6. PostgreSQL version: **15**
7. Click **"Create project"**

### 1.2 Ottieni Connection String

Dopo creazione, copia la **Connection String**:
```
postgres://user:password@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**Salva questo valore!** Lo userai per Vercel env vars.

### 1.3 Esegui Migration su Neon

**Opzione A - Via psql (se disponibile):**
```bash
# Export connection string
export DATABASE_URL="postgres://user:password@ep-xxxx..."

# Run migrations
psql $DATABASE_URL -f db/init_db.sql
psql $DATABASE_URL -f db/seed_db.sql
psql $DATABASE_URL -f db/migrations/003_create_messaging_tables.sql
```

**Opzione B - Via Neon SQL Editor (Web):**
1. Apri Neon Dashboard → Il tuo progetto
2. Click **"SQL Editor"** (tab a sinistra)
3. Copia contenuto di `db/init_db.sql` → Paste → Run
4. Copia contenuto di `db/seed_db.sql` → Paste → Run
5. Copia contenuto di `db/migrations/003_create_messaging_tables.sql` → Paste → Run

**Verifica:**
```sql
SELECT COUNT(*) FROM users;
-- Dovrebbe ritornare ~100 (o almeno 1)

SELECT COUNT(*) FROM conversations;
-- Dovrebbe ritornare 2+ (dati di test)
```

---

## ☁️ STEP 2: Deploy Backend su Vercel

### 2.1 Prepara Repository GitHub (Consigliato)

```bash
cd "C:\Users\giann\TerraGravel - Copia\Terra_Gravel"

# Inizializza git (se non già fatto)
git init
git add .
git commit -m "feat: Complete messaging system implementation"

# Crea repo su GitHub e push
git remote add origin https://github.com/TUO_USERNAME/terragravel.git
git branch -M main
git push -u origin main
```

### 2.2 Deploy da Vercel Dashboard

1. Vai su https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. **Import Git Repository** → Seleziona il tuo repo GitHub
4. **Configure Project:**
   - Framework Preset: **Other**
   - Root Directory: `backend`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Install Command: `npm install`

5. **Environment Variables** - Aggiungi queste (CRITICAL):

```env
DB_HOST=ep-xxxx.eu-central-1.aws.neon.tech
DB_PORT=5432
DB_USER=neondb_owner
DB_PASSWORD=<your_neon_password>
DB_NAME=neondb
DB_SSL=true

JWT_SECRET=<genera_una_stringa_random_lunga>
JWT_EXPIRES_IN=7d

REDIS_HOST=
REDIS_PORT=

NODE_ENV=production
```

**Come ottenere i valori DB da Neon:**
- Connection string: `postgres://USER:PASSWORD@HOST:PORT/DB_NAME`
- Estrai: HOST, USER, PASSWORD, DB_NAME dalla stringa

**JWT_SECRET - Genera random:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

6. Click **"Deploy"**

### 2.3 Verifica Deploy

Dopo deploy (1-2 minuti):
- Vercel ti darà URL tipo: `https://terragravel.vercel.app`
- Testa health endpoint:

```bash
curl https://terragravel.vercel.app
# Dovrebbe rispondere: {"message": "Welcome to the TerraGravel API!", "status": "ok"}

# Test login
curl -X POST https://terragravel.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@terragravel.app", "password": "password123"}'
# Dovrebbe ritornare JWT token
```

---

## 📱 STEP 3: Configura Flutter per Production

### 3.1 Modifica API Base URL

**File**: `terragravel_app/lib/services/api_service.dart`

```dart
class ApiService {
  final Dio _dio;

  // PRIMA (Development):
  // static const String _baseUrl = 'http://10.0.2.2:3000/api/v1';

  // DOPO (Production):
  static const String _baseUrl = 'https://TUO_DOMINIO.vercel.app/api/v1';

  // OPPURE usa environment variable per switch automatico:
  static const String _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1', // Dev fallback
  );
```

### 3.2 Build Flutter App

**Android APK (per testing):**
```bash
cd terragravel_app

# Build release APK
flutter build apk --release

# APK generato in:
# build/app/outputs/flutter-apk/app-release.apk

# Trasferisci su device Android e installa
```

**iOS IPA (per TestFlight):**
```bash
# Richiede MacOS + Xcode
flutter build ios --release

# Poi usa Xcode per archiviare e caricare su App Store Connect
```

---

## 🔧 STEP 4: Configurazione Avanzata (Opzionale)

### Custom Domain (Vercel)

1. Vercel Dashboard → Il tuo progetto
2. **Settings** → **Domains**
3. Aggiungi: `api.terragravel.com`
4. Configura DNS del tuo dominio:
   - Type: `CNAME`
   - Name: `api`
   - Value: `cname.vercel-dns.com`

Poi aggiorna Flutter:
```dart
static const String _baseUrl = 'https://api.terragravel.com/api/v1';
```

### CORS Configuration

Se hai problemi CORS, modifica `backend/src/server.js`:

```javascript
// Configurazione CORS più specifica
app.use(cors({
  origin: [
    'https://terragravel.com',
    'https://www.terragravel.com',
    'http://localhost:*', // Dev only
  ],
  credentials: true
}));
```

Poi rideploy su Vercel:
```bash
vercel --prod
```

---

## 🧪 STEP 5: Testing Post-Deploy

### Test Backend API

```bash
# Salva il tuo URL Vercel
export API_URL="https://terragravel.vercel.app/api/v1"

# 1. Health check
curl $API_URL/../

# 2. Login
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@terragravel.app", "password": "password123"}' \
  | jq -r '.token'

# Salva token
export TOKEN="<token_from_above>"

# 3. Get conversations
curl $API_URL/messaging/conversations \
  -H "Authorization: Bearer $TOKEN"

# 4. Get RideMatch stack
curl "$API_URL/ridematch/stack?maxDistance=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Test Flutter App

1. Installa APK su device Android
2. Apri app → Dovrebbe fare auto-login
3. Vai a tab Community → Swipe right
4. Verifica che API calls funzionino
5. Vai a tab Messaggi → Verifica lista conversazioni

**Troubleshooting:**
- Se timeout: Aumenta Dio timeout in `api_service.dart`
- Se 401: Verifica JWT_SECRET uguale su Vercel
- Se 500: Check Vercel logs: `vercel logs`

---

## 📊 STEP 6: Monitoring & Logs

### Vercel Dashboard

**Logs Real-Time:**
```bash
# Da CLI
vercel logs --follow

# Oppure vai su:
# https://vercel.com/dashboard → Il tuo progetto → Logs
```

**Metriche:**
- Dashboard → Analytics
- Vedi: Request count, Latency p95, Error rate

### Neon Dashboard

**Database Monitoring:**
- https://console.neon.tech → Il tuo progetto
- Tab **"Monitoring"**
- Vedi: Connection count, Query latency, Storage used

**Query lente:**
- Tab **"Queries"**
- Ordina per execution time
- Aggiungi indici se necessario

---

## 🔒 STEP 7: Security Checklist

### Backend

- [x] JWT secret casuale e lungo (64+ chars)
- [x] HTTPS enforced (Vercel default)
- [x] Environment variables secure (non committed)
- [ ] Rate limiting attivo (opzionale: express-rate-limit)
- [ ] Input validation su tutti endpoint
- [ ] SQL injection protection (già OK con parameterized queries)

### Database

- [x] SSL connection required (Neon default)
- [x] Password forte per DB user
- [ ] Backup automatici attivi (Neon free tier: 7 giorni retention)
- [ ] IP whitelist (opzionale, Neon Pro)

### Flutter

- [x] HTTPS API calls only
- [x] JWT token storage sicuro (memory, non SharedPreferences)
- [ ] Certificate pinning (opzionale, production-only)
- [ ] ProGuard obfuscation (Android release build)

---

## 🚨 Troubleshooting Comune

### Backend non si connette a Database

**Errore**: `ECONNREFUSED` o `Connection timeout`

**Fix**:
1. Verifica connection string Neon corretta
2. Aggiungi `?sslmode=require` alla fine
3. Verifica env vars su Vercel: Settings → Environment Variables
4. Redeploy: `vercel --prod`

### Flutter timeout su API calls

**Errore**: `DioException: Connection timeout`

**Fix**: Aumenta timeout in `api_service.dart`:
```dart
ApiService._internal()
  : _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 30), // Era 5
      receiveTimeout: const Duration(seconds: 30), // Era 5
    ));
```

### JWT token invalido

**Errore**: `401 Unauthorized`

**Fix**:
1. Verifica JWT_SECRET uguale su Vercel e local
2. Cancella app cache e reinstalla
3. Verifica JWT_EXPIRES_IN non scaduto

### CORS errors

**Errore**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Fix**: Aggiungi origins specifici in `server.js`:
```javascript
app.use(cors({
  origin: ['https://tuo-dominio.com'],
  credentials: true
}));
```

---

## 📈 Performance Optimization

### Backend

**1. Enable Compression:**
```bash
npm install compression
```

```javascript
// server.js
const compression = require('compression');
app.use(compression());
```

**2. Cache Headers:**
```javascript
// Per endpoint che non cambiano spesso
app.get('/api/v1/something', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 min
  // ...
});
```

**3. Database Connection Pooling:**
Già implementato in `config/db.js` con `pg.Pool`

### Flutter

**1. Image Caching:**
Usa `cached_network_image` per avatar (già in `pubspec.yaml`)

**2. API Response Caching:**
```dart
// Implementa cache in-memory per conversations list
// Refresh solo ogni 10 secondi invece di ogni tap
```

**3. Lazy Loading:**
Implementa infinite scroll per messaggi e conversazioni

---

## 🎯 Next Steps Post-Deploy

### Immediate (Week 1)
- [ ] Test end-to-end su device reali (Android + iOS)
- [ ] Invita 5-10 beta testers
- [ ] Setup analytics (Google Analytics / Mixpanel)
- [ ] Monitor logs per errori

### Short-term (Week 2-4)
- [ ] Implementa error tracking (Sentry)
- [ ] Setup CI/CD per auto-deploy
- [ ] Aggiungi health check endpoint con DB ping
- [ ] Implementa feature flags per A/B testing

### Long-term (Month 2+)
- [ ] Migra da polling a WebSocket
- [ ] Setup push notifications (Firebase)
- [ ] Implementa backup strategy avanzata
- [ ] Load testing con k6 o Artillery

---

## 💰 Cost Estimation

### Free Tier (MVP)

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| **Vercel** | Hobby | $0 | 100 GB bandwidth/month, 100 GB-Hrs compute |
| **Neon** | Free | $0 | 3 GB storage, 1 compute unit, 7-day backups |
| **Total** | | **$0/month** | Sufficiente per 100-500 utenti |

### Paid Tier (Growth)

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| **Vercel** | Pro | $20/month | 1 TB bandwidth, 1000 GB-Hrs compute |
| **Neon** | Launch | $19/month | 10 GB storage, 2 compute units, 30-day backups |
| **Firebase** | Spark | $0 + usage | Push notifications (pay-per-use dopo soglia) |
| **Total** | | **~$40/month** | Sufficiente per 1000-5000 utenti |

---

## 📚 Risorse Utili

### Documentation
- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs
- Flutter Deployment: https://flutter.dev/docs/deployment

### CLI Commands Reference

```bash
# Vercel
vercel login              # Login
vercel                    # Deploy (staging)
vercel --prod             # Deploy (production)
vercel logs               # View logs
vercel env add SECRET     # Add env var
vercel domains add        # Add custom domain

# Flutter
flutter build apk --release         # Android release
flutter build ios --release         # iOS release
flutter clean                       # Clean build cache
flutter pub get                     # Update dependencies
```

---

## ✅ Deployment Checklist

Prima di deploy production:

### Pre-Deploy
- [ ] Tutti test passano locally
- [ ] Database migration testate
- [ ] Environment variables documentate
- [ ] README aggiornato con setup instructions
- [ ] .gitignore include .env e secrets

### Deploy
- [ ] Database creato su Neon
- [ ] Migration eseguite su Neon
- [ ] Backend deployed su Vercel
- [ ] Environment variables configurate
- [ ] Custom domain configurato (opzionale)

### Post-Deploy
- [ ] Health check API passa
- [ ] Login funziona
- [ ] Messaging endpoints funzionano
- [ ] Flutter app si connette correttamente
- [ ] Logs monitorate per errori

### Beta Testing
- [ ] APK distribuito a beta testers
- [ ] Feedback form creato
- [ ] Analytics configurati
- [ ] Error tracking attivo

---

## 🆘 Support

**Problemi durante deploy?**

1. Controlla logs: `vercel logs --follow`
2. Verifica env vars: Vercel Dashboard → Settings → Environment Variables
3. Test API manualmente con curl
4. Verifica database connessione su Neon Dashboard

**Need Help?**
- Vercel Support: https://vercel.com/support
- Neon Community: https://community.neon.tech
- Stack Overflow: Tag `vercel` + `postgresql`

---

*Guida deploy generata il 23 Gennaio 2026*
*Versione: 1.0 - TerraGravel Messaging System*
