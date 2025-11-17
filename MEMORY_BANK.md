# Memory Bank - Tigube Admin Dashboard

## Projekt-Übersicht

Das Tigube Admin Dashboard ist eine separate React-Anwendung für die Verwaltung der Tigube Haustierbetreuungsplattform. Es bietet umfassende Admin-Funktionen für Benutzerverwaltung, Content-Moderation, Analytics, Abonnements und mehr.

## Tech-Stack

- **Frontend Framework**: React 18 mit TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Charts**: Recharts
- **UI Components**: shadcn/ui (Chart Components)
- **Animationen**: Framer Motion

## Implementierte Module

### 1. AdminDashboard.tsx
- **Status**: ✅ Vollständig implementiert
- **Features**:
  - Übersicht über Plattform-Statistiken (Gesamt Benutzer, Aktive Abonnements, Gesamtumsatz, Nachrichten)
  - User-Freigaben erforderlich (Liste mit Approve-Funktion)
  - Statistiken werden aus der Datenbank geladen
  - Entfernte Sektionen: "Letzte Aktivitäten", "Benutzerverteilung", "Aktivität"

### 2. UserManagement.tsx
- **Status**: ✅ Vollständig implementiert
- **Features**:
  - Benutzer-Suche und -Filter
  - Admin-Rechte verwalten
  - Benutzer-Details anzeigen
  - Benutzer sperren/entsperren
  - Verifizierungsstatus verwalten

### 3. AdvertisementManagement.tsx
- **Status**: ✅ Vollständig implementiert
- **Features**:
  - CRUD-Operationen für Werbeanzeigen
  - Format-Verwaltung (Anzeigeformate)
  - Bild-Upload und URL-Eingabe
  - Targeting (Tiergruppen, Standorte, Abonnement-Typen)
  - Statistiken (Impressions, Clicks, CTR)
  - Duplizieren von Werbungen
  - **Wichtig**: Tiergruppen verwenden Plural-Formen:
    - Hunde, Katzen, Vögel, Kaninchen, Fische, Kleintiere, Andere
    - Automatische Konvertierung von Singular zu Plural beim Bearbeiten
  - Toast-Benachrichtigungen für alle Aktionen
  - Verhindert mehrfaches Klicken durch `saving` State

### 4. VerificationManagement.tsx
- **Status**: ✅ Vollständig implementiert
- **Features**:
  - Zeigt nur Benutzer an, die eine Verifizierung beantragt haben
  - Filter nach Typ (Verifizierung/Approval) und Status
  - Verifizierungsanträge genehmigen/ablehnen
  - Dokumente anzeigen (Ausweis, Zertifikate)
  - Admin-Kommentare verwalten
  - Modals für Benutzerdetails und Ablehnungsgründe

### 5. BlogCms.tsx
- **Status**: ✅ Vollständig implementiert
- **Features**:
  - CRUD-Operationen für Blog-Posts und News-Artikel
  - Kategorien und Tags verwalten
  - Filter nach Typ (Blog/News) und Status (Draft/Published)
  - Suche nach Titel, Excerpt, Content
  - Slug-Generierung
  - Cover-Image-URL
  - Veröffentlichungsdatum

### 6. Analytics.tsx
- **Status**: ✅ Vollständig implementiert
- **Features**:
  - Benutzer-Wachstum (Line Chart mit Recharts)
  - Zeitraum-Auswahl (7 Tage, 30 Tage, 90 Tage, 1 Jahr)
  - Statistik-Karten:
    - Gesamt Benutzer
    - Neue Benutzer (letzte 24 Stunden)
    - Neue Benutzer pro Tag (Durchschnitt)
    - Aktive Benutzer
  - Top Städte (Top 5 Städte mit Benutzeranzahl und Prozentsatz)
  - Y-Axis startet bei 0, keine negativen Werte
  - Chart nutzt volle Breite

### 7. ContentModeration.tsx
- **Status**: ✅ Vollständig implementiert
- **Features**:
  - **Bewertungen (Reviews)**: Anzeigen, Details anzeigen, Löschen
  - **Nachrichten (Messages)**: Anzeigen, Details anzeigen, Löschen
  - **Inhalte (Content Items)**: Anzeigen, Status ändern (Veröffentlichen/Zurückziehen), Löschen
  - **Benutzer-Sperrungen**: Benutzer sperren/entsperren mit Grund
  - **Support-Tickets**: Anzeigen, Status verwalten, Filter nach Status
  - Tab-Navigation für verschiedene Moderationstypen
  - Suche für alle Tabs
  - Toast-Benachrichtigungen

### 8. SubscriptionSync.tsx
- **Status**: ✅ Vollständig implementiert
- **Features**:
  - Abonnements-Verwaltung mit Stripe-Integration
  - Statistiken-Dashboard (Gesamt, Aktiv, Abgelaufen, Läuft bald ab)
  - Filter nach Status und Plan-Typ
  - Einzelne und Batch-Synchronisation
  - Abonnements bearbeiten (Plan-Typ, Status, Ablaufdatum, Limits)
  - Webhook-Logs anzeigen
  - Visuelle Warnungen für abgelaufene/bald ablaufende Abonnements
  - Bearbeitungs-Modal mit allen relevanten Feldern

## Toast Notification System

- **Komponente**: `src/components/ui/Toast.tsx`
- **Context**: `src/lib/toast/ToastContext.tsx`
- **Integration**: Wrapped in `App.tsx` mit `ToastProvider`
- **Verwendung**: `useToast()` Hook in allen Komponenten
- **Typen**: success, error, warning, info
- **Auto-Dismiss**: Standard 5 Sekunden, konfigurierbar

## Datenbank-Schema (Relevante Tabellen)

### Users
- `id`, `email`, `first_name`, `last_name`
- `user_type`, `is_admin`, `admin_role`
- `is_suspended`, `suspension_reason`, `suspended_at`
- `verification_status`, `approval_status`
- `plan_type`, `subscription_status`, `plan_expires_at`
- `stripe_customer_id`, `stripe_subscription_id`
- `max_contact_requests`, `max_bookings`, `search_priority`

### Advertisements
- `id`, `title`, `description`, `image_url`, `link_url`
- `ad_type`, `format_id`, `target_pet_types[]`, `target_locations[]`
- `start_date`, `end_date`, `is_active`, `priority`
- `max_impressions`, `current_impressions`
- `max_clicks`, `current_clicks`

### Verification Requests
- `id`, `user_id`, `ausweis_url`, `zertifikate_urls[]`
- `status`, `admin_comment`, `reviewed_at`, `reviewed_by`

### Content Items
- `id`, `type` (blog/news), `slug`, `title`, `excerpt`, `content`
- `cover_image_url`, `status` (draft/published)
- `published_at`, `author_id`

### Reviews
- `id`, `user_id`, `caretaker_id`, `dienstleister_id`
- `rating`, `comment`, `created_at`

### Messages
- `id`, `conversation_id`, `sender_id`, `content`
- `message_type`, `created_at`

### Support Tickets
- `id`, `user_id`, `title`, `description`
- `status`, `priority`, `category`
- `admin_notes`, `resolved_at`

### Webhook Logs
- `id`, `event_type`, `stripe_subscription_id`
- `customer_email`, `status`, `error_message`
- `raw_data` (JSONB), `created_at`

## Wichtige Konfigurationen

### Supabase Admin Client
- **Datei**: `src/lib/supabase/admin.ts`
- Verwendet Service Role Key für vollständigen Datenzugriff
- Fallback zu Anon Key falls Service Role fehlt

### Admin Service
- **Datei**: `src/lib/admin/adminService.ts`
- Zentrale Service-Funktionen für Datenbank-Operationen
- Fehlerbehandlung und Logging

## UI/UX Patterns

### Sidepanels (Notion-Style)
- **Alle Modals wurden zu Sidepanels umgebaut** (wie Notion)
- Slide-in Animation von rechts mit Framer Motion
- Volle Viewport-Höhe (`fixed top-0 right-0 bottom-0`)
- Flexbox-Layout mit fixem Footer am unteren Rand
- **Struktur**:
  - Overlay: `fixed top-0 left-0 right-0 bottom-0` mit `bg-black/50 backdrop-blur-sm`
  - Sidepanel Container: `fixed top-0 right-0 bottom-0` mit `max-w-*` (2xl/3xl/4xl/md)
  - Inner Container: `flex flex-col h-full` mit `p-6`
  - Header: `flex-shrink-0` (fix oben)
  - Content: `flex-1 overflow-y-auto` (scrollbar)
  - Footer: `flex-shrink-0 mt-auto` (fix unten)
- **Animation**: Framer Motion mit `initial={{ x: '100%' }}`, `animate={{ x: 0 }}`, `exit={{ x: '100%' }}`
- **Transition**: `type: 'tween', duration: 0.5, ease: [0.4, 0, 0.2, 1]`
- **Scrollbar-Verhalten**: Scrollbar bleibt sichtbar, aber Body-Scroll wird deaktiviert wenn Sidepanels offen sind
  - Verwendet `padding-right` gleich Scrollbar-Breite um Layout-Shifts zu vermeiden
  - `document.body.style.overflow = 'hidden'` + `document.body.style.paddingRight = scrollbarWidth`

### Tab-Navigation
- Border-bottom für aktiven Tab
- Icons mit Labels
- Badge für Anzahl (optional)

### Status-Badges
- Farbcodiert (grün=aktiv, rot=fehler, gelb=warnung, grau=neutral)
- Icons für bessere Erkennbarkeit

### Loading States
- Spinner mit `animate-spin`
- Disabled States für Buttons während Loading
- Skeleton-Loading für Tabellen

### Error Handling
- Toast-Benachrichtigungen für Fehler
- Fallback-Werte für fehlende Daten
- Try-Catch in allen async Funktionen

## Bekannte Probleme & Lösungen

### Problem: Mehrfaches Klicken bei Werbung erstellen
- **Lösung**: `saving` State verhindert mehrfaches Klicken
- Button wird während Speichern deaktiviert

### Problem: Chart-Werte gehen unter 0
- **Lösung**: 
  - `domain={[0, 'dataMax']}` auf YAxis
  - `allowDecimals={false}`
  - `type="monotone"` für Line Chart
  - `Math.max(0, value)` für Daten

### Problem: Foreign Key Beziehungen in Supabase
- **Lösung**: Separate Queries für User-Daten, dann Mapping im Frontend
- Verwendet `Map` für effiziente Lookups

### Problem: Tiergruppen Singular/Plural Inkonsistenz
- **Lösung**: 
  - Alle neuen Werbungen verwenden Plural
  - Automatische Konvertierung beim Bearbeiten
  - Mapping für Kompatibilität mit alten Daten

### Problem: Layout-Shifts beim Öffnen von Sidepanels (Scrollbar verschwindet)
- **Lösung**: 
  - Scrollbar-Breite wird berechnet: `window.innerWidth - document.documentElement.clientWidth`
  - `padding-right` gleich Scrollbar-Breite wird hinzugefügt wenn Sidepanel offen ist
  - `overflow: hidden` verhindert Scrollen, aber Scrollbar bleibt sichtbar
  - Verwendet in allen Seiten mit Sidepanels via `useEffect`

### Problem: Sidepanel Footer scrollt mit Content mit
- **Lösung**: 
  - Flexbox-Layout: Container `flex flex-col h-full`
  - Content: `flex-1 overflow-y-auto` (scrollbar)
  - Footer: `flex-shrink-0 mt-auto` (fix unten, außerhalb scrollbarem Bereich)

## Nächste Schritte / Offene Punkte

- [ ] Stripe API-Integration für echte Synchronisation (aktuell simuliert)
- [ ] Bild-Upload für Content Items implementieren
- [ ] Erweiterte Filter für Analytics
- [ ] Export-Funktionen für Daten (CSV, PDF)
- [ ] Audit-Log für Admin-Aktionen
- [ ] Bulk-Operationen für mehrere Benutzer gleichzeitig

## Code-Standards

- TypeScript mit strikter Typisierung
- Functional Components mit Hooks
- Async/Await für alle Datenbank-Operationen
- Konsistente Fehlerbehandlung
- Toast-Benachrichtigungen für User-Feedback
- Responsive Design mit Tailwind CSS
- Accessibility: ARIA-Labels, Keyboard-Navigation

## Dependencies

- `react`, `react-dom`, `react-router-dom`
- `@supabase/supabase-js`
- `lucide-react` (Icons)
- `recharts` (Charts)
- `framer-motion` (Animationen)
- `tailwindcss`
- `typescript`

## Projektstruktur

```
src/
├── components/
│   ├── admin/
│   │   └── AdminLayout.tsx
│   ├── ui/
│   │   ├── Toast.tsx
│   │   └── chart.tsx
│   └── ProtectedRoute.tsx
├── lib/
│   ├── admin/
│   │   ├── adminService.ts
│   │   └── useAdmin.ts
│   ├── auth/
│   │   └── AuthContext.tsx
│   ├── supabase/
│   │   ├── admin.ts
│   │   └── client.ts
│   └── toast/
│       └── ToastContext.tsx
└── pages/
    ├── AdminDashboard.tsx
    ├── AdvertisementManagement.tsx
    ├── Analytics.tsx
    ├── BlogCms.tsx
    ├── ContentModeration.tsx
    ├── Login.tsx
    ├── SubscriptionSync.tsx
    ├── UserManagement.tsx
    └── VerificationManagement.tsx
```

## Letzte Änderungen

1. **ContentModeration.tsx** - Vollständig implementiert mit 5 Moderationstypen
2. **SubscriptionSync.tsx** - Vollständig implementiert mit Stripe-Integration
3. **AdvertisementManagement.tsx** - Tiergruppen auf Plural geändert
4. **Analytics.tsx** - Top Städte hinzugefügt, Line Chart optimiert
5. **AdminDashboard.tsx** - Unnötige Sektionen entfernt
6. **Alle Modals zu Sidepanels umgebaut** (Januar 2025)
   - Notion-Style Sidepanels mit vollem Viewport
   - Framer Motion für smooth Slide-in Animationen
   - Footer-Bereiche fix am unteren Rand positioniert
   - Scrollbar bleibt sichtbar, verhindert Layout-Shifts
   - Overlay ohne Margin/Padding oben
7. **Framer Motion Integration**
   - Installiert: `npm install framer-motion`
   - Verwendet für alle Sidepanel-Animationen
   - `AnimatePresence` für Exit-Animationen
   - Smooth cubic-bezier Easing für natürliche Bewegung

---

**Stand**: Januar 2025
**Version**: 1.1.0

