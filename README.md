# Lumora (Minimal, Dual‑Mode)

Ultra‑minimal site for finance pros — neutral grey/white/black/blue, lots of negative space, zero decorative images.

## Modes
- **Static mode (default)**: Works out of the box. Articles come from `data/articles.json`. Login/Dashboard/Editor disabled.
- **Firebase mode (optional)**: Paste your Firebase config in `script.js` to enable writer login, dashboard, editor and publishing (Firestore + Storage).

## Files
- Public pages: `index.html`, `insights.html`, `equity.html`, `article.html`, `contact.html`, `login.html`, `dashboard.html`, `editor.html`, `sitemap.html`
- Assets: `style.css`, `script.js`
- Data (static mode): `data/articles.json`

## Fix “File not found” (GitHub Pages)
- Ensure **`index.html` is at the repo root** (not inside a subfolder).
- Push to GitHub, then Settings → **Pages** → Branch: `main` → Save.
- Use **relative links** like `insights.html` (already done).
- If your site is at `username.github.io/repo`, visiting `username.github.io/repo/insights.html` should work. A 404 usually means the file isn’t in the repo root or case mismatch (macOS is case‑insensitive, GitHub is case‑sensitive).

## Firebase setup (optional)
1. Create Firebase project → Add Web App → copy config → paste into `script.js` (`LUMORA.firebaseConfig`).
2. Enable **Email/Password** auth.
3. Firestore: start in **production** mode.
4. (Optional but recommended) Add security rules:
   - Articles read: public if `published: true`
   - Create/Update/Delete: writer only

You can reuse rules from the previous ZIP if you want role‑based writers.

## Edit articles (static mode)
Open `data/articles.json` and add entries:
```json
{
  "slug": "my-note",
  "title": "My Note",
  "type": "insights",
  "tags": ["Macro"],
  "date": "2025-09-01",
  "summary": "One-liner.",
  "content_html": "<p>Write body in HTML.</p>"
}
```
Commit & push. The lists and article page update automatically.

## Writer flow (Firebase mode)
Login → Dashboard → New Article → Save/Publish. Public pages auto‑read from Firestore.

