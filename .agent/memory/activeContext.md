# Active Context

# Active Context

Aktueller Fokus:
- Nächste Schritte: Keine offenen Todos für die Benutzerverwaltung. Das Hilfe-Center und die Löschfunktion sind abgeschlossen.

Zuletzt erledigt:
- Implementierung der `deleteUser`-Methode in `AdminService` zum unwiderruflichen Löschen eines Benutzers inkl. aus `auth.users`.
- Hinzufügen des "Delete"-Buttons und des Bestätigungs-Modals ("LÖSCHEN") in der `UserManagement.tsx` Komponente.
- Migration/Erstellung der Supabase-Tabelle `help_resources`.
- Anpassung der RLS-Policy auf öffentlichen Lesezugriff ("für alle User zugänglich", nicht mehr nur Premium).
- Implementierung der `HelpCenterManagement.tsx` Komponente zur Datenpflege dieser Tabelle im `tigube-admin` Dashboard.
- Hinzufügen des Menüpunkts im Admin Sidebar/Layout.
