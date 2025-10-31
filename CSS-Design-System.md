# Tigube CSS Design System

## Farben

### Primärfarben
- **Primary**: `#5A7537` (Grün) - Hauptfarbe
- **Primary 50-900**: Vollständige Palette von `#F5F6F0` bis `#36421F`
- **Secondary**: `#F5F6F0` (Creme/Beige)
- **Background**: `#F5F6F0` (Hintergrund)
- **Text**: `#222` (Dunkelgrau)

### Zusätzliche Farben
- **White**: `#fff`
- **Dark**: `#5A6B4B`

## Typografie

### Font-Familie
```css
font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Überschriften
- **H1**: `text-4xl sm:text-5xl` (36px/48px)
- **H2**: `text-3xl sm:text-4xl` (30px/36px)
- **H3**: `text-2xl sm:text-3xl` (24px/30px)

## Komponenten-Klassen

### Buttons
- `.btn-primary`: Primary-Button mit grüner Farbe
- `.btn-secondary`: Secondary-Button
- `.btn-outline`: Outline-Button

### Cards
- `.card`: Weiße Karte mit Schatten und Rundung

### Inputs
- `.input`: Standard Input-Feld mit Focus-States

### Badges
- `.badge-primary`: Primary Badge
- `.badge-secondary`: Secondary Badge

## Animationen

### Standard-Animationen
- `fade-in`: 0.3s ease-in-out
- `slide-up`: 0.4s ease-out
- `pulse-slow`: 3s pulse
- `gradient-x`: 15s gradient animation

### Custom Animationen
- `fadeIn`: 0.3s ease-out
- `slideInUp`: 0.5s ease-out
- `pulseSuccess`: 2s ease-in-out infinite

## Spacing System
- **1**: 4px
- **2**: 8px
- **3**: 12px
- **4**: 16px
- **5**: 20px
- **6**: 24px
- **8**: 32px
- **10**: 40px
- **12**: 48px
- **16**: 64px
- **20**: 80px
- **24**: 96px

## Spezielle Styles

### Range Slider
- **Thumb**: `#3b82f6` (Blau)
- **Hover**: `#2563eb` (Dunkelblau)
- **Focus**: Blauer Ring mit Transparenz

### Crop Area (ProfileImageCropper)
- **Border**: 2px solid `#3b82f6`
- **Border-Radius**: 12px
- **Shadow**: Blauer Schatten mit Transparenz
