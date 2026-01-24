# 🚀 Quick Start Guide - TerraGravel Backend

Setup rapido in 5 minuti per sviluppo locale o deployment.

---

## 📌 Scenario 1: Deploy su Vercel (Produzione)

### Tempo: ~15 minuti

**1. Setup Database Neon (gratis)**
```
1. Vai su https://neon.tech → Sign up con GitHub
2. Create Project → Nome: "terragravel", Region: Europe
3. SQL Editor → Esegui:
   CREATE EXTENSION postgis;
   CREATE EXTENSION "uuid-ossp";
   CREATE EXTENSION pg_trgm;
4. Copia tutto da backend/src/db/schema.sql (escluse le righe CREATE EXTENSION)
5. Esegui nello SQL Editor
6. Copia la Connection String (inizia con postgres://...)
```

**2. Deploy su Vercel**
```
1. Vai su https://vercel.com → Sign up con GitHub
2. Import Project → Seleziona "Terra_Gravel"
3. Root Directory: backend
4. Environment Variables → Aggiungi:
   - NODE_ENV = production
   - DATABASE_URL = [string da Neon]
   - JWT_SECRET = [genera con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
5. Deploy!
```

**3. Verifica**
```bash
curl https://tuo-progetto.vercel.app/health
```

✅ Se vedi `"status": "ok"` → **Funziona!**

---

## 📌 Scenario 2: Sviluppo Locale

### Tempo: ~5 minuti

**Prerequisiti:**
- Node.js 20+
- PostgreSQL 15+ con PostGIS

**1. Setup Database**
```bash
cd backend
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

Lo script crea automaticamente:
- Database `terragravel`
- Estensioni PostGIS
- Tutte le tabelle, trigger, indici

**2. Configurazione**
```bash
cp .env.example .env
```

Modifica `.env`:
```env
DB_PASSWORD=tua_password_postgres
JWT_SECRET=dev-secret-key
```

**3. Avvia Server**
```bash
npm install
npm run dev
```

**4. Test**
```bash
curl http://localhost:3000/health
```

✅ Se vedi `"status": "ok"` → **Funziona!**

---

## 📌 Scenario 3: Docker (Opzionale)

**Coming soon** - Dockerfile in preparazione

---

## 🔑 Environment Variables Essenziali

### Vercel (Produzione)

| Variabile | Valore | Dove ottenerlo |
|-----------|--------|----------------|
| `NODE_ENV` | `production` | Fisso |
| `DATABASE_URL` | `postgres://user:pass@host/db?sslmode=require` | Neon Dashboard |
| `JWT_SECRET` | String random 64+ caratteri | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |

### Locale (Sviluppo)

```env
NODE_ENV=development
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=terragravel
JWT_SECRET=dev-secret
```

---

## 🧪 Test API

### 1. Signup
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

**Risposta attesa:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

### 3. Get Profile (con token)
```bash
TOKEN="eyJhbGc..."  # Copia da signup/login
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📁 Struttura Progetto

```
backend/
├── src/
│   ├── config/          # Database, configurazione
│   ├── controllers/     # Logica business
│   ├── middleware/      # Auth, validation, rate limiting
│   ├── routes/          # Endpoint routing
│   ├── utils/           # Helper functions
│   ├── db/
│   │   └── schema.sql   # Schema completo database
│   └── server.js        # Entry point
├── scripts/
│   └── setup-db.sh      # Script setup automatico
├── .env.example         # Template configurazione
└── package.json
```

---

## 🐛 Troubleshooting

### "Database connection failed"
```bash
# Verifica PostgreSQL sia attivo:
pg_isready -h localhost -p 5432

# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

### "PostGIS not found"
```bash
# Installa PostGIS:
# macOS:
brew install postgis

# Linux:
sudo apt-get install postgresql-15-postgis-3

# Poi abilita:
psql -d terragravel -c "CREATE EXTENSION postgis;"
```

### "Port 3000 already in use"
```bash
# Trova processo:
lsof -ti:3000

# Killa:
kill -9 $(lsof -ti:3000)

# O cambia porta in .env:
PORT=3001
```

---

## 📚 Documentazione Completa

- **[VERCEL_DEPLOY_GUIDE.md](VERCEL_DEPLOY_GUIDE.md)** - Guida deploy dettagliata
- **[ENV_TEMPLATE.md](ENV_TEMPLATE.md)** - Tutte le env variables
- **[README.md](README.md)** - Documentazione API completa

---

## ✅ Checklist Setup

### Vercel Deploy
- [ ] Account Neon creato
- [ ] Database + PostGIS configurato
- [ ] Schema importato
- [ ] Account Vercel creato
- [ ] Progetto deployato
- [ ] Environment variables configurate
- [ ] Test `/health` funziona

### Sviluppo Locale
- [ ] PostgreSQL installato e avviato
- [ ] Database creato con script
- [ ] `.env` configurato
- [ ] Dipendenze installate (`npm install`)
- [ ] Server avviato (`npm run dev`)
- [ ] Test signup funziona

---

## 🎯 Prossimi Passi

1. ✅ Backend setup completo
2. 📱 Integra Flutter app
3. 🧪 Test end-to-end
4. 🚀 Deploy in produzione
5. 📊 Setup monitoring

---

**Serve aiuto?** Consulta le guide dettagliate o apri un issue su GitHub.

Buon coding! 🚴‍♂️
