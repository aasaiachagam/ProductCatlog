# Aasai Achagam — Product Catalog Website

A static site whose entire catalog — categories, titles, descriptions, prices, and photos —
lives in **one Google Sheet**. Edit the sheet, refresh the page, done. No git, no folders,
no re-uploading files for every new design.

Note: because the catalog now lives in a Google Sheet, the page needs an internet
connection to load the sheet data (it can still be opened by double-clicking `index.html`,
or hosted anywhere — either way, it fetches live from Google when it loads).

## What's inside

```
index.html                     → the page
assets/css/style.css           → all styling (South Indian festive theme)
assets/js/config.js            → your Sheet ID, tab name, and API key go here
assets/js/sheets-loader.js     → reads the sheet and turns rows into the catalog
assets/js/app.js               → all behaviour (tabs, views, carousel, lightbox, share)
```

## 1. Set up your Google Sheet

Create a sheet with **one tab**. Columns, left to right:

| A (Category) | B (Title) | C (Description) | D (Price) | E (spare) | F, G, H… (Images) |
|---|---|---|---|---|---|
| Marriage Invitation | Golden Floral Card | Gold foil, floral border | 150 | | image URL 1 | image URL 2 | … |

- **Column A** must exactly match one of your category names (Marriage Invitation, House
  Warming Invitations, Others Invitation, Brochures / Notices, Business Cards & others,
  Kovil and related items). A new name automatically becomes a new tab/category on the page.
- **Column D (price)** is used only to power the Sort dropdown — it is **never shown**
  anywhere on the page.
- **Columns F onward**: one image per column, as many as that item needs.
  **Important** — Google's "Insert ▸ Image ▸ Image in cell" pastes an uploaded picture that
  no script can read (this is the #1 reason the page shows "no designs"). Instead:
  - paste the image's **direct URL** as plain text in the cell, or
  - use the formula `=IMAGE("https://your-image-url")` — the loader reads the URL back out
    of the formula automatically.
  Easiest free ways to get a URL: upload to Google Drive → right-click → **Share** → "Anyone
  with the link", then use that link (auto-converted to a direct-view link); or use any
  image host like imgur/postimages and paste that URL directly.
- Share the sheet itself: **File → Share → Share with others → Anyone with the link: Viewer**.

## Image sources — three options work in the F, G, H… columns

1. **A direct image URL** (imgur, postimages, your own site, GitHub raw, etc.) — most reliable.
2. **A Google Drive share link** — paste the normal "Anyone with the link" URL you get from
   Drive's Share button (looks like `https://drive.google.com/file/d/FILE_ID/view?...`). The
   site automatically converts it to Drive's embeddable thumbnail link. The file must be
   shared as "Anyone with the link — Viewer", or it won't load for visitors.
3. **A local file path** on your own computer/server, e.g. `content\VC\2.png` or
   `content/VC/2.png` — put a `content` folder next to `index.html` with your photos inside,
   and reference them this way. This only works when you're browsing the page from that same
   folder/server (not useful once hosted somewhere your visitors can't reach that path) — so
   use this for local testing, and switch to a real URL before sharing the link with customers.

## 2. Get a free API key

console.cloud.google.com → APIs & Services → Credentials → Create API key → restrict it to
**Google Sheets API** only.

## 3. Point the site at your sheet

Open `assets/js/config.js` and fill in:

```js
sheetId: "your-sheet-id-from-the-url",
sheetTabName: "Sheet1",       // exact tab name at the bottom of your sheet
sheetApiKey: "your-api-key",
```

The sheet ID is the long string in your sheet's URL:
`https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`.

Refresh `index.html` — your designs should appear.

## If it still shows "no designs"

The page now tells you why instead of a generic message. Common causes, in order of
likelihood:
1. Images were pasted with "Insert ▸ Image" instead of as a URL — see column F guidance above.
2. The sheet isn't shared as "Anyone with the link – Viewer".
3. `sheetTabName` in config.js doesn't exactly match your tab's name.
4. The API key is missing, wrong, or not enabled for the Sheets API.

## Watermarking & Sharing to WhatsApp

- Every photo shown on the page has a diagonal on-screen watermark, so a screenshot
  captures it automatically — this also appears correctly in the full-screen viewer.
- Tapping the **share icon** on a card bakes a second watermark directly into the actual
  image file (via canvas) before handing it to WhatsApp. On Android Chrome, this opens the
  native share sheet straight into the WhatsApp app; elsewhere it downloads the watermarked
  photos and opens a WhatsApp chat (app or web) with a caption so you attach them manually.
- One real limitation: baking the watermark requires the image host to allow cross-site
  reads (CORS). Google Drive links don't always send the right headers for this — if that
  happens, the site now automatically falls back to opening WhatsApp with a plain link
  instead of failing silently, but you won't get the baked-in watermark for that photo. If
  this happens a lot, re-host that image on imgur/GitHub/your own site instead of Drive.

## Two views + full-screen viewing

- Toggle **Card view** / **List view** with the icons in the toolbar.
- Each card's photos can be swiped left/right (buttons on desktop, swipe on touch).
- Click/tap any photo to open the full-screen viewer, with arrow-key or on-screen
  navigation between all photos in that item.

## Footer

The footer links to your Google profile:
`https://share.google/m95WsFo0aLoLmU81n` — change this in `index.html` if it ever changes.

## Hosting (optional)

You can leave this as a local file, or host it anywhere static (GitHub Pages, Netlify, your
own web host). Hosting doesn't change how the data loads — it always pulls live from the
Google Sheet either way.
