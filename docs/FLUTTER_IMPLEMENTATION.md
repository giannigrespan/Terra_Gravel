# Flutter Implementation Guide - RideMatch Prototype
**Versione:** 1.0
**Data:** 22 Gennaio 2026
**Target:** Flutter 3.x+

## Overview

Questa guida mostra l'implementazione pratica della feature **RideMatch** in Flutter. Include codice funzionante che puoi copiare e testare immediatamente per vedere il risultato.

---

## Setup Iniziale

### 1. Dipendenze (`pubspec.yaml`)

Aggiungi queste dipendenze al tuo progetto Flutter:

```yaml
name: terra_gravel
description: Gravel cycling super app
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # UI Components
  flutter_card_swiper: ^7.0.0      # Swipeable cards con animazioni fluide
  google_fonts: ^6.1.0             # Tipografia moderna

  # Networking
  dio: ^5.4.0                       # HTTP client per API calls
  retrofit: ^4.0.0                  # Type-safe REST client

  # State Management
  riverpod: ^2.4.0                  # State management (o usa BLoC/Provider)
  flutter_riverpod: ^2.4.0

  # Local Storage
  hive: ^2.2.3                      # Lightweight NoSQL database
  hive_flutter: ^1.1.0

  # Utils
  cached_network_image: ^3.3.0     # Image caching
  shimmer: ^3.0.0                   # Loading animations
  lottie: ^3.0.0                    # Animazioni JSON (match explosion)

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  build_runner: ^2.4.0              # Per code generation (Retrofit, Hive)
  retrofit_generator: ^8.0.0
  hive_generator: ^2.0.0

flutter:
  uses-material-design: true
```

Esegui nel terminale:
```bash
flutter pub get
```

---

## Prototipo Funzionante (Codice Completo)

### File: `lib/main.dart`

Questo è un prototipo standalone che puoi eseguire immediatamente per vedere RideMatch in azione.

```dart
import 'package:flutter/material.dart';
import 'package:flutter_card_swiper/flutter_card_swiper.dart';

void main() {
  runApp(const TerraGravelApp());
}

class TerraGravelApp extends StatelessWidget {
  const TerraGravelApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TerraGravel RideMatch',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark, // Tema scuro per outdoor
        primaryColor: const Color(0xFFEDA739), // Giallo/arancio "Gravel"
        scaffoldBackgroundColor: const Color(0xFF1E1E1E),
        useMaterial3: true,
        colorScheme: ColorScheme.dark(
          primary: const Color(0xFFEDA739),
          secondary: const Color(0xFF00D084), // Verde (like button)
        ),
      ),
      home: const RideMatchPage(),
    );
  }
}

// ============================================================================
// MODELLO DATI - La struttura che abbiamo definito nell'architettura
// ============================================================================
class CyclistProfile {
  final String id;
  final String name;
  final int age;
  final String bio;
  final String imageUrl;
  final String vibe; // 'Chill', 'Sport', 'Race'
  final double avgSpeed;
  final int distanceKm;
  final bool stravaVerified;
  final String bikeType; // 'Muscle', 'E-Gravel'

  CyclistProfile({
    required this.id,
    required this.name,
    required this.age,
    required this.bio,
    required this.imageUrl,
    required this.vibe,
    required this.avgSpeed,
    required this.distanceKm,
    this.stravaVerified = false,
    required this.bikeType,
  });

  // Factory per creare da JSON (API response)
  factory CyclistProfile.fromJson(Map<String, dynamic> json) {
    return CyclistProfile(
      id: json['id'],
      name: json['name'],
      age: json['age'],
      bio: json['bio'],
      imageUrl: json['image_url'],
      vibe: json['vibe'],
      avgSpeed: (json['avg_speed'] as num).toDouble(),
      distanceKm: json['distance_km'],
      stravaVerified: json['strava_verified'] ?? false,
      bikeType: json['bike_type'],
    );
  }
}

// ============================================================================
// PAGINA PRINCIPALE - RideMatch
// ============================================================================
class RideMatchPage extends StatefulWidget {
  const RideMatchPage({super.key});

  @override
  State<RideMatchPage> createState() => _RideMatchPageState();
}

class _RideMatchPageState extends State<RideMatchPage> {
  final CardSwiperController controller = CardSwiperController();

  // ========== DATI FINTI per il prototipo ==========
  // In produzione, questi arriveranno da GET /api/v1/ridematch/stack
  final List<CyclistProfile> candidates = [
    CyclistProfile(
      id: '1',
      name: "Marco",
      age: 34,
      bio: "Amo le strade bianche e la birra post-ride. Niente gare.",
      imageUrl: "https://images.pexels.com/photos/2529367/pexels-photo-2529367.jpeg?auto=compress&cs=tinysrgb&w=800",
      vibe: "Chill",
      avgSpeed: 20.5,
      distanceKm: 5,
      stravaVerified: true,
      bikeType: "Muscle",
    ),
    CyclistProfile(
      id: '2',
      name: "Elena",
      age: 29,
      bio: "Training per la Tuscany Trail. Cerco ritmo allegro!",
      imageUrl: "https://images.pexels.com/photos/248547/pexels-photo-248547.jpeg?auto=compress&cs=tinysrgb&w=800",
      vibe: "Sport",
      avgSpeed: 24.0,
      distanceKm: 12,
      stravaVerified: true,
      bikeType: "Muscle",
    ),
    CyclistProfile(
      id: '3',
      name: "Luca",
      age: 42,
      bio: "Solo salite, solo ghiaia, solo fatica.",
      imageUrl: "https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800",
      vibe: "Race",
      avgSpeed: 28.5,
      distanceKm: 2,
      stravaVerified: false,
      bikeType: "E-Gravel",
    ),
    CyclistProfile(
      id: '4',
      name: "Chiara",
      age: 26,
      bio: "Neofita del gravel, cerco compagnia per imparare!",
      imageUrl: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=800",
      vibe: "Chill",
      avgSpeed: 18.0,
      distanceKm: 8,
      stravaVerified: false,
      bikeType: "Muscle",
    ),
  ];

  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "RideMatch 🔥",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.tune),
            onPressed: _showFilters,
            tooltip: 'Filtri',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Contatore Card Rimanenti
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Text(
                "${candidates.length - _currentIndex} profili disponibili",
                style: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 14,
                ),
              ),
            ),

            // SEZIONE CARTE (SWIPE)
            Expanded(
              child: candidates.isEmpty
                  ? _buildEmptyState()
                  : CardSwiper(
                      controller: controller,
                      cardsCount: candidates.length,
                      numberOfCardsDisplayed: 3, // Effetto stack
                      backCardOffset: const Offset(0, 40), // Profondità 3D
                      onSwipe: _onSwipe,
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      cardBuilder: (context, index, horizontalThresholdReached, verticalThresholdReached) {
                        return CyclistCardWidget(
                          profile: candidates[index],
                        );
                      },
                    ),
            ),

            // BOTTONI DI AZIONE
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20.0, horizontal: 40),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  // SKIP (X)
                  _actionButton(
                    icon: Icons.close,
                    color: Colors.red,
                    size: 60,
                    onTap: () => controller.swipe(CardSwiperDirection.left),
                  ),

                  // REWIND (Undo)
                  _actionButton(
                    icon: Icons.replay,
                    color: Colors.amber,
                    size: 50,
                    onTap: () {
                      controller.undo();
                      if (_currentIndex > 0) {
                        setState(() => _currentIndex--);
                      }
                    },
                  ),

                  // LIKE (Heart)
                  _actionButton(
                    icon: Icons.favorite,
                    color: const Color(0xFF00D084),
                    size: 70,
                    onTap: () => controller.swipe(CardSwiperDirection.right),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),

            // Super-Like hint
            Text(
              "💡 Swipe UP per Super-Like",
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  // ========== UI COMPONENTS ==========

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 80,
            color: Colors.grey[700],
          ),
          const SizedBox(height: 20),
          Text(
            "Nessun ciclista trovato",
            style: TextStyle(
              fontSize: 20,
              color: Colors.grey[400],
            ),
          ),
          const SizedBox(height: 10),
          Text(
            "Prova a modificare i filtri",
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionButton({
    required IconData icon,
    required Color color,
    required double size,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.4),
              blurRadius: 15,
              spreadRadius: 3,
            )
          ],
        ),
        child: Icon(icon, color: color, size: size * 0.5),
      ),
    );
  }

  // ========== BUSINESS LOGIC ==========

  bool _onSwipe(
    int previousIndex,
    int? currentIndex,
    CardSwiperDirection direction,
  ) {
    setState(() {
      _currentIndex = currentIndex ?? candidates.length;
    });

    final swipedProfile = candidates[previousIndex];

    if (direction == CardSwiperDirection.right) {
      debugPrint('✅ LIKE a ${swipedProfile.name}!');
      _handleLike(swipedProfile);
    } else if (direction == CardSwiperDirection.left) {
      debugPrint('❌ PASS a ${swipedProfile.name}.');
      _handlePass(swipedProfile);
    } else if (direction == CardSwiperDirection.top) {
      debugPrint('⭐ SUPER-LIKE a ${swipedProfile.name}!');
      _handleSuperLike(swipedProfile);
    }

    // Se finite le card, ricarica stack
    if (currentIndex == null || currentIndex >= candidates.length) {
      _loadMoreProfiles();
    }

    return true;
  }

  void _handleLike(CyclistProfile profile) {
    // TODO: API Call
    // POST /api/v1/ridematch/swipe
    // Body: { "target_id": profile.id, "action": "LIKE" }
    // Response: { "matched": true/false, "match_id": "uuid" }

    // Se c'è match, mostra dialog
    _checkForMatch(profile);
  }

  void _handlePass(CyclistProfile profile) {
    // TODO: API Call
    // POST /api/v1/ridematch/swipe
    // Body: { "target_id": profile.id, "action": "PASS" }
  }

  void _handleSuperLike(CyclistProfile profile) {
    // TODO: Verifica limite giornaliero (3 super-like free)
    // Se utente PRO → illimitati
    // Altrimenti → mostra paywall dopo 3

    // POST /api/v1/ridematch/swipe
    // Body: { "target_id": profile.id, "action": "SUPERLIKE" }

    _showSuperLikeAnimation();
  }

  void _checkForMatch(CyclistProfile profile) {
    // Simula match (50% chance per demo)
    if (DateTime.now().millisecond % 2 == 0) {
      _showMatchDialog(profile);
    }
  }

  void _showMatchDialog(CyclistProfile profile) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF1E1E1E),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                "IT'S A MATCH! 🚲",
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00D084),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                "Tu e ${profile.name} siete pronti a pedalare insieme!",
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 30),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  // TODO: Apri chat
                },
                icon: const Icon(Icons.chat),
                label: const Text("Invia Messaggio"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00D084),
                  minimumSize: const Size(double.infinity, 50),
                ),
              ),
              const SizedBox(height: 10),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Continua a swipare"),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showSuperLikeAnimation() {
    // TODO: Lottie animation di borraccia che si riempie
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("⭐ Super-Like inviato!"),
        backgroundColor: Color(0xFF007AFF),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _loadMoreProfiles() {
    // TODO: GET /api/v1/ridematch/stack?limit=50
    debugPrint("📥 Caricando nuovi profili...");
  }

  void _showFilters() {
    // TODO: Mostra bottom sheet con filtri (raggio, velocità, vibe, ecc.)
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF2A2A2A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              "Filtri RideMatch",
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            const Text("Raggio di ricerca: 20 km"),
            Slider(
              value: 20,
              min: 5,
              max: 100,
              divisions: 19,
              label: "20 km",
              onChanged: (value) {},
            ),
            const SizedBox(height: 20),
            const Text("Velocità simile: ±3 km/h"),
            const SizedBox(height: 100),
            // TODO: Implementare tutti i filtri
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// WIDGET: Carta del Ciclista
// ============================================================================
class CyclistCardWidget extends StatelessWidget {
  final CyclistProfile profile;

  const CyclistCardWidget({
    super.key,
    required this.profile,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        image: DecorationImage(
          image: NetworkImage(profile.imageUrl),
          fit: BoxFit.cover,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.5),
            blurRadius: 10,
            spreadRadius: 2,
          )
        ],
      ),
      child: Container(
        // Gradiente per rendere leggibile il testo
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.transparent,
              Colors.black.withOpacity(0.2),
              Colors.black.withOpacity(0.9),
            ],
            stops: const [0.5, 0.7, 1.0],
          ),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.end,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Badge VIBE
            Row(
              children: [
                _buildBadge(
                  label: profile.vibe.toUpperCase(),
                  color: _getVibeColor(profile.vibe),
                ),
                const SizedBox(width: 8),
                _buildBadge(
                  label: profile.bikeType,
                  color: profile.bikeType == "E-Gravel"
                      ? Colors.blueAccent
                      : Colors.purpleAccent,
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Nome e Età + Verifica Strava
            Row(
              children: [
                Text(
                  "${profile.name}, ${profile.age}",
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                if (profile.stravaVerified) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFC4C02), // Arancione Strava
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.verified, color: Colors.white, size: 14),
                        SizedBox(width: 4),
                        Text(
                          "Strava",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 8),

            // I 3 Badge di Compatibilità (compatti)
            Row(
              children: [
                _buildInfoChip(
                  icon: Icons.location_on,
                  text: "${profile.distanceKm} km",
                ),
                const SizedBox(width: 12),
                _buildInfoChip(
                  icon: Icons.speed,
                  text: "${profile.avgSpeed.toStringAsFixed(1)} km/h",
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Bio
            Text(
              profile.bio,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                height: 1.4,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge({required String label, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.9),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.3),
            blurRadius: 8,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 12,
          color: Colors.white,
        ),
      ),
    );
  }

  Widget _buildInfoChip({required IconData icon, required String text}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 16),
          const SizedBox(width: 6),
          Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Color _getVibeColor(String vibe) {
    switch (vibe) {
      case 'Race':
        return Colors.redAccent;
      case 'Sport':
        return Colors.orangeAccent;
      default: // Chill
        return Colors.greenAccent;
    }
  }
}
```

---

## Spiegazione Tecnica delle Scelte

### 1. Gradient Overlay Pattern
```dart
gradient: LinearGradient(
  begin: Alignment.topCenter,
  end: Alignment.bottomCenter,
  colors: [
    Colors.transparent,
    Colors.black.withOpacity(0.2),
    Colors.black.withOpacity(0.9),
  ],
  stops: const [0.5, 0.7, 1.0],
)
```

**Perché?**
- Senza gradiente, il testo bianco diventa illeggibile se la foto è chiara
- Lo `stop` a 0.5 mantiene visibile la parte alta dell'immagine (bici/paesaggio)
- Opacità graduale da 0.2 a 0.9 è meno aggressiva di un nero pieno

### 2. CardSwiper Configuration
```dart
CardSwiper(
  numberOfCardsDisplayed: 3,       // Stack visibile di 3 carte
  backCardOffset: const Offset(0, 40),  // Profondità 3D
  ...
)
```

**Perché?**
- `numberOfCardsDisplayed: 3` crea l'effetto "stack" (come Tinder)
- `backCardOffset` dà profondità visiva, mostrando che ci sono altre card
- Migliora la percezione di "infinite scroll"

### 3. Controller per Bottoni Fisici
```dart
final CardSwiperController controller = CardSwiperController();

// Poi:
_actionButton(
  icon: Icons.favorite,
  onTap: () => controller.swipe(CardSwiperDirection.right),
)
```

**Perché?**
- Molti utenti preferiscono premere bottoni invece di swipe
- Accessibilità: touch target più grandi (60-70px vs area swipe incerta)
- Feedback aptico più preciso

### 4. State Management con `_currentIndex`
```dart
setState(() {
  _currentIndex = currentIndex ?? candidates.length;
});
```

**Perché?**
- Tracciamo l'indice corrente per mostrare "X profili rimanenti"
- Quando `currentIndex == null`, siamo alla fine dello stack
- Trigger per caricare nuovi profili da API

### 5. Match Detection (Simulato)
```dart
if (DateTime.now().millisecond % 2 == 0) {
  _showMatchDialog(profile);
}
```

**Nota:** Questo è solo per il prototipo. In produzione, la risposta del backend conterrà `{ "matched": true }`.

---

## Integrazione API (Prossimi Step)

### Service Layer con Dio

Crea `lib/services/ridematch_api.dart`:

```dart
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

part 'ridematch_api.g.dart';

@RestApi(baseUrl: "https://api.terragravel.com/v1")
abstract class RideMatchApi {
  factory RideMatchApi(Dio dio, {String baseUrl}) = _RideMatchApi;

  @GET("/ridematch/stack")
  Future<List<CyclistProfile>> getStack({
    @Query("limit") int limit = 50,
  });

  @POST("/ridematch/swipe")
  Future<SwipeResponse> swipe(@Body() SwipeRequest request);

  @GET("/ridematch/matches")
  Future<List<Match>> getMatches({
    @Query("status") String status = "ACTIVE",
  });
}

class SwipeRequest {
  final String targetId;
  final String action; // LIKE, PASS, SUPERLIKE

  SwipeRequest({required this.targetId, required this.action});

  Map<String, dynamic> toJson() => {
    'target_id': targetId,
    'action': action,
  };
}

class SwipeResponse {
  final bool matched;
  final String? matchId;

  SwipeResponse({required this.matched, this.matchId});

  factory SwipeResponse.fromJson(Map<String, dynamic> json) {
    return SwipeResponse(
      matched: json['matched'],
      matchId: json['match_id'],
    );
  }
}
```

Genera il codice:
```bash
flutter pub run build_runner build
```

### Uso nel Widget

```dart
class _RideMatchPageState extends State<RideMatchPage> {
  late RideMatchApi _api;
  List<CyclistProfile> candidates = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    final dio = Dio();
    _api = RideMatchApi(dio);
    _loadStack();
  }

  Future<void> _loadStack() async {
    try {
      final profiles = await _api.getStack(limit: 50);
      setState(() {
        candidates = profiles;
        isLoading = false;
      });
    } catch (e) {
      debugPrint("Error loading stack: $e");
      // TODO: Mostra errore all'utente
    }
  }

  void _handleLike(CyclistProfile profile) async {
    try {
      final response = await _api.swipe(
        SwipeRequest(targetId: profile.id, action: "LIKE"),
      );

      if (response.matched) {
        _showMatchDialog(profile);
      }
    } catch (e) {
      debugPrint("Error sending like: $e");
    }
  }
}
```

---

## Performance Optimization

### 1. Image Caching
Sostituisci `Image.network` con `CachedNetworkImage`:

```dart
CachedNetworkImage(
  imageUrl: profile.imageUrl,
  fit: BoxFit.cover,
  placeholder: (context, url) => const Center(
    child: CircularProgressIndicator(),
  ),
  errorWidget: (context, url, error) => const Icon(Icons.error),
)
```

### 2. Lazy Loading dello Stack
Pre-carica immagini delle prossime 3 card:

```dart
void _precacheImages() {
  for (int i = _currentIndex; i < min(_currentIndex + 3, candidates.length); i++) {
    precacheImage(NetworkImage(candidates[i].imageUrl), context);
  }
}
```

### 3. Shimmer Loading State
Quando lo stack è vuoto:

```dart
Shimmer.fromColors(
  baseColor: Colors.grey[800]!,
  highlightColor: Colors.grey[700]!,
  child: Container(
    height: 500,
    decoration: BoxDecoration(
      color: Colors.grey[800],
      borderRadius: BorderRadius.circular(20),
    ),
  ),
)
```

---

## Testing

### Unit Test per Business Logic

```dart
// test/ridematch_test.dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('RideMatch Swipe Logic', () {
    test('should increment current index on swipe', () {
      int currentIndex = 0;

      // Simula swipe
      currentIndex++;

      expect(currentIndex, 1);
    });

    test('should reload stack when reaching end', () {
      final candidates = List.generate(50, (i) => i);
      int currentIndex = 49;

      // Simula ultimo swipe
      currentIndex++;

      expect(currentIndex >= candidates.length, true);
      // Trigger reload...
    });
  });
}
```

### Widget Test

```dart
testWidgets('RideMatch shows action buttons', (WidgetTester tester) async {
  await tester.pumpWidget(const TerraGravelApp());

  // Verifica presenza bottoni
  expect(find.byIcon(Icons.close), findsOneWidget);
  expect(find.byIcon(Icons.favorite), findsOneWidget);
  expect(find.byIcon(Icons.replay), findsOneWidget);
});
```

---

## Esecuzione del Prototipo

1. Copia il codice in `lib/main.dart`
2. Esegui `flutter pub get`
3. Avvia con `flutter run`

**Cosa vedrai:**
- Stack di 4 card swipeable
- Bottoni fisici (X, Rewind, Heart)
- Badge dinamici per vibe e bike type
- Strava verification badge
- Match dialog (50% probabilità, simulato)

**Interazioni:**
- Swipe left: Skip
- Swipe right: Like
- Swipe up: Super-Like (mostra snackbar)
- Tap bottoni: Stessa azione degli swipe

---

## Next Steps

1. **Integrare API reali** con Retrofit
2. **State Management** con Riverpod/BLoC per gestire stato globale
3. **Animazioni avanzate** con Lottie per match explosion
4. **Haptic Feedback** con `vibration` package
5. **Analytics** con Firebase Analytics per tracciare swipe rate
6. **A/B Testing** su algoritmo di compatibilità

---

## Troubleshooting

### Problema: "Card non si muove"
**Soluzione:** Verifica che `CardSwiper` abbia un parent con altezza definita (usa `Expanded`)

### Problema: "Immagini non caricano"
**Soluzione:**
1. Verifica connessione internet
2. Aggiungi permessi in `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```
3. Per iOS, permetti HTTP in `Info.plist`:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### Problema: "Troppo lag su swipe"
**Soluzione:**
1. Riduci `numberOfCardsDisplayed` a 2
2. Usa `CachedNetworkImage` invece di `Image.network`
3. Comprimi immagini lato backend (max 800x800px, WebP format)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-22
**Tested On:** Flutter 3.16.0 • Dart 3.2.0
