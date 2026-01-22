# Technical Architecture - TerraGravel
**Versione:** 1.0
**Data:** 22 Gennaio 2026
**Status:** Design Draft

## Overview

Questo documento descrive l'architettura tecnica dell'applicazione TerraGravel, con particolare focus sul sistema **RideMatch** (matching ciclisti). L'architettura è progettata per essere scalabile, performante e privacy-compliant (GDPR).

---

## Stack Tecnologico

### Frontend
- **Framework:** Flutter 3.x (Dart)
- **State Management:** Riverpod / BLoC pattern
- **Routing:** go_router
- **Maps:** Mapbox SDK for Flutter
- **HTTP Client:** Dio + Retrofit
- **Local Storage:** Hive / SQLite
- **Caching:** flutter_cache_manager

### Backend
- **API Server:** Node.js (Express) o Go (Gin/Fiber)
- **Database:** PostgreSQL 15+ con estensione PostGIS
- **Cache:** Redis 7+
- **Message Queue:** RabbitMQ / AWS SQS (per background jobs)
- **Storage:** AWS S3 / MinIO (foto profili, GPX tracks)
- **Search:** Elasticsearch (opzionale per full-text search POI)

### DevOps
- **Hosting:** AWS / Google Cloud Platform
- **Container:** Docker + Kubernetes
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry (error tracking), DataDog (metrics)

---

## Database Schema (PostgreSQL + PostGIS)

### Estensioni Richieste
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Per fuzzy search
```

---

### 1. Tabella `users`
**L'anagrafica base dell'utente**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    -- Posizione approssimativa (arrotondata a 1km per privacy)
    location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_seen_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE
);

-- Indici
CREATE INDEX idx_users_location ON users USING GIST(location);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_seen ON users(last_seen_at);
```

**Note:**
- `location` usa il tipo `GEOGRAPHY` di PostGIS per calcoli di distanza precisi su coordinate GPS
- `GIST` index è fondamentale per query geospaziali veloci

---

### 2. Tabella `cyclist_profile`
**La "Carta d'Identità" Ciclistica - Dati per il matching**

```sql
CREATE TYPE ride_vibe AS ENUM ('CHILL', 'SPORT', 'RACE');
CREATE TYPE bike_type AS ENUM ('GRAVEL_MUSCLE', 'GRAVEL_EBIKE', 'MTB', 'ROAD');

CREATE TABLE cyclist_profile (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    -- Dati Prestazionali
    avg_speed_gravel DECIMAL(4,1), -- es. 22.5 km/h (media su sterrato)
    avg_speed_updated_at TIMESTAMP, -- Quando è stato calcolato

    -- Preferenze
    ride_vibe ride_vibe NOT NULL DEFAULT 'SPORT',
    bike_type bike_type NOT NULL,

    -- Bio
    bio TEXT CHECK (LENGTH(bio) <= 120), -- Max 120 caratteri

    -- Disponibilità
    available_weekend BOOLEAN DEFAULT TRUE,
    available_weekday BOOLEAN DEFAULT FALSE,

    -- Filtri/Preferenze Match
    max_distance_km INTEGER DEFAULT 20, -- Raggio di ricerca preferito
    min_speed_preference DECIMAL(4,1), -- Velocità minima partner
    max_speed_preference DECIMAL(4,1), -- Velocità massima partner

    -- Integrazione Strava
    strava_athlete_id BIGINT,
    strava_access_token TEXT,
    strava_refresh_token TEXT,
    strava_verified BOOLEAN DEFAULT FALSE,

    -- Metadati
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indici
CREATE INDEX idx_cyclist_profile_vibe ON cyclist_profile(ride_vibe);
CREATE INDEX idx_cyclist_profile_bike_type ON cyclist_profile(bike_type);
CREATE INDEX idx_cyclist_profile_avg_speed ON cyclist_profile(avg_speed_gravel);
```

**Logica Calcolo `avg_speed_gravel`:**
- Calcolata automaticamente dalle ultime 10 uscite registrate su TerraGravel
- Se integrato Strava: media delle ultime 10 attività con tag "Gravel"
- Ricalcolata ogni settimana via background job

---

### 3. Tabella `swipes`
**Le interazioni di swipe (cronologia)**

```sql
CREATE TYPE swipe_action AS ENUM ('LIKE', 'PASS', 'SUPERLIKE');

CREATE TABLE swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action swipe_action NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Constraint: Un utente può swipare un target solo una volta
    UNIQUE(actor_id, target_id)
);

-- Indici
CREATE INDEX idx_swipes_actor ON swipes(actor_id, created_at DESC);
CREATE INDEX idx_swipes_target ON swipes(target_id);
CREATE INDEX idx_swipes_action ON swipes(action) WHERE action = 'SUPERLIKE'; -- Per notifiche
```

**Note:**
- `UNIQUE(actor_id, target_id)` previene swipe duplicati
- Index specifico su `SUPERLIKE` per notifiche push efficienti

---

### 4. Tabella `matches`
**Il risultato: match reciproci**

```sql
CREATE TYPE match_status AS ENUM ('ACTIVE', 'UNMATCHED', 'BLOCKED');

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status match_status NOT NULL DEFAULT 'ACTIVE',
    matched_at TIMESTAMP DEFAULT NOW(),
    unmatched_at TIMESTAMP,
    unmatched_by UUID REFERENCES users(id),

    -- Per ordinamento chat recenti
    last_message_at TIMESTAMP,

    -- Constraint: Evita match duplicati (A-B e B-A sono lo stesso match)
    CHECK (user_a_id < user_b_id),
    UNIQUE(user_a_id, user_b_id)
);

-- Indici
CREATE INDEX idx_matches_user_a ON matches(user_a_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_matches_user_b ON matches(user_b_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_matches_last_message ON matches(last_message_at DESC NULLS LAST);
```

**Logica Creazione Match:**
```sql
-- Trigger automatico: quando user B fa LIKE a user A che aveva già fatto LIKE a B
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
    -- Se il target ha già fatto LIKE all'actor
    IF EXISTS (
        SELECT 1 FROM swipes
        WHERE actor_id = NEW.target_id
        AND target_id = NEW.actor_id
        AND action IN ('LIKE', 'SUPERLIKE')
    ) THEN
        -- Crea il match (ordina gli ID per rispettare il CHECK constraint)
        INSERT INTO matches (user_a_id, user_b_id)
        VALUES (
            LEAST(NEW.actor_id, NEW.target_id),
            GREATEST(NEW.actor_id, NEW.target_id)
        )
        ON CONFLICT (user_a_id, user_b_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_match
AFTER INSERT ON swipes
FOR EACH ROW
WHEN (NEW.action IN ('LIKE', 'SUPERLIKE'))
EXECUTE FUNCTION create_match_on_mutual_like();
```

---

### 5. Tabella `ride_feedback`
**Sistema di rating post-ride (nascosto)**

```sql
CREATE TABLE ride_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Feedback
    showed_up BOOLEAN NOT NULL, -- Si è presentato?
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    was_appropriate BOOLEAN DEFAULT TRUE, -- Comportamento appropriato?

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(reviewer_id, reviewed_id, match_id)
);

-- Indici
CREATE INDEX idx_ride_feedback_reviewed ON ride_feedback(reviewed_id);
```

**Logica Reputazione:**
- **No-Show Detection:** Se `showed_up = FALSE` per 3+ volte → account sospeso
- **Low Rating:** Media rating < 2.0 → visibilità ridotta nello stack
- **Inappropriate:** Se `was_appropriate = FALSE` → review manuale

```sql
-- View per calcolare reputazione utente
CREATE VIEW user_reputation AS
SELECT
    reviewed_id AS user_id,
    COUNT(*) AS total_feedbacks,
    SUM(CASE WHEN showed_up THEN 1 ELSE 0 END) AS show_count,
    SUM(CASE WHEN NOT showed_up THEN 1 ELSE 0 END) AS no_show_count,
    AVG(rating) AS avg_rating,
    SUM(CASE WHEN NOT was_appropriate THEN 1 ELSE 0 END) AS inappropriate_count
FROM ride_feedback
GROUP BY reviewed_id;
```

---

### 6. Tabella `recent_rides`
**Ultime uscite (Social Proof sulla card)**

```sql
CREATE TABLE recent_rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ride_name VARCHAR(255),
    distance_km DECIMAL(6,2),
    difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 4), -- 1-4 pallini
    ride_date DATE,
    gpx_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indici
CREATE INDEX idx_recent_rides_user ON recent_rides(user_id, ride_date DESC);
```

**Logica:**
- Ogni volta che un utente completa un giro, viene inserito qui
- La query per la card prende solo le ultime 3 uscite:
```sql
SELECT * FROM recent_rides
WHERE user_id = $user_id
ORDER BY ride_date DESC
LIMIT 3;
```

---

## Algoritmo di Matching

### Query Principale: `find_potential_matches`

Questa è la query SQL che viene eseguita quando l'utente apre RideMatch:

```sql
-- Input: current_user_id, max_radius_km (es. 20)
WITH current_user_data AS (
    SELECT
        u.location,
        cp.avg_speed_gravel,
        cp.ride_vibe,
        cp.bike_type,
        cp.min_speed_preference,
        cp.max_speed_preference
    FROM users u
    JOIN cyclist_profile cp ON u.id = cp.user_id
    WHERE u.id = $current_user_id
),
already_swiped AS (
    SELECT target_id FROM swipes WHERE actor_id = $current_user_id
)
SELECT
    u.id,
    u.username,
    u.avatar_url,
    EXTRACT(YEAR FROM AGE(NOW(), u.created_at)) AS age_estimate,
    cp.avg_speed_gravel,
    cp.ride_vibe,
    cp.bike_type,
    cp.bio,
    ST_Distance(u.location, cud.location) / 1000 AS distance_km,
    cp.strava_verified,
    -- Score di compatibilità (0-100)
    (
        -- Distanza (più vicino = meglio): 30 punti max
        (1 - LEAST(ST_Distance(u.location, cud.location) / 1000 / $max_radius_km, 1)) * 30 +

        -- Velocità simile (più vicino = meglio): 40 punti max
        (1 - LEAST(ABS(cp.avg_speed_gravel - cud.avg_speed_gravel) / 10, 1)) * 40 +

        -- Stesso vibe: 20 punti bonus
        CASE WHEN cp.ride_vibe = cud.ride_vibe THEN 20 ELSE 0 END +

        -- Attività recente (last_seen < 7 giorni): 10 punti bonus
        CASE WHEN u.last_seen_at > NOW() - INTERVAL '7 days' THEN 10 ELSE 0 END
    ) AS compatibility_score
FROM users u
JOIN cyclist_profile cp ON u.id = cp.user_id
CROSS JOIN current_user_data cud
WHERE
    u.id != $current_user_id
    AND u.is_active = TRUE
    AND u.is_banned = FALSE
    -- Filtro geografico (PostGIS)
    AND ST_DWithin(u.location, cud.location, $max_radius_km * 1000)
    -- Filtro velocità
    AND cp.avg_speed_gravel BETWEEN
        cud.min_speed_preference AND cud.max_speed_preference
    -- Esclude già swipati
    AND u.id NOT IN (SELECT target_id FROM already_swiped)
ORDER BY compatibility_score DESC
LIMIT 50; -- Pre-carichiamo 50 profili
```

**Spiegazione:**
1. **CTE `current_user_data`**: Carica i dati dell'utente loggato
2. **CTE `already_swiped`**: Lista di utenti già visualizzati (evita duplicati)
3. **Filtro `ST_DWithin`**: Query geospaziale super-performante (usa indice GIST)
4. **`compatibility_score`**: Algoritmo di ranking pesato:
   - Distanza: 30% (più vicino è meglio)
   - Velocità simile: 40% (massima priorità)
   - Stesso vibe: 20% (bonus se match perfetto)
   - Attività recente: 10% (utenti attivi hanno priorità)

---

## API Design (REST Endpoints)

### Authentication
```
POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/refresh-token
POST /api/v1/auth/logout
```

### User Profile
```
GET    /api/v1/users/me
PATCH  /api/v1/users/me
PUT    /api/v1/users/me/avatar (multipart/form-data)
DELETE /api/v1/users/me
```

### Cyclist Profile
```
GET   /api/v1/cyclist-profile
PUT   /api/v1/cyclist-profile
POST  /api/v1/cyclist-profile/strava/connect
GET   /api/v1/cyclist-profile/strava/sync
```

### RideMatch - Core
```
GET   /api/v1/ridematch/stack
      Query params: ?limit=50
      Response: Array[CyclistCard]

POST  /api/v1/ridematch/swipe
      Body: { "target_id": "uuid", "action": "LIKE|PASS|SUPERLIKE" }
      Response: { "matched": boolean, "match_id": "uuid?" }

GET   /api/v1/ridematch/matches
      Query params: ?status=ACTIVE&limit=20&offset=0
      Response: Array[Match]

POST  /api/v1/ridematch/unmatch
      Body: { "match_id": "uuid" }
      Response: { "success": true }
```

### RideMatch - Feedback
```
POST  /api/v1/ridematch/feedback
      Body: {
        "match_id": "uuid",
        "reviewed_id": "uuid",
        "showed_up": boolean,
        "rating": 1-5,
        "was_appropriate": boolean
      }
```

### RideMatch - Filters
```
GET   /api/v1/ridematch/filters
      Response: Current user filters

PUT   /api/v1/ridematch/filters
      Body: {
        "max_distance_km": 20,
        "min_speed_preference": 18,
        "max_speed_preference": 26,
        "ride_vibe": "SPORT",
        "bike_type": ["GRAVEL_MUSCLE", "GRAVEL_EBIKE"]
      }
```

---

## Flutter Implementation

### Modello Dati (Dart Classes)

```dart
// lib/models/cyclist_card.dart
import 'package:flutter/material.dart';

enum RideVibe { CHILL, SPORT, RACE }
enum BikeType { GRAVEL_MUSCLE, GRAVEL_EBIKE, MTB, ROAD }

class CyclistCard {
  final String id;
  final String username;
  final String avatarUrl;
  final int ageEstimate;
  final double avgSpeedGravel;
  final RideVibe rideVibe;
  final BikeType bikeType;
  final String? bio;
  final double distanceKm;
  final bool stravaVerified;
  final List<RecentRide> recentRides;
  final double compatibilityScore;

  CyclistCard({
    required this.id,
    required this.username,
    required this.avatarUrl,
    required this.ageEstimate,
    required this.avgSpeedGravel,
    required this.rideVibe,
    required this.bikeType,
    this.bio,
    required this.distanceKm,
    required this.stravaVerified,
    required this.recentRides,
    required this.compatibilityScore,
  });

  factory CyclistCard.fromJson(Map<String, dynamic> json) {
    return CyclistCard(
      id: json['id'],
      username: json['username'],
      avatarUrl: json['avatar_url'],
      ageEstimate: json['age_estimate'],
      avgSpeedGravel: (json['avg_speed_gravel'] as num).toDouble(),
      rideVibe: RideVibe.values.byName(json['ride_vibe']),
      bikeType: BikeType.values.byName(json['bike_type']),
      bio: json['bio'],
      distanceKm: (json['distance_km'] as num).toDouble(),
      stravaVerified: json['strava_verified'] ?? false,
      recentRides: (json['recent_rides'] as List)
          .map((r) => RecentRide.fromJson(r))
          .toList(),
      compatibilityScore: (json['compatibility_score'] as num).toDouble(),
    );
  }

  // Getter per UI
  Color get vibeColor {
    switch (rideVibe) {
      case RideVibe.CHILL:
        return Colors.green;
      case RideVibe.SPORT:
        return Colors.orange;
      case RideVibe.RACE:
        return Colors.red;
    }
  }

  String get vibeLabel {
    switch (rideVibe) {
      case RideVibe.CHILL:
        return 'Chill/Beer';
      case RideVibe.SPORT:
        return 'Sport';
      case RideVibe.RACE:
        return 'Race/Watts';
    }
  }

  IconData get bikeIcon {
    switch (bikeType) {
      case BikeType.GRAVEL_EBIKE:
        return Icons.electric_bike;
      default:
        return Icons.pedal_bike;
    }
  }

  String get distanceLabel {
    if (distanceKm < 1) {
      return '< 1 km da te';
    } else {
      return '${distanceKm.toStringAsFixed(0)} km da te';
    }
  }
}

class RecentRide {
  final String rideName;
  final double distanceKm;
  final int difficulty; // 1-4

  RecentRide({
    required this.rideName,
    required this.distanceKm,
    required this.difficulty,
  });

  factory RecentRide.fromJson(Map<String, dynamic> json) {
    return RecentRide(
      rideName: json['ride_name'],
      distanceKm: (json['distance_km'] as num).toDouble(),
      difficulty: json['difficulty'],
    );
  }

  String get difficultyDots {
    return '●' * difficulty + '○' * (4 - difficulty);
  }
}
```

### Widget: Card Swipeable

```dart
// lib/widgets/ridematch/cyclist_card_widget.dart
import 'package:flutter/material.dart';
import 'package:terra_gravel/models/cyclist_card.dart';

class CyclistCardWidget extends StatelessWidget {
  final CyclistCard cyclist;

  const CyclistCardWidget({Key? key, required this.cyclist}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Column(
          children: [
            // Hero Image (60% dello schermo)
            Expanded(
              flex: 6,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    cyclist.avatarUrl,
                    fit: BoxFit.cover,
                  ),
                  // Gradient overlay per leggibilità testo
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      height: 120,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withOpacity(0.7),
                          ],
                        ),
                      ),
                    ),
                  ),
                  // Badge Strava Verified
                  if (cyclist.stravaVerified)
                    Positioned(
                      top: 16,
                      right: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.green,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.verified, color: Colors.white, size: 16),
                            SizedBox(width: 4),
                            Text(
                              'Strava',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Info Card (40% dello schermo)
            Expanded(
              flex: 4,
              child: Container(
                color: Colors.white,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Nome + Età + Distanza
                    Row(
                      children: [
                        Text(
                          '${cyclist.username}, ${cyclist.ageEstimate}',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '• ${cyclist.distanceLabel}',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // I 3 Badge di Compatibilità
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildBadge(
                          icon: Icons.speed,
                          label: '${cyclist.avgSpeedGravel.toStringAsFixed(0)} km/h',
                          sublabel: 'Motore',
                          color: Colors.blue,
                        ),
                        _buildBadge(
                          icon: cyclist.rideVibe == RideVibe.CHILL
                              ? Icons.emoji_food_beverage
                              : Icons.bolt,
                          label: cyclist.vibeLabel,
                          sublabel: 'Spirito',
                          color: cyclist.vibeColor,
                        ),
                        _buildBadge(
                          icon: cyclist.bikeIcon,
                          label: cyclist.bikeType == BikeType.GRAVEL_EBIKE
                              ? 'E-Gravel'
                              : 'Muscle',
                          sublabel: 'Bici',
                          color: Colors.purple,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Bio
                    if (cyclist.bio != null)
                      Text(
                        '"${cyclist.bio}"',
                        style: TextStyle(
                          fontSize: 14,
                          fontStyle: FontStyle.italic,
                          color: Colors.grey[700],
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),

                    const Spacer(),

                    // Ultimi Giri
                    if (cyclist.recentRides.isNotEmpty) ...[
                      const Divider(),
                      const Text(
                        'ULTIMI GIRI:',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ...cyclist.recentRides.take(2).map((ride) => Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Row(
                              children: [
                                Text(
                                  '• ${ride.rideName}',
                                  style: const TextStyle(fontSize: 12),
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const Spacer(),
                                Text(
                                  '${ride.distanceKm.toStringAsFixed(0)}km',
                                  style: const TextStyle(fontSize: 12),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  ride.difficultyDots,
                                  style: const TextStyle(fontSize: 12),
                                ),
                              ],
                            ),
                          )),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge({
    required IconData icon,
    required String label,
    required String sublabel,
    required Color color,
  }) {
    return Container(
      width: 90,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color, width: 2),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: color,
            ),
            textAlign: TextAlign.center,
          ),
          Text(
            sublabel,
            style: TextStyle(
              fontSize: 10,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}
```

### Service Layer: RideMatch API

```dart
// lib/services/ridematch_service.dart
import 'package:dio/dio.dart';
import 'package:terra_gravel/models/cyclist_card.dart';

class RideMatchService {
  final Dio _dio;

  RideMatchService(this._dio);

  Future<List<CyclistCard>> getStack({int limit = 50}) async {
    final response = await _dio.get(
      '/api/v1/ridematch/stack',
      queryParameters: {'limit': limit},
    );

    return (response.data as List)
        .map((json) => CyclistCard.fromJson(json))
        .toList();
  }

  Future<Map<String, dynamic>> swipe({
    required String targetId,
    required String action, // 'LIKE', 'PASS', 'SUPERLIKE'
  }) async {
    final response = await _dio.post(
      '/api/v1/ridematch/swipe',
      data: {
        'target_id': targetId,
        'action': action,
      },
    );

    return response.data;
  }

  Future<void> submitFeedback({
    required String matchId,
    required String reviewedId,
    required bool showedUp,
    required int rating,
    required bool wasAppropriate,
  }) async {
    await _dio.post(
      '/api/v1/ridematch/feedback',
      data: {
        'match_id': matchId,
        'reviewed_id': reviewedId,
        'showed_up': showedUp,
        'rating': rating,
        'was_appropriate': wasAppropriate,
      },
    );
  }
}
```

---

## Gamification Features

### 1. "Il Garage" - Flip Card per Vedere la Bici
**Implementazione:**
- Tap sulla foto → Flip animation (180°)
- Retro della card mostra la foto della bici dell'utente
- Ottimo icebreaker per conversazioni

**Flutter Package:** `flip_card: ^0.7.0`

```dart
FlipCard(
  front: CyclistCardWidget(cyclist: cyclist),
  back: BikeGarageWidget(cyclist: cyclist), // Foto bici + specs
)
```

### 2. Badge "Disponibilità"
**UI Design:**
```
🟢 Disponibile questo weekend
🟡 Solo chat (non pedalo ora)
🔴 In pausa
```

**Database:**
```sql
ALTER TABLE cyclist_profile ADD COLUMN availability_status VARCHAR(20) DEFAULT 'AVAILABLE';
-- Values: 'AVAILABLE', 'CHAT_ONLY', 'PAUSED'
```

### 3. Streak System (Retention Boost)
**Concept:** "Hai matchato con 5 ciclisti questa settimana! 🔥"

**Tabella:**
```sql
CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    total_matches INTEGER DEFAULT 0,
    total_rides_completed INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0, -- Giorni consecutivi con match
    last_active_date DATE
);
```

---

## Performance Optimization

### 1. Caching Strategy (Redis)
**Cosa cachare:**
- Stack di 50 profili pre-caricato (TTL: 12h)
- Profilo utente (TTL: 5min)
- Lista match attivi (TTL: 1min)

**Redis Keys:**
```
ridematch:stack:{user_id} → List[cyclist_card_json]
user:profile:{user_id} → JSON
user:matches:{user_id} → List[match_id]
```

### 2. Lazy Loading Recent Rides
**Problema:** Caricare 3 uscite per ogni card nello stack (50 card) = 150 query
**Soluzione:** Query JOIN ottimizzata con LATERAL

```sql
SELECT
    u.*,
    cp.*,
    rr.recent_rides
FROM users u
JOIN cyclist_profile cp ON u.id = cp.user_id
LEFT JOIN LATERAL (
    SELECT json_agg(
        json_build_object(
            'ride_name', ride_name,
            'distance_km', distance_km,
            'difficulty', difficulty
        )
    ) AS recent_rides
    FROM recent_rides
    WHERE user_id = u.id
    ORDER BY ride_date DESC
    LIMIT 3
) rr ON TRUE
WHERE ... -- Altri filtri
```

### 3. Background Jobs (Queue)
**Job 1:** `calculate_avg_speed` (ogni settimana)
- Recalcola `avg_speed_gravel` per tutti gli utenti attivi

**Job 2:** `regenerate_stack` (ogni 12h)
- Pre-calcola e cacha stack di 50 profili per utenti attivi

**Job 3:** `send_match_notifications` (real-time)
- Notifica push quando c'è un match

---

## Security & Privacy

### 1. Location Privacy
**Mai salvare posizione esatta:**
```javascript
// Backend: Arrotonda coordinate a 1km
function roundLocationTo1km(lat, lon) {
    const precision = 0.01; // ~1km
    return {
        lat: Math.round(lat / precision) * precision,
        lon: Math.round(lon / precision) * precision
    };
}
```

### 2. Rate Limiting
**Prevenzione Spam/Bot:**
```
POST /api/v1/ridematch/swipe → Max 200 swipes/giorno
POST /api/v1/ridematch/feedback → Max 10 feedback/giorno
```

### 3. Image Moderation
**Validazione Upload Avatar:**
- **Client-side:** Controllo aspect ratio, dimensione max 5MB
- **Server-side:**
  - Scan con Clarifai/AWS Rekognition per contenuto inappropriato
  - Verifica presenza di bici nella foto (bonus points se rilevata)

### 4. E2E Encryption Chat (Fase 2)
**Protocol:** Signal Protocol via `libsignal-client`
- Ogni match crea una chat room con encryption keys
- Messaggi salvati criptati, solo client ha chiavi di decifratura

---

## Monitoring & Analytics

### KPI Dashboard (per Product Team)
**Metriche Real-Time:**
- Total Swipes/giorno
- Match Rate (% swipe → match)
- Conversion Rate (% match → ride completato)
- No-Show Rate
- Avg Rating

**Query Example:**
```sql
-- Match rate ultimi 7 giorni
SELECT
    DATE(created_at) AS date,
    COUNT(*) FILTER (WHERE action IN ('LIKE', 'SUPERLIKE')) AS total_likes,
    COUNT(DISTINCT actor_id) AS unique_users,
    (SELECT COUNT(*) FROM matches WHERE matched_at::DATE = DATE(s.created_at)) AS matches_created
FROM swipes s
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Next Steps - Implementation Roadmap

### Sprint 1 (Week 1-2): Database Setup
- [ ] Setup PostgreSQL + PostGIS
- [ ] Create tables + indexes
- [ ] Write seed data script (100 fake users per testing)

### Sprint 2 (Week 3-4): Backend API
- [ ] Implement authentication (JWT)
- [ ] Build `/ridematch/stack` endpoint
- [ ] Build `/ridematch/swipe` endpoint + trigger match logic
- [ ] Setup Redis caching

### Sprint 3 (Week 5-6): Flutter UI
- [ ] Create `CyclistCard` model
- [ ] Build swipeable card widget
- [ ] Integrate `flutter_card_swiper`
- [ ] Implement match animation

### Sprint 4 (Week 7-8): Polishing
- [ ] Add feedback system
- [ ] Implement filters UI
- [ ] Add Strava OAuth integration
- [ ] Performance testing + optimization

---

## Appendix: Useful SQL Queries

### Query 1: Find Top Matched Users
```sql
SELECT
    u.username,
    COUNT(*) AS total_matches
FROM matches m
JOIN users u ON (u.id = m.user_a_id OR u.id = m.user_b_id)
WHERE m.status = 'ACTIVE'
GROUP BY u.id, u.username
ORDER BY total_matches DESC
LIMIT 10;
```

### Query 2: Average Compatibility Score by Vibe
```sql
WITH match_scores AS (
    SELECT
        cp1.ride_vibe AS vibe_a,
        cp2.ride_vibe AS vibe_b,
        ABS(cp1.avg_speed_gravel - cp2.avg_speed_gravel) AS speed_diff
    FROM matches m
    JOIN cyclist_profile cp1 ON cp1.user_id = m.user_a_id
    JOIN cyclist_profile cp2 ON cp2.user_id = m.user_b_id
    WHERE m.status = 'ACTIVE'
)
SELECT
    vibe_a,
    vibe_b,
    AVG(speed_diff) AS avg_speed_difference,
    COUNT(*) AS match_count
FROM match_scores
GROUP BY vibe_a, vibe_b
ORDER BY match_count DESC;
```

### Query 3: Detect Suspicious Users (Possible Bots)
```sql
-- Utenti con >100 swipe/giorno negli ultimi 7 giorni
SELECT
    actor_id,
    u.username,
    DATE(s.created_at) AS date,
    COUNT(*) AS swipes_count
FROM swipes s
JOIN users u ON u.id = s.actor_id
WHERE s.created_at > NOW() - INTERVAL '7 days'
GROUP BY actor_id, u.username, DATE(s.created_at)
HAVING COUNT(*) > 100
ORDER BY swipes_count DESC;
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-22
**Author:** TerraGravel Engineering Team
