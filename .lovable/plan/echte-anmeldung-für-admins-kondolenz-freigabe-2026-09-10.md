# Echte Anmeldung für Admins + Kondolenz-Freigabe

Beide Meldungen sind bestätigt: Es gibt in der App gar keine Anmeldung. Der "Admin-Modus" ist nur ein Schalter im Browser-Speicher. Deshalb

- kann niemand eine Kondolenz freigeben (sie bleiben für immer unsichtbar), und
- schlägt jedes Speichern beim Bearbeiten einer Traueranzeige fehl.

## Was gebaut wird

1. **Anmeldeseite `/admin/login`**
   E-Mail + Passwort. Nach dem Anmelden wird geprüft, ob das Konto Admin-Rechte hat.

2. **Admin-Bereich geschützt**
   `/admin` und der Bearbeiten-Knopf auf einer Gedenkseite erscheinen nur noch bei echter Anmeldung mit Admin-Rolle. Der Browser-Speicher-Schalter entfällt.

3. **Neue Karte "Kondolenzen" im Admin-Bereich**
   Liste aller eingereichten Kondolenzen mit Name, Nachricht, Datum, Traueranzeige; Knöpfe "Freigeben" und "Löschen". Aufklappbar wie die übrigen Karten.

4. **Bearbeiten speichert wieder**
   Regel in der Datenbank ergänzen, damit Admins Traueranzeigen ändern und löschen dürfen.

## Technische Details

- Neue Seite `src/pages/Auth.tsx` mit `supabase.auth.signInWithPassword`, Route in `App.tsx`.
- Neuer Hook `src/hooks/useAdmin.ts`: `getSession` + `onAuthStateChange` + RPC `has_role(uid,'admin')`.
- `Admin.tsx`: Ersetzt `localStorage.getItem("isAdmin")` durch den Hook, leitet ohne Admin-Rolle auf `/admin/login` um; entfernt den Admin-Modus-Umschalter; neue Collapsible-Karte, die `condolences` (alle Spalten außer `author_email` nur für Admins nötig) lädt und `is_approved` setzt bzw. Zeilen löscht.
- `ObituaryDetail.tsx` Zeile 108: `isAdmin` kommt aus dem Hook statt aus localStorage/Query-Param.
- Migration: Policies auf `public.obituaries` für Admins:
  `CREATE POLICY "Admins can update obituaries" ON public.obituaries FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));` analog für DELETE.
- Bestehende Admin-Policies auf `condolences` (UPDATE/DELETE/SELECT) reichen bereits aus.

## Hinweis

Damit sich jemand anmelden kann, braucht es ein Konto mit Admin-Rolle. Nach dem Einbau lege ich ein Konto an, sobald du mir eine E-Mail-Adresse nennst — oder ich vergebe die Admin-Rolle an ein Konto, das du selbst registrierst.
