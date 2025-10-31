# Tigube Admin Dashboard

Das separate Admin-Dashboard für die Tigube Haustierbetreuungsplattform.

## 🚀 Features

- **Separate Admin-Anwendung**: Komplett isoliert vom Haupt-Projekt
- **Moderne Tech-Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **Admin-Authentifizierung**: Eigenes Auth-System für Admin-Benutzer
- **Responsive Design**: Mobile-optimierte Benutzeroberfläche
- **Modulare Architektur**: Einfach erweiterbar

## 📁 Projektstruktur

```
tigube-admin/
├── src/
│   ├── components/
│   │   ├── admin/          # Admin-spezifische Komponenten
│   │   └── ui/             # Wiederverwendbare UI-Komponenten
│   ├── lib/
│   │   ├── admin/          # Admin-Services und Hooks
│   │   ├── auth/           # Admin-Authentifizierung
│   │   └── supabase/       # Supabase-Integration
│   ├── pages/              # Admin-Seiten
│   └── App.tsx            # Haupt-App-Komponente
├── public/                 # Statische Assets
└── package.json           # Dependencies
```

## 🛠️ Installation

1. **Dependencies installieren**:
   ```bash
   cd tigube-admin
   npm install
   ```

2. **Environment-Variablen konfigurieren**:
   ```bash
   cp env.example .env
   ```
   
   Bearbeiten Sie `.env` mit Ihren Supabase-Credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Development-Server starten**:
   ```bash
   npm run dev
   ```

   Das Admin-Dashboard ist dann unter `http://localhost:5175` verfügbar.

## 🏗️ Build & Deployment

```bash
# Production Build
npm run build

# Preview Build
npm run preview
```

## 🔧 Konfiguration

### Port-Konfiguration
- **Development**: Port 5175
- **Preview**: Port 4175

### Tailwind CSS
Vollständig konfiguriert mit:
- Custom Color Palette
- Admin-spezifische Komponenten-Klassen
- Responsive Design Utilities

### TypeScript
Strikte TypeScript-Konfiguration mit:
- Path Mapping (`@/*`)
- Strict Mode
- ESLint Integration

## 📋 Admin-Features

### Dashboard
- Übersicht über Plattform-Statistiken
- Benutzerverteilung
- Aktivitäts-Metriken

### Benutzerverwaltung
- Benutzer-Suche und -Filter
- Admin-Rechte verwalten
- Benutzer-Details anzeigen

### Weitere Module
- Content Moderation
- Analytics
- Subscription Sync
- Blog CMS
- Werbeverwaltung
- Verifizierung

## 🔐 Sicherheit

- **Admin-Only Access**: Nur authentifizierte Admins
- **Role-Based Permissions**: Granulare Berechtigungen
- **Audit Logging**: Alle Admin-Aktionen werden protokolliert
- **Separate Auth**: Eigenes Authentifizierungssystem

## 🚀 Deployment

### Vercel
```bash
# Vercel CLI
vercel --prod

# Oder GitHub Integration
# Automatisches Deployment bei Push auf main branch
```

### Netlify
```bash
# Netlify CLI
netlify deploy --prod

# Oder Drag & Drop des dist/ Ordners
```

## 🔄 Integration mit Haupt-Projekt

Das Admin-Dashboard ist komplett getrennt vom Haupt-Projekt:

1. **Separate URL**: `/admin.html` oder Subdomain
2. **Eigene Dependencies**: Unabhängige Package-Verwaltung
3. **Getrennte Deployment**: Separate CI/CD Pipeline
4. **Keine Interferenz**: Keine Cross-Tab-Konflikte mehr

## 📝 Entwicklung

### Code-Standards
- **TypeScript**: Strikte Typisierung
- **ESLint**: Code-Qualität
- **Prettier**: Code-Formatierung
- **Tailwind**: Utility-First CSS

### Komponenten-Architektur
```typescript
// Beispiel: Admin-Komponente
interface AdminComponentProps {
  // Props-Definition
}

function AdminComponent({ prop1, prop2 }: AdminComponentProps) {
  // Komponenten-Logik
  return (
    // JSX mit Tailwind-Klassen
  );
}
```

## 🐛 Troubleshooting

### Häufige Probleme

1. **Port bereits belegt**:
   ```bash
   # Anderen Port verwenden
   npm run dev -- --port 5176
   ```

2. **Supabase-Verbindung**:
   - Prüfen Sie die Environment-Variablen
   - Stellen Sie sicher, dass die Supabase-URL korrekt ist

3. **Admin-Zugriff**:
   - Benutzer muss `is_admin = true` in der Datenbank haben
   - Admin-Rolle muss korrekt gesetzt sein

## 📞 Support

Bei Problemen oder Fragen:
1. Prüfen Sie die Console-Logs
2. Überprüfen Sie die Network-Tab im Browser
3. Stellen Sie sicher, dass alle Dependencies installiert sind

## 🎯 Roadmap

- [ ] Erweiterte Benutzerverwaltung
- [ ] Real-time Analytics
- [ ] Bulk-Aktionen
- [ ] Export-Funktionen
- [ ] Advanced Filtering
- [ ] Mobile App Integration
