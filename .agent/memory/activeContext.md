# Active Context

# Active Context

Aktueller Fokus:
- Verifizierung von Benutzern auf den Tab "Verifizierung" eingeschränkt und manuelle Ausweisprüfung via Checkbox erzwungen.
- Fehlerbehebung im Blog CMS: Speichern von Entwürfen korrigiert.
- Implementierung der Bild-Upload-Funktionalität für Blog/News Cover-Bilder.
- Implementierung der Kategorie/Tag-Erstellung, Bearbeitung und Löschung direkt im Editor.

Zuletzt erledigt:
- Bugfix: `BlogCms.tsx` aktualisiert, um `selectedItem` beim Bearbeiten korrekt zu setzen und die Slug-Synchronisierung via functional state updates robust zu gestalten.
- Entfernen der Verifizierungs-Aktionen aus `UserManagement.tsx`.
- Hinzufügen einer Checkbox "Ausweis wurde überprüft" in `VerificationManagement.tsx`.
- Logik-Anpassung: Der "Verifizieren"-Button ist nun erst nach Bestätigung der Checkbox aktiv.
- Sicherstellung, dass der State (`isIdChecked`) beim Schließen des Modals oder nach Erfolg zurückgesetzt wird.
- **NEU**: `AdminService.ts` um `uploadContentImage` erweitert (mit Fallback-Mechanismus für Buckets).
- **NEU**: `BlogCms.tsx` UI für Cover-Bilder überarbeitet (Toggle zwischen URL und Upload).
- **NEU**: `BlogCms.tsx` um Kategorie- und Tag-Verwaltung erweitert (Inline Edit, Löschen).
- **NEU**: `AdminService.ts` um CRUD-Methoden für Kategorien und Tags erweitert.
- **NEU**: Fehler beim Speichern von Entwürfen durch korrektes Setzen von `selectedItem` in `handleEdit` behoben.
