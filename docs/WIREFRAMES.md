# Wireframes & UX Specification - TerraGravel
**Versione:** 1.0
**Data:** 22 Gennaio 2026
**Status:** Design Draft

## Principi di Design

L'app TerraGravel è progettata per l'uso **outdoor in condizioni difficili**:
- **Thumb Zone First:** Tutti i controlli principali raggiungibili con il pollice
- **Alto Contrasto:** Leggibilità sotto luce solare diretta
- **Touch Targets Grandi:** Minimo 60-80px per l'uso con guanti e su terreni vibranti
- **Offline Graceful:** Feedback chiaro e rassicurante in assenza di rete

---

## Architettura di Navigazione

### Bottom Navigation Bar
Barra di navigazione fissa in basso con 4 tab principali:

1. **🗺️ Esplora** - Mappa e Navigazione (Home)
2. **🔧 Garage** - Strumenti Tecnici
3. **👥 Community** - Eventi e Social
4. **👤 Profilo** - Statistiche e Impostazioni

---

## Schermata 1: ESPLORA (Home)
*Schermata di apertura dell'app - Focus totale sulla mappa*

### Layout

#### Sfondo
- Mappa Mapbox a **tutto schermo**
- Strade sterrate evidenziate per difficoltà:
  - **Verde:** Gravel compatto (facile)
  - **Giallo:** Gravel mosso (medio)
  - **Rosso:** Singletrack/tecnico (difficile)
  - **Grigio:** Asfalto

#### Header Flottante (Parte Alta)
```
┌─────────────────────────────────────────┐
│ 🔍 Dove vuoi andare?            [User]  │
├─────────────────────────────────────────┤
│ [Bar] [Acqua] [Officina] [Sterrato>80%] │
└─────────────────────────────────────────┘
```
- **Barra di Ricerca:** Stile Google, ricerca posizioni e POI
- **Filtri Rapidi:** Pillole orizzontali scrollabili per filtrare POI sulla mappa

#### Controlli Laterali (Centro Destra)
```
┌───┐
│ ⚡ │  Layer (Satellite/Outdoor/Heatmap)
├───┤
│ ⊕ │  Ricentra su posizione attuale
└───┘
```

#### Bottom Card Flottante
```
┌─────────────────────────────────────────┐
│          Meteo: 22°C - Vento debole     │
│                                         │
│               ┌─────────┐               │
│               │   GO    │  ← FAB Button │
│               └─────────┘   (Grande)    │
└─────────────────────────────────────────┘
```
- **FAB (Floating Action Button):** Tasto circolare grande e centrale
  - **Azione:** Avvia registrazione "Free Ride" (senza destinazione)
  - **Colore:** Verde acceso (#00D084)
  - **Dimensione:** 80x80px minimo

---

## Schermata 2: ACTIVE RIDE
*Navigazione in corso - Leggibilità massima a colpo d'occhio*

### Layout

#### Dashboard Dati (Parte Alta)
```
┌────────────┬────────────┬────────────┐
│   24.5     │    12.8    │    +245    │
│   km/h     │     km     │     m      │
│  Velocità  │  Distanza  │ Dislivello │
└────────────┴────────────┴────────────┘
```
- **Typography:** Bold, grandi dimensioni (28-32pt)
- **Contrasto:** Testo nero su sfondo bianco (light mode)

#### Mappa 3D (Centro)
```
┌─────────────────────────────────────────┐
│                                         │
│         → Dx tra 150m                   │
│                                         │
│              Mappa 3D                   │
│         (Freccia centrata)              │
│                                         │
│               ↑                         │
│              Tu                         │
└─────────────────────────────────────────┘
```
- Freccia di navigazione **in basso al centro**
- Prossima svolta con **grossa freccia direzionale** e distanza
- Rotazione mappa in base alla direzione (heading-up mode)

#### Controlli Bottom
```
┌─────────────────────────────────────────┐
│ [🆘 SOS]                    [⚠️ Segnala]│
│                                         │
│      ◀═══════════════════▶              │
│      Scorri per terminare               │
└─────────────────────────────────────────┘
```
- **SOS Button (Sx):** Rosso, press & hold 3s per attivare emergenza
- **Segnala Button (Dx):** Giallo, apre menu rapido segnalazioni
- **Slider Termina:** Scorri per confermare fine giro (evita stop accidentali)

#### Menu Rapido Segnalazioni
Quando si preme "Segnala":
```
┌─────────────────────┐
│ Cosa vuoi segnalare?│
├─────────────────────┤
│ 🟤 Fango            │
│ 🔴 Strada Chiusa    │
│ 🐕 Cani Liberi      │
│ ⭐ Punto Panoramico │
└─────────────────────┘
```

---

## Schermata 3: GARAGE
*Gestione tecnica della bici - Pulizia e precisione*

### Layout

#### Header
```
┌─────────────────────────────────────────┐
│  [Foto Bici]                            │
│  Canyon Grizl                           │
│  ● Ottima forma           [Modifica]    │
└─────────────────────────────────────────┘
```
- **Badge Health:**
  - Verde: "Ottima forma"
  - Arancio: "Manutenzione raccomandata"
  - Rosso: "Manutenzione urgente"

#### Sezione 1: Tire Wizard
```
┌─────────────────────────────────────────┐
│ 🛞 PRESSIONE GOMME                      │
├─────────────────────────────────────────┤
│ Peso Totale (Tu + Bici)                 │
│ ◀═════●════════▶  75 kg                 │
│                                         │
│ Larghezza Copertone                     │
│ ◀════●═════════▶  42 mm                 │
│                                         │
│ Tipo Terreno                            │
│ [🛣️] [🌳] [⛰️]  ← Icon Toggle           │
│  Asf  Misto Sassi                       │
├─────────────────────────────────────────┤
│         PRESSIONE CONSIGLIATA           │
│                                         │
│      Anteriore        Posteriore        │
│        2.1 Bar         2.3 Bar          │
│       (30 PSI)        (33 PSI)          │
└─────────────────────────────────────────┘
```
- **Input:** Slider interattivi + toggle icone
- **Output:** Numeri grandi e chiari in Bar e PSI

#### Sezione 2: Manutenzione Componenti
```
┌─────────────────────────────────────────┐
│ ⚙️ MANUTENZIONE                         │
├─────────────────────────────────────────┤
│ Catena                        [Reset]   │
│ ████████░░░░ 400/500 km (80%)           │
│                                         │
│ Sigillante Tubeless               [Reset]│
│ ████░░░░░░░░ 2/6 mesi (33%)             │
│                                         │
│ Pastiglie Freno                   [Reset]│
│ ██████████░░ 80% vita residua           │
└─────────────────────────────────────────┘
```
- **Progress Bar:** Colore cambia Verde → Giallo → Rosso
- **Reset Button:** Da premere dopo manutenzione effettuata

---

## Schermata 4: COMMUNITY
*Social & Eventi - Lista scrollabile verticale*

### Layout

#### Tab Header
```
┌─────────────────────────────────────────┐
│ [Eventi] | [Gruppi] | [RideMatch 🔥]   │
└─────────────────────────────────────────┘
```

#### Lista Group Rides (Card Layout)
```
┌─────────────────────────────────────────┐
│ [Avatar] Marco R.         [Unisciti >]  │
│ Giro domenicale tranquillo              │
│ 📅 Dom 26 Gen, 9:00                     │
│ ●●○○ Facile | 35 km | 🚴 4/8 iscritti  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ [Avatar] Chiara M.        [Unisciti >]  │
│ Esplorazione Val di Merse               │
│ 📅 Sab 25 Gen, 14:30                    │
│ ●●●○ Medio | 52 km | 🚴 2/6 iscritti   │
└─────────────────────────────────────────┘
```

**Ogni Card contiene:**
- Avatar organizzatore + nome
- Titolo uscita
- Data e ora
- Livello difficoltà (pallini colorati)
- Distanza
- Numero partecipanti (attuale/max)
- Bottone "Unisciti"

#### Floating Action Button
```
                    ┌───┐
                    │ + │  ← Crea Uscita
                    └───┘
```
- Posizione: Angolo in basso a destra
- Azione: Apre form "Crea Nuova Uscita"

---

## Schermata 4B: RIDEMATCH 🔥
*Il "Tinder per Ciclisti" - Trova il tuo Gravel Buddy*

### Il Concept
RideMatch risolve il problema della **compatibilità atletica** tra ciclisti. Non conta l'estetica, conta la capacità di pedalare insieme senza che uno "tiri il collo" all'altro o si annoi.

### Layout Principale

#### Card a Tutto Schermo (Stack)
```
┌─────────────────────────────────────────┐
│                                         │
│        [Foto Action con Bici]           │
│              Grande                     │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ Marco, 34 • 5 km da te            ✅    │
├─────────────────────────────────────────┤
│ I 3 BADGE DI COMPATIBILITÀ              │
│ ┌───────┐ ┌────────┐ ┌──────────┐     │
│ │ 🚴    │ │ 🍺     │ │ 💪       │     │
│ │20-22  │ │ Chill  │ │ Muscle   │     │
│ │ km/h  │ │ Beer   │ │ Gravel   │     │
│ └───────┘ └────────┘ └──────────┘     │
├─────────────────────────────────────────┤
│ BIO CICLISTICA:                         │
│ "Cerco compagnia per lunghi il sabato  │
│  mattina, amo le salite, odio il fango."│
├─────────────────────────────────────────┤
│ ULTIMI GIRI:                            │
│ • Val d'Orcia Loop - 65km - ●●●○       │
│ • Sterrate Chianti - 42km - ●●○○       │
└─────────────────────────────────────────┘

        Controlli Swipe:
┌───────────────────────────────────────┐
│ [✕]      [🍶]         [🚲]           │
│ SKIP    SUPER-LIKE   PEDALIAMO!      │
│         (Borraccia)                   │
└───────────────────────────────────────┘
```

### Componenti della Card

#### 1. Foto Principale
- **Requisito:** Non solo il viso, ma **ciclista in azione con la bici**
- **Dimensione:** Hero image 60% dello schermo
- **Aspect Ratio:** 4:3 o 16:9
- **Validazione:** Moderazione AI per evitare foto non pertinenti

#### 2. Info Base (Header Card)
```
┌─────────────────────────────────────────┐
│ Marco, 34 • 5 km da te            ✅    │
└─────────────────────────────────────────┘
```
- **Nome + Età**
- **Distanza GPS** da te (privacy-friendly: arrotondata a 1km)
- **Badge Verifica:** ✅ "Strava Verified" (dati reali, non inventati)

#### 3. I 3 Badge di Compatibilità (CORE FEATURE)

##### Badge 1: Il "Motore" 🚴
```
┌──────────┐
│  🚴      │
│  20-22   │
│  km/h    │
└──────────┘
```
- **Dato:** Media oraria su sterrato (calcolata dalle ultime 10 uscite)
- **Fonte:** Integrazione Strava o dati TerraGravel
- **Logica Filtering:** Mostra solo utenti con media ±3 km/h dalla tua

##### Badge 2: Lo "Spirito" 🍺 o ⚡
```
┌──────────┐     ┌──────────┐
│  🍺      │ VS  │  ⚡      │
│  Chill   │     │  Race    │
│  Beer    │     │  Watts   │
└──────────┘     └──────────┘
```
- **Turistico (Beer):** Pedala per scoprire, si ferma spesso, socializza
- **Agonista (Watts):** Pedala per performance, ritmo costante, no soste

**Selezione:** L'utente sceglie nel profilo (toggle o slider)

##### Badge 3: Tipo Bici 💪 o ⚡
```
┌──────────┐     ┌──────────┐
│  💪      │ VS  │  ⚡      │
│  Muscle  │     │  E-Gravel│
│  Gravel  │     │          │
└──────────┘     └──────────┘
```
- **Muscle Gravel:** Bici tradizionale
- **E-Gravel:** Bici a pedalata assistita

**Rationale:** Evita frustrazione. Un ciclista muscolare fatica a tenere il passo di un e-bike in salita.

#### 4. Bio Ciclistica (Max 120 caratteri)
```
┌─────────────────────────────────────────┐
│ "Cerco compagnia per lunghi il sabato   │
│  mattina, amo le salite, odio il fango."│
└─────────────────────────────────────────┘
```
- **Limite:** 120 caratteri (stile Twitter/X)
- **Template suggeriti:**
  - "Cerco compagni per..."
  - "Amo..." / "Odio..."
  - "Disponibile il..."

#### 5. Ultimi Giri (Social Proof)
```
┌─────────────────────────────────────────┐
│ ULTIMI GIRI:                            │
│ • Val d'Orcia Loop - 65km - ●●●○       │
│ • Sterrate Chianti - 42km - ●●○○       │
└─────────────────────────────────────────┘
```
- Mostra le **ultime 2-3 uscite** registrate
- Difficoltà con pallini colorati
- Dati da Strava/TerraGravel

### Interazioni (Swipe Mechanics)

#### Swipe Left (✕ - SKIP)
```
[✕ SKIP]
```
- **Azione:** Scarta il profilo ("Non oggi" / "Troppo forte per me")
- **Colore:** Rosso (#FF3B30)
- **Dimensione:** 60x60px
- **Feedback:** Card scorre a sinistra con fade out

#### Swipe Right (🚲 - PEDALIAMO!)
```
[🚲 PEDALIAMO!]
```
- **Azione:** Esprimi interesse ("Voglio pedalare con te")
- **Colore:** Verde (#00D084)
- **Dimensione:** 80x80px (Primario)
- **Feedback:** Card scorre a destra con animazione cuore/bici

#### Swipe Up (🍶 - SUPER LIKE / Borraccia)
```
[🍶 SUPER-LIKE]
```
- **Azione:** "Voglio ASSOLUTAMENTE uscire con te, ho un percorso pronto!"
- **Colore:** Blu/Oro (#007AFF)
- **Dimensione:** 60x60px
- **Limite:** Massimo 3 Super-Like al giorno (monetizzazione PRO: illimitati)
- **Feedback:** Animazione borraccia che si riempie

#### Rewind (↺)
```
[↺ INDIETRO]
```
- **Azione:** Annulla ultimo swipe (in caso di errore)
- **Posizionamento:** Piccolo bottone centrale sotto le card
- **Colore:** Giallo (#FFCC00)
- **Limite:** 1 Rewind gratis, poi feature PRO

### Il Match

#### Schermata "It's a Match! 🚲"
Quando **entrambi** fanno swipe right:
```
┌─────────────────────────────────────────┐
│                                         │
│          IT'S A MATCH! 🚲               │
│                                         │
│  ┌──────────┐       ┌──────────┐       │
│  │ [Tua    ]│       │ [Marco  ]│       │
│  │  Foto]   │   💚  │  Foto]   │       │
│  └──────────┘       └──────────┘       │
│                                         │
│      "Pronti a pedalare insieme!"       │
│                                         │
│  ┌────────────────────────────────┐    │
│  │    💬 Invia Messaggio          │    │
│  └────────────────────────────────┘    │
│  ┌────────────────────────────────┐    │
│  │    🗺️  Proponi Percorso        │    │
│  └────────────────────────────────┘    │
│  ┌────────────────────────────────┐    │
│  │    ← Continua a Swipare        │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Azioni disponibili:**
1. **Invia Messaggio:** Apre chat privata 1-to-1
2. **Proponi Percorso:** Condividi un tracciato GPX dalla tua libreria
3. **Continua a Swipare:** Torna allo stack di card

### Filtri Intelligenti (Settings)

#### Pannello Filtri
Accessibile tramite icona filtro ⚙️ in alto a destra nella schermata RideMatch:

```
┌─────────────────────────────────────────┐
│ ⚙️ FILTRI RIDEMATCH                    │
├─────────────────────────────────────────┤
│ Raggio di Ricerca                       │
│ ◀═══●═════▶ 20 km                       │
│                                         │
│ Livello (Media km/h)                    │
│ ◀══●══▶ ± 3 km/h dalla mia media       │
│                                         │
│ Genere                                  │
│ ○ Uomini  ○ Donne  ● Tutti             │
│                                         │
│ Tipo Bici                               │
│ ☑ Muscle Gravel  ☑ E-Gravel            │
│                                         │
│ Spirito                                 │
│ ☑ Chill/Beer  ☑ Race/Watts             │
│                                         │
│ Disponibilità                           │
│ ☑ Weekend  ☑ Infrasettimanale          │
└─────────────────────────────────────────┘
```

**Filtri Chiave:**
- **Raggio:** 5km, 10km, 20km, 50km, 100km
- **Livello:** ±1, ±3, ±5 km/h (default: ±3)
- **Genere:** Privacy-friendly, opzionale
- **Tipo Bici:** Evita incompatibilità muscle vs e-bike
- **Spirito:** Match turistico/agonista

### Sicurezza & Trust

#### 1. Meeting Point Pubblici
**Feature:** Quando si organizza l'uscita via chat, l'app suggerisce:
```
┌─────────────────────────────────────────┐
│ 📍 SUGGERIMENTI RITROVO SICURO          │
├─────────────────────────────────────────┤
│ • Bar Il Ciclista (Piazza Duomo)       │
│   🚴 Bike-Friendly | ⭐ 4.8            │
│                                         │
│ • Stazione FS Siena                     │
│   🅿️ Parcheggio | 📡 WiFi             │
│                                         │
│ • Fontanella Parco XXV Aprile           │
│   💧 Acqua | 🌳 Ombra                  │
└─────────────────────────────────────────┘
```

**Logica:**
- **Evita:** Indirizzi di casa privati
- **Privilegia:** Luoghi pubblici, illuminati, frequentati
- **Database:** POI verificati da community

#### 2. Feedback Post-Ride
Dopo 24h dal match, l'app chiede:
```
┌─────────────────────────────────────────┐
│ Come è andata l'uscita con Marco?       │
├─────────────────────────────────────────┤
│ ● Si è presentato                       │
│ ○ Non si è presentato (no-show)        │
│ ○ Comportamento inappropriato           │
├─────────────────────────────────────────┤
│ Valuta l'esperienza:                    │
│      ⭐ ⭐ ⭐ ⭐ ⭐                      │
│                                         │
│ [Invia Feedback]                        │
└─────────────────────────────────────────┘
```

**Sistema di Rating (Nascosto):**
- **3+ No-Show:** Account sospeso automaticamente
- **Comportamento inappropriato:** Review manuale + ban
- **Rating basso (<2 stelle):** Visibilità ridotta nello stack

#### 3. Verifica Identità (Fase 2+)
```
┌─────────────────────────────────────────┐
│ ✅ PROFILO VERIFICATO                   │
├─────────────────────────────────────────┤
│ • Strava Account Collegato              │
│ • Email Confermata                      │
│ • Telefono Verificato (+39 ***1234)    │
│ • ID Document Upload (Opzionale)       │
└─────────────────────────────────────────┘
```

**Badge Verifica:**
- ✅ **Verde (Strava):** Dati velocità autentici
- ✅ **Blu (Telefono):** SMS verification
- ✅ **Oro (ID):** Documento caricato (riservato a PRO)

#### 4. Modalità "Ghost" (Privacy)
```
┌─────────────────────────────────────────┐
│ 👻 MODALITÀ INVISIBILE                  │
├─────────────────────────────────────────┤
│ Quando attiva:                          │
│ • Non appari nello stack RideMatch      │
│ • I match esistenti rimangono attivi    │
│ • Puoi continuare a swipare             │
│                                         │
│ [Attiva Modalità Ghost]                 │
└─────────────────────────────────────────┘
```

**Use Case:**
- Periodo di pausa (infortunio, impegni)
- Non vuoi nuovi match ma mantieni le chat attive

#### 5. Report & Block
Ogni profilo ha menu contestuale (⋮):
```
┌─────────────────────────────────────────┐
│ ⚠️ Segnala Marco                        │
├─────────────────────────────────────────┤
│ ○ Spam/Bot                              │
│ ○ Foto inappropriate                    │
│ ○ Comportamento molesto                 │
│ ○ Fake profile                          │
│ ○ Altro                                 │
├─────────────────────────────────────────┤
│ 🚫 Blocca Utente                        │
│    (Non lo vedrai più)                  │
└─────────────────────────────────────────┘
```

### Stack Tecnologico per RideMatch

#### Frontend (Flutter)
```dart
// Package per Swipe Cards
dependencies:
  flutter_card_swiper: ^6.0.0
  appinio_swiper: ^2.0.0  // Alternative, più customizzabile
```

**Animazioni:**
- **Swipe fluido:** 60fps con `AnimatedBuilder`
- **Match Explosion:** Lottie animation (confetti + bici)
- **Haptic Feedback:** Su swipe, match e super-like

#### Backend (Database Geospaziale)
**PostgreSQL + PostGIS** per query ottimizzate:

```sql
-- Esempio query: Trova ciclisti compatibili
SELECT
  u.id, u.name, u.avg_speed, u.spirit, u.bike_type,
  ST_Distance(u.location, $user_location) AS distance
FROM users u
WHERE
  ST_DWithin(u.location, $user_location, 20000) -- 20km radius
  AND u.avg_speed BETWEEN ($my_avg_speed - 3) AND ($my_avg_speed + 3)
  AND u.spirit = $my_spirit
  AND u.bike_type IN ($my_bike_filters)
  AND u.id NOT IN (SELECT swiped_id FROM swipes WHERE swiper_id = $user_id)
ORDER BY distance ASC
LIMIT 50;
```

**Ottimizzazioni:**
- **Indice GiST:** Su colonna `location` per query spaziali veloci
- **Cache Redis:** Stack di 50 profili pre-caricati per scroll fluido
- **Background Job:** Rigenera stack ogni 12h o quando finiscono i profili

#### Algoritmo di Ranking
**Score di compatibilità (nascosto all'utente):**

```javascript
score = (
  distance_score * 0.3 +      // Più vicino = meglio
  speed_match_score * 0.4 +   // Velocità simile = priorità alta
  spirit_match_score * 0.2 +  // Stesso spirito = compatibilità
  activity_score * 0.1        // Utenti attivi recentemente = priorità
)
```

**Boost:**
- **Super-Like ricevuto:** +50 punti score (appare in cima allo stack)
- **Strava Verified:** +10 punti trust
- **Foto con bici:** +5 punti (vs foto solo viso)

#### Privacy & GDPR
**Dati sensibili:**
- **Posizione GPS:** Arrotondata a 1km (mai esatta)
- **Strava Link:** Opzionale, revocabile
- **Chat:** Criptate E2E con Signal Protocol
- **Cancellazione:** "Right to be forgotten" - cancella tutti i match e messaggi

---

## UX Guidelines & Best Practices

### 1. Dark Mode Automatico
**Trigger:**
- Sensore luminosità ambientale < 100 lux
- Orario serale (18:00-06:00)
- Preferenza manuale utente

**Benefici:**
- Riduce abbagliamento in ambienti bui (boschi, tunnel)
- Risparmio batteria su schermi OLED (60% dei dispositivi Android)
- Riduzione affaticamento visivo

**Palette:**
```
Light Mode:
- Background: #FFFFFF
- Text: #1A1A1A
- Primary: #00D084 (Green)

Dark Mode:
- Background: #1A1A1A
- Text: #E8E8E8
- Primary: #00FF9D (Bright Green)
```

### 2. Offline Mode Feedback
**Quando il dispositivo perde connessione:**

```
┌─────────────────────────────────────────┐
│ 📡 Modalità Offline                     │
│ GPS attivo - Navigazione funzionante    │
│ I dati verranno sincronizzati al ritorno│
└─────────────────────────────────────────┘
```

**Comportamento:**
- Banner **rassicurante** in alto (blu, non rosso)
- GPS continua a funzionare normalmente
- Mappe cached disponibili
- Segnalazioni salvate localmente e sincronizzate dopo

**EVITARE:**
- ❌ Errori rossi aggressivi
- ❌ Blocco funzionalità GPS
- ❌ Popup che interrompono la navigazione

### 3. Touch Targets Grandi
**Dimensioni Minime:**
- Bottoni primari: **80x80px** (FAB "GO")
- Bottoni secondari: **60x60px** (SOS, Segnala)
- Liste interattive: **56px** altezza minima
- Spacing tra elementi: **16px** minimo

**Rationale:**
- Uso con guanti (ciclismo invernale)
- Vibrazioni su terreno sconnesso
- Visione periferica durante la pedalata
- Sudore/pioggia sullo schermo

### 4. Haptic Feedback
**Eventi che richiedono vibrazione:**
- ✅ Inizio/fine registrazione giro
- ✅ Prossima svolta (100m prima)
- ✅ SOS attivato
- ✅ Segnalazione inviata
- ✅ Obiettivo raggiunto (es. 50km)

**Pattern vibrazione:**
- Successo: Breve (50ms)
- Warning: Doppia (50ms + pausa + 50ms)
- Emergenza (SOS): Tripla forte

### 5. Gesture Support
**Navigazione Mappa:**
- Pinch to Zoom: Standard
- Two-finger rotate: Rotazione mappa
- Long press: Aggiungi POI/Waypoint
- Swipe up su card bottom: Espandi dettagli

**Active Ride:**
- Swipe left/right: Cambia schermata dati (Velocità/Cardio/Potenza)
- Swipe down da top: Pausa registrazione
- Swipe right (slider): Termina giro

**RideMatch:**
- Swipe left: Skip profilo
- Swipe right: Like
- Swipe up: Super-Like (Borraccia)
- Tap su foto: Espandi galleria
- Tap su badge: Dettagli compatibilità

### 6. RideMatch Safety & Trust Design

#### Principi di Sicurezza
**Design for Safety First:**
- Mai mostrare indirizzi di casa
- Posizioni GPS arrotondate a 1km minimo
- Meeting point pubblici suggeriti di default
- Sistema di rating nascosto ma efficace

#### Visual Trust Indicators
**Badge Verifica:**
```
✅ Verde (Strava)    → Dati autentici
📧 Grigio (Email)    → Email verificata
📱 Blu (Telefono)    → SMS verification
🆔 Oro (ID)          → Documento caricato (PRO)
```

**Hierarchy of Trust:**
1. Nessuna verifica: Visibilità bassa nello stack
2. Email + Strava: Visibilità normale
3. Telefono + Strava: Visibilità alta
4. Full verification: Badge oro, priorità massima

#### Onboarding Safety
**Prima volta in RideMatch:**
```
┌─────────────────────────────────────────┐
│ 🛡️ SICUREZZA PRIMA DI TUTTO            │
├─────────────────────────────────────────┤
│ Consigli per un'esperienza sicura:     │
│                                         │
│ ✅ Incontrati in luoghi pubblici        │
│ ✅ Condividi il tuo percorso con amici  │
│ ✅ Porta sempre il telefono carico      │
│ ⚠️ Non condividere dati personali       │
│                                         │
│ [Ho capito, iniziamo!]                  │
└─────────────────────────────────────────┘
```

**Show Once:** Al primo accesso a RideMatch
**Dismissible:** Non mostrare più con checkbox

#### Red Flags Detection
**Sistema AI di moderazione:**
- Foto profilo senza bici → Warning
- Bio con riferimenti esterni (Instagram, WhatsApp) → Flag
- Richiesta di incontro immediato senza chat → Suspicious
- Velocità irrealistiche (>40 km/h media su sterrato) → Data validation

---

## Responsive Design Notes

### Device Support
- **Phone:** 5.5" - 6.7" (Primary)
- **Tablet:** 7" - 11" (Estensione futura - Split view)
- **Smartwatch:** Dati base sync (Garmin/Apple Watch integration)

### Orientation
- **Portrait:** Modalità predefinita (navigazione sicura)
- **Landscape:** Durante Active Ride per mappa più grande
  - Dashboard dati diventa sidebar laterale
  - Mappa occupa 80% dello schermo

---

## Accessibility (a11y)

### Conformità WCAG 2.1 AA
- **Contrasto minimo:** 4.5:1 per testo normale
- **Touch targets:** 44x44pt minimo (iOS) / 48x48dp (Android)
- **Screen reader:** Tutti i bottoni con label semantici
- **Font scaling:** Supporto fino a 200% (Dynamic Type iOS / Font Scaling Android)

### Color Blindness Support
- Non usare **solo** il colore per comunicare stato
- Aggiungere **icone** + **pattern** alle superfici (es. linee tratteggiate per gravel tecnico)
- Modalità "Daltonismo" nei settings (opzionale Fase 2)

---

## Prototype Tools Recommendation

Per creare prototipi interattivi consiglio:
1. **Figma** (Design + Prototype) - Industry standard
2. **Principle** (iOS animations) - Per micro-interazioni fluide
3. **ProtoPie** (Sensori + GPS simulation) - Test scenari outdoor

---

## Next Steps
1. ✅ PRD validato
2. ⏳ **Wireframe validazione con stakeholder** ← We are here
3. ⏳ Mockup ad alta fedeltà (UI Design)
4. ⏳ Prototype interattivo
5. ⏳ User testing (5-8 utenti target)
6. ⏳ Sviluppo Sprint 1 (Login + Mappa base)
