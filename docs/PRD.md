# PRD: TerraGravel (Nome in codice)
**Versione:** 1.0 (Draft)
**Data:** 22 Gennaio 2026
**Stato:** In definizione

## 1. Executive Summary
TerraGravel è un'applicazione mobile "Super App" dedicata verticalmente al ciclismo Gravel. A differenza dei competitor generalisti (Strava, Google Maps) o focalizzati sull'hiking (Komoot), TerraGravel risolve il problema principale del gravelista: **l'incertezza del terreno**. L'app combina navigazione specifica per superfici sterrate, gestione tecnica della bici e funzionalità di community per creare un ecosistema sicuro e avventuroso.

## 2. Il Problema
*   **Mancanza di dati sulla superficie:** Le app attuali non distinguono chiaramente tra "ghiaia battuta veloce" (facile) e "sassaia tecnica" (difficile).
*   **Frammentazione:** Il ciclista usa un sito per calcolare la pressione gomme, uno per cercare eventi, e un altro per le mappe.
*   **Ansia da esplorazione:** Paura di finire in sentieri impraticabili o rimanere senza acqua in zone remote.
*   **Solitudine e incompatibilità:** Difficoltà a trovare compagni di pedalata con livello e spirito compatibili. Uscire da soli in zone isolate può essere pericoloso o noioso.

## 3. User Personas (Target Audience)
*   **L'Esploratore (Marco, 35 anni):** Pedala nel weekend, cerca strade bianche panoramiche, evita il traffico. Non gli interessa la media oraria, vuole scoprire posti nuovi e fermarsi a bere una birra.
*   **La Neofita (Chiara, 28 anni):** Ha appena comprato una bici gravel. Ha bisogno di sicurezza, di sapere come settare la bici (pressione gomme) e di trovare percorsi facili e sicuri.
*   **L'Ultra-Racer (Stefano, 45 anni):** Partecipa a gare di lunga distanza (200km+). Ha bisogno di mappe offline affidabili, punti acqua precisi e tracciamento manutenzione.

## 4. Requisiti Funzionali (Cosa fa l'app)

### A. Navigazione & Mappe (Core Feature)
1.  **Mappa "Gravel-Centric":** Visualizzazione Mapbox personalizzata.
    *   *High Contrast Mode:* Leggibilità alta sotto il sole diretto.
    *   *Surface Coding:* Colori diversi per Asfalto (Grigio), Gravel Compatto (Verde), Gravel Mosso (Giallo), Singletrack/Tecnico (Rosso).
2.  **Routing Intelligente:** Algoritmo che privilegia le strade sterrate evitando i sentieri da MTB estrema e le statali trafficate.
3.  **POI Collaborativi:** Gli utenti possono aggiungere/modificare: Fontanelle, Bar Bike-Friendly, Punti Panoramici, Zone di Pericolo (es. cani liberi).

### B. Il "Garage" (Utility)
1.  **Wizard Pressione Gomme:**
    *   Input: Peso ciclista + bici, Larghezza copertone (es. 42mm), Dimensione ruota (700c/650b), Tipo terreno prevalente.
    *   Output: Pressione suggerita (Bar/PSI) anteriore e posteriore.
2.  **Bike Passport:** Profilo della bici (marca, modello, data ultimo service).

### C. Community & Sicurezza
1.  **SOS Button:** Pulsante flottante in navigazione. Se premuto per 3 secondi, invia posizione SMS ai contatti di emergenza.
2.  **Segnalazione Live:** L'utente può segnalare in tempo reale: "Strada chiusa", "Fango eccessivo", "Albero caduto".
3.  **RideMatch (Il "Tinder per Ciclisti"):** Sistema di matching per trovare compagni di pedalata compatibili.
    *   *Compatibilità Atletica:* Match basato su velocità media, spirito (turistico vs agonista) e tipo bici (muscle vs e-gravel).
    *   *Safety First:* Meeting point pubblici suggeriti, sistema di rating nascosto, verifica Strava.
    *   *Swipe Interface:* Card con foto + 3 badge di compatibilità (Motore, Spirito, Bici).
    *   *Filtri Intelligenti:* Raggio GPS, livello, genere, disponibilità.

## 5. Requisiti Non Funzionali (Specifiche Tecniche)
*   **Piattaforme:** iOS e Android (Sviluppo in Flutter).
*   **Offline First:** L'app deve funzionare parzialmente anche senza rete (cache delle mappe visitate di recente).
*   **Consumo Batteria:** Ottimizzazione background GPS per non drenare la batteria (critico per uscite lunghe).
*   **Privacy:** Conformità GDPR. I dati di posizione sono privati di default.

## 6. Roadmap (Fasi di rilascio)

### Fase 1: MVP (Minimum Viable Product) - Mese 1-4
*   Registrazione/Login.
*   Mappa base con distinzione asfalto/sterrato.
*   Navigazione punto A a punto B.
*   Calcolatore Pressione Gomme base.

### Fase 2: Social & Offline - Mese 5-8
*   Download mappe offline (Regionali).
*   Sistema di recensione percorsi (Stelline + Tag es. "Sabbioso").
*   Integrazione eventi/gare locali.
*   **RideMatch:** Sistema di matching ciclisti con swipe interface (Fase Beta).
*   Integrazione Strava per verifica dati e social proof.

### Fase 3: Premium Ecosystem - Mese 9+
*   Live Tracking (condividi posizione in tempo reale con amici).
*   Manutenzione predittiva (integrazione Strava).
*   Sconti partner e marketplace.

## 7. Metriche di Successo (KPI)
*   **Retention Rate:** Quanti utenti tornano ad aprire l'app entro 30 giorni.
*   **Km Pedalati:** Totale km tracciati dagli utenti.
*   **Contributi Community:** Numero di POI (punti di interesse) o segnalazioni aggiunte dagli utenti.
*   **RideMatch Engagement:**
    *   Numero di match giornalieri
    *   Percentuale di match che portano a uscite reali (conversion)
    *   Tasso di no-show (obiettivo: <5%)
    *   Rating medio post-ride (obiettivo: >4/5 stelle)

## 8. Monetizzazione (Ipotesi)
*   **Freemium:** Funzioni base gratuite.
*   **Abbonamento "TerraGravel PRO" (2.99€/mese o 29.99€/anno):**
    *   Mappe offline illimitate
    *   Mappe di calore (heatmap)
    *   Sconti su brand partner
    *   **RideMatch PRO:** Super-Like illimitati (vs 3/giorno free), Rewind illimitati, filtri avanzati, badge prioritario nello stack

---

## 9. Note per il Futuro
Questo PRD è un documento vivo. Man mano che raccogliamo feedback dagli utenti beta o dagli stakeholder, aggiorneremo le priorità e i requisiti.

**Prossimi Step:**
1. Validazione del PRD con il team tecnico
2. Creazione dei wireframe/mockup UI
3. Stima effort e timeline di sviluppo
4. Kick-off dello sviluppo della Fase 1 (MVP)
