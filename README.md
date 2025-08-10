# Lumora — Minimal Financial Insights (Decap CMS + GitHub Pages)

A typography-first, image-free blog tailored for finance professionals. Writers publish through a no‑code CMS at `/admin`. Homepage shows three categories: **Market Insights**, **Equity Research**, **Trade Ideas**.

## What’s included
- `index.html` — Homepage with three sections; each renders recent articles for that category.
- `article.html` — Clean reader page (no images), serif title, metadata, body.
- `style.css` — Two-font system (Lora for H1/H2, Inter elsewhere), generous negative space, strict 800px max width.
- `script.js` — Fetches `content.json`; renders homepage lists + article page.
- `admin/index.html`, `admin/config.yml` — Decap CMS.
- `_articles/` — Markdown posts (created by CMS).
- `.github/workflows/build-content.yml` — Aggregates all posts into `content.json` (title/date/category/summary/slug/path).
- `.nojekyll` — Ensures GitHub Pages serves the `_articles` directory.
- Sample posts: one per category so the homepage isn’t empty on first deploy.

## Deploy (GitHub Pages)
1. Create a new GitHub repository and upload **everything** in this folder to the repo root.
2. Repo → **Settings → Pages** → Branch: `main` → Save.
3. Visit `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

## Enable the CMS (two options)
**Option A — Netlify (easiest)**
1. Import your GitHub repo into Netlify.
2. Enable *Identity* → Settings: enable *Git Gateway*.
3. In `admin/config.yml`, keep `backend: git-gateway`.
4. Go to `https://YOUR-NETLIFY-SITE.netlify.app/admin/` → sign up/log in. Writers can now publish.

**Option B — GitHub backend (no Netlify)**
1. Create a GitHub OAuth app (Decap docs) and switch `admin/config.yml`:
   ```yaml
   backend:
     name: github
     repo: your-github-username/your-repo-name
     branch: main
   ```
2. Deploy on GitHub Pages; login via GitHub OAuth at `/admin`.

## Writer workflow
- Open `/admin` → “New Blog Article”
- Fields:
  - **Title** (string)
  - **Publish Date** (datetime)
  - **Category**: *Market Insights* | *Equity Research* | *Trade Ideas*
  - **Summary**: 2–3 sentence overview (shown on homepage)
  - **Body** (markdown)
- Publishing creates a new Markdown file in `_articles/`.
- The **GitHub Action** runs, reads frontmatter, and writes `content.json` at repo root.
- Front-end fetches `content.json` and renders automatically.

## Notes
- Stick to text—no images by design.
- If the Action hasn’t run yet, `content.json` is pre-populated so the site loads instantly.
- If a category has no posts, the homepage shows “No recent research available in this category.”
