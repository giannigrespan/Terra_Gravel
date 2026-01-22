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
│  [Group Rides]  |  [Eventi/Gare]        │
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
