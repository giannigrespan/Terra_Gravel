# 🔐 OAuth Setup Guide - Google & Strava

Guida completa per configurare Google Sign-In e Strava OAuth in TerraGravel.

---

## 📋 Panoramica

**TerraGravel supporta 3 metodi di autenticazione:**

1. ✅ **Email/Password** - Già implementato, funziona out-of-the-box
2. 🔵 **Google Sign-In** - Richiede setup Google Cloud (questa guida)
3. 🟠 **Strava OAuth** - Richiede setup Strava API (questa guida)

**Configurazione OAuth è OPZIONALE:**
- Puoi usare solo email/password
- Puoi aggiungere OAuth in seguito
- OAuth migliora l'esperienza utente

---

## 🔵 PARTE 1: Google Sign-In Setup

### Step 1.1: Crea Progetto Google Cloud

**Tempo: ~2 minuti**

1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Clicca su **"Select a project"** (in alto) → **"NEW PROJECT"**
3. Compila:
   - **Project name**: `TerraGravel`
   - **Organization**: Lascia vuoto (No organization)
4. Clicca **"CREATE"**
5. Aspetta ~30 secondi per la creazione

### Step 1.2: Configura OAuth Consent Screen

**Tempo: ~3 minuti**

1. Nel menu laterale: **"APIs & Services"** → **"OAuth consent screen"**
2. Scegli **"External"** → Clicca **"CREATE"**
3. **App information:**
   ```
   App name: TerraGravel
   User support email: [tua-email@gmail.com]
   App logo: (opzionale, puoi caricare dopo)
   ```

4. **App domain** (opzionale per testing):
   ```
   Application home page: https://terragravel.app (o lascia vuoto)
   Application privacy policy: (lascia vuoto per ora)
   Application terms of service: (lascia vuoto per ora)
   ```

5. **Developer contact information:**
   ```
   Email addresses: [tua-email@gmail.com]
   ```

6. Clicca **"SAVE AND CONTINUE"**

7. **Scopes** → Clicca **"ADD OR REMOVE SCOPES"**
   - Seleziona: `userinfo.email`
   - Seleziona: `userinfo.profile`
   - Clicca **"UPDATE"** → **"SAVE AND CONTINUE"**

8. **Test users** (importante per testing):
   - Clicca **"ADD USERS"**
   - Aggiungi la tua email e altre email di test
   - Clicca **"ADD"** → **"SAVE AND CONTINUE"**

9. **Summary** → Verifica e clicca **"BACK TO DASHBOARD"**

### Step 1.3: Crea OAuth 2.0 Client IDs

Devi creare **3 Client IDs** (uno per piattaforma):

#### A) Web Application (per Backend API)

1. **"APIs & Services"** → **"Credentials"** → **"CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
2. **Application type**: `Web application`
3. **Name**: `TerraGravel Backend`
4. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://tuo-backend.vercel.app
   ```

5. **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/v1/auth/google/callback
   https://tuo-backend.vercel.app/api/v1/auth/google/callback
   ```

6. Clicca **"CREATE"**

7. **Copia e salva:**
   ```
   Client ID: 123456789-abcdefg.apps.googleusercontent.com
   Client Secret: GOCSPX-xxxxxxxxxxxxxx
   ```

#### B) Android Application

1. **"CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
2. **Application type**: `Android`
3. **Name**: `TerraGravel Android`
4. **Package name**: `com.terragravel.app` (o il tuo package)
5. **SHA-1 certificate fingerprint**: [vedi sotto come ottenere]

**Come ottenere SHA-1 fingerprint:**

```bash
# Debug SHA-1 (per development)
cd app/android
./gradlew signingReport

# Cerca "SHA1" nella sezione "Variant: debug"
# Copia la stringa tipo: A1:B2:C3:D4:E5:F6:...
```

**Per release (produzione):**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

6. Clicca **"CREATE"**
7. **Copia Client ID Android**

#### C) iOS Application (opzionale)

Se supporti iOS:

1. **"CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
2. **Application type**: `iOS`
3. **Name**: `TerraGravel iOS`
4. **Bundle ID**: `com.terragravel.app` (dal tuo Xcode)
5. Clicca **"CREATE"**
6. **Copia Client ID iOS**

### Step 1.4: Environment Variables

Aggiungi queste variabili su **Vercel** e nel tuo `.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxx

# Android OAuth Client ID (per Flutter)
GOOGLE_ANDROID_CLIENT_ID=123456789-xyz.apps.googleusercontent.com

# iOS OAuth Client ID (opzionale)
GOOGLE_IOS_CLIENT_ID=123456789-ios.apps.googleusercontent.com
```

---

## 🟠 PARTE 2: Strava OAuth Setup

### Step 2.1: Crea Strava API Application

**Tempo: ~3 minuti**

1. Vai su [Strava Developers](https://developers.strava.com)
2. Clicca **"Create & Manage Your App"**
3. Se non sei loggato, login con il tuo account Strava
4. Clicca **"Create An App"**

5. **Compila il form:**
   ```
   Application Name: TerraGravel
   Category: Social Network
   Club: (lascia vuoto)
   Website: https://terragravel.app (o tuo sito)
   Application Description:
     "TerraGravel is a social platform for gravel cyclists to
      connect, match, and organize rides together."

   Authorization Callback Domain:
     localhost, tuo-backend.vercel.app
   ```

6. Accetta i Terms of Service
7. Clicca **"Create"**

### Step 2.2: Ottieni Credentials

Nella pagina dell'app creata troverai:

```
Client ID: 12345
Client Secret: abc123def456ghi789jkl012mno345pqr678stu
```

**Copia e salva entrambi!**

### Step 2.3: Environment Variables

Aggiungi su **Vercel** e `.env`:

```env
# Strava OAuth
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=abc123def456ghi789jkl012mno345pqr678stu
```

---

## 🗄️ PARTE 3: Database Migration

Esegui la migration per aggiungere i campi OAuth:

### Neon (Produzione)

1. Vai su [Neon Console](https://console.neon.tech)
2. SQL Editor → Incolla:

```sql
-- Add Google OAuth support
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_connected BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
UPDATE users SET google_connected = FALSE WHERE google_connected IS NULL;
```

3. Clicca **"Run"**

### PostgreSQL Locale

```bash
cd backend
psql -d terragravel -f src/db/migrations/001_add_oauth_support.sql
```

---

## 📱 PARTE 4: Flutter Integration

### 4.1 Aggiungi Dipendenze

`pubspec.yaml`:
```yaml
dependencies:
  google_sign_in: ^6.1.6
  flutter_web_auth: ^0.5.0  # Per Strava OAuth
  http: ^1.1.0
  shared_preferences: ^2.2.2
```

### 4.2 Configura Google Sign-In Android

`android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        // ... altre configs

        // Google Sign-In
        resValue "string", "default_web_client_id", "123456789-abcdefg.apps.googleusercontent.com"
    }
}
```

### 4.3 Esempio Google Sign-In Flutter

`lib/services/auth_service.dart`:
```dart
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    // Per iOS/Web aggiungi clientId
    // clientId: 'tuo-client-id.apps.googleusercontent.com',
  );

  Future<Map<String, dynamic>?> signInWithGoogle() async {
    try {
      // Trigger Google Sign-In flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        // User canceled the sign-in
        return null;
      }

      // Obtain auth details
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      // Send to backend
      final response = await http.post(
        Uri.parse('https://tuo-backend.vercel.app/api/v1/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'id_token': googleAuth.idToken,
          'google_id': googleUser.id,
          'email': googleUser.email,
          'name': googleUser.displayName,
          'avatar_url': googleUser.photoUrl,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);

        // Save tokens
        final accessToken = data['data']['accessToken'];
        final refreshToken = data['data']['refreshToken'];

        // TODO: Save to secure storage

        return data['data'];
      } else {
        throw Exception('Google sign-in failed');
      }
    } catch (e) {
      print('Google Sign-In Error: $e');
      return null;
    }
  }

  Future<void> signOut() async {
    await _googleSignIn.signOut();
  }
}
```

### 4.4 Esempio Strava OAuth Flutter

```dart
import 'package:flutter_web_auth/flutter_web_auth.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class StravaAuthService {
  static const stravaClientId = '12345';  // Dal .env o config
  static const redirectUrl = 'terragravel://oauth/callback';
  static const apiBaseUrl = 'https://tuo-backend.vercel.app/api/v1';

  Future<Map<String, dynamic>?> connectStrava() async {
    try {
      // Build Strava OAuth URL
      final authUrl = Uri.https('www.strava.com', '/oauth/mobile/authorize', {
        'client_id': stravaClientId,
        'redirect_uri': redirectUrl,
        'response_type': 'code',
        'approval_prompt': 'auto',
        'scope': 'read,activity:read',
      });

      // Launch browser for OAuth
      final result = await FlutterWebAuth.authenticate(
        url: authUrl.toString(),
        callbackUrlScheme: 'terragravel',
      );

      // Extract code from redirect
      final code = Uri.parse(result).queryParameters['code'];

      if (code == null) {
        throw Exception('No authorization code received');
      }

      // Exchange code for token via backend
      final response = await http.post(
        Uri.parse('$apiBaseUrl/auth/strava'),
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if connecting to existing account
          // 'Authorization': 'Bearer $accessToken',
        },
        body: jsonEncode({
          'code': code,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body)['data'];
      } else {
        throw Exception('Strava connection failed');
      }
    } catch (e) {
      print('Strava OAuth Error: $e');
      return null;
    }
  }
}
```

### 4.5 UI Example - Login Screen

```dart
class LoginScreen extends StatelessWidget {
  final AuthService _authService = AuthService();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // App Logo
            Text('TerraGravel', style: TextStyle(fontSize: 32)),
            SizedBox(height: 48),

            // Google Sign-In Button
            ElevatedButton.icon(
              onPressed: () async {
                final result = await _authService.signInWithGoogle();
                if (result != null) {
                  // Navigate to home
                  Navigator.pushReplacementNamed(context, '/home');
                }
              },
              icon: Icon(Icons.g_mobiledata),
              label: Text('Continue with Google'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                minimumSize: Size(250, 50),
              ),
            ),

            SizedBox(height: 16),

            // Strava Sign-In Button
            ElevatedButton.icon(
              onPressed: () async {
                final result = await StravaAuthService().connectStrava();
                if (result != null) {
                  Navigator.pushReplacementNamed(context, '/home');
                }
              },
              icon: Icon(Icons.directions_bike),
              label: Text('Continue with Strava'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFFFC4C02), // Strava orange
                minimumSize: Size(250, 50),
              ),
            ),

            SizedBox(height: 24),

            // OR divider
            Row(
              children: [
                Expanded(child: Divider()),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: Text('OR'),
                ),
                Expanded(child: Divider()),
              ],
            ),

            SizedBox(height: 24),

            // Email/Password Login
            TextButton(
              onPressed: () {
                Navigator.pushNamed(context, '/email-login');
              },
              child: Text('Sign in with Email'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 🧪 Testing

### Test Google Sign-In

1. Assicurati di aver aggiunto la tua email come "Test User" in Google Cloud Console
2. Testa su dispositivo reale (emulatore può dare problemi)
3. Verifica che l'email ricevuta dal backend corrisponda

### Test Strava OAuth

1. Usa un account Strava reale (necessario per OAuth)
2. Verifica che il redirect URL sia configurato correttamente
3. Controlla i permessi richiesti (read, activity:read)

---

## 🔒 Sicurezza

### Best Practices

1. **MAI committare secrets nel codice**
   ```bash
   # .gitignore
   .env
   android/key.properties
   ios/Runner/GoogleService-Info.plist
   ```

2. **Usa environment variables**
   ```dart
   // lib/config/app_config.dart
   class AppConfig {
     static const googleClientId = String.fromEnvironment('GOOGLE_CLIENT_ID');
     static const stravaClientId = String.fromEnvironment('STRAVA_CLIENT_ID');
   }
   ```

3. **Verifica token sul backend**
   - Il backend deve sempre verificare i token OAuth
   - Non fidarti ciecamente dei dati dal client

4. **Rate limiting**
   - Già implementato nel backend
   - Protegge da abuse

---

## ❓ FAQ

**Q: Devo implementare OAuth subito?**
A: No, il backend funziona già con email/password. OAuth è opzionale.

**Q: Posso usare solo Google senza Strava?**
A: Sì, sono indipendenti. Implementa solo quello che ti serve.

**Q: Quanto costa Google OAuth?**
A: Gratuito fino a un numero molto alto di utenti.

**Q: Devo pubblicare l'app per usare OAuth?**
A: No, puoi testare in modalità "Testing" con utenti specifici.

**Q: Cosa succede se un utente si registra con email e poi con Google?**
A: Il backend collega automaticamente gli account usando l'email come chiave.

---

## 📊 Riepilogo Environment Variables

### Backend (.env e Vercel)

```env
# Existing
NODE_ENV=production
DATABASE_URL=postgres://...
JWT_SECRET=...

# Google OAuth (opzionale)
GOOGLE_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# Strava OAuth (opzionale)
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=abc123...

# Android (per Flutter config)
GOOGLE_ANDROID_CLIENT_ID=123456789-android.apps.googleusercontent.com

# iOS (opzionale)
GOOGLE_IOS_CLIENT_ID=123456789-ios.apps.googleusercontent.com
```

---

## ✅ Checklist Setup

### Google OAuth
- [ ] Google Cloud Project creato
- [ ] OAuth consent screen configurato
- [ ] Test users aggiunti
- [ ] Web Client ID creato
- [ ] Android Client ID creato (con SHA-1)
- [ ] Client ID e Secret salvati
- [ ] Environment variables aggiunte a Vercel
- [ ] Database migration eseguita
- [ ] Flutter package installato
- [ ] Google Sign-In testato

### Strava OAuth
- [ ] Strava API App creata
- [ ] Client ID e Secret salvati
- [ ] Callback URL configurato
- [ ] Environment variables aggiunte
- [ ] Flutter package installato
- [ ] Strava OAuth testato

---

**Tempo totale setup:**
- Google: ~15 minuti
- Strava: ~10 minuti
- Flutter: ~30 minuti
- **Totale: ~1 ora**

---

**Hai domande?** Consulta la documentazione ufficiale:
- [Google Sign-In Docs](https://developers.google.com/identity/sign-in/android/start)
- [Strava API Docs](https://developers.strava.com/docs/getting-started/)
