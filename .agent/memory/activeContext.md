# Active Context

# Active Context

Aktueller Fokus:
- Verifizierung von Benutzern auf den Tab "Verifizierung" eingeschränkt und manuelle Ausweisprüfung via Checkbox erzwungen.

Zuletzt erledigt:
- Entfernen der Verifizierungs-Aktionen aus `UserManagement.tsx`.
- Hinzufügen einer Checkbox "Ausweis wurde überprüft" in `VerificationManagement.tsx`.
- Logik-Anpassung: Der "Verifizieren"-Button ist nun erst nach Bestätigung der Checkbox aktiv.
- Sicherstellung, dass der State (`isIdChecked`) beim Schließen des Modals oder nach Erfolg zurückgesetzt wird.
