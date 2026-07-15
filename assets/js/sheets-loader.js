/* ===========================================================
   Aasai Achagam — Google Sheets data source (optional)
   Reads a public Google Sheet and turns it into the same
   {shopName, categories:[{name,id,items:[...]}]} shape that
   data/products.data.js provides offline.

   Sheet columns expected:
   A: Category   B: Title   C: Description   D: Price (hidden)
   E: (spare)    F, G, H...: image URLs (one per column)
=========================================================== */
window.loadFromGoogleSheet = async function (cfg) {
  const range = `${cfg.sheetTabName}!A2:Z1000`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cfg.sheetId}/values/${encodeURIComponent(range)}?valueRenderOption=FORMULA&key=${cfg.sheetApiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Sheets request failed (${res.status}). Check sheetId / API key / sharing settings.`);
  }
  const json = await res.json();
  const rows = json.values || [];

  const categoriesById = {};
  const categoryOrder = [];

  rows.forEach((row, rowIndex) => {
    const [catName, title, desc, priceRaw, ...rest] = row;
    if (!catName || !title) return; // skip blank rows

    const imageCells = rest.slice(1); // rest[0] is spare column E, images start at F
    const images = imageCells
      .map(cell => extractImageUrl(cell))
      .filter(Boolean);

    if (images.length === 0) return; // no photos yet, skip this row

    const catId = slugify(catName);
    if (!categoriesById[catId]) {
      categoriesById[catId] = { name: catName, id: catId, items: [] };
      categoryOrder.push(catId);
    }

    const price = parseFloat(String(priceRaw).replace(/[^\d.]/g, "")) || 0;

    categoriesById[catId].items.push({
      id: `row-${rowIndex}-${slugify(title)}`,
      title: title,
      desc: desc || "",
      price: price,
      folder: null,      // images come from full URLs, not a local folder
      images: images      // full URLs, used as-is
    });
  });

  return {
    shopName: cfg.shopName || "Aasai Achagam",
    categories: categoryOrder.map(id => categoriesById[id])
  };
};

function extractImageUrl(cell) {
  if (!cell) return null;
  const text = String(cell).trim();
  if (!text) return null;

  // =IMAGE("https://...") formula
  const formulaMatch = text.match(/IMAGE\(\s*"([^"]+)"/i);
  if (formulaMatch) return resolveImageRef(formulaMatch[1]);

  return resolveImageRef(text);
}

function resolveImageRef(ref) {
  const text = ref.trim();
  if (!text) return null;

  // Full URL (Drive, imgur, etc.)
  if (/^https?:\/\//i.test(text)) return normalizeDriveUrl(text);

  // Local file path, e.g. "content\VC\2.png" or "content/VC/2.png" —
  // used as-is, relative to index.html, on your own computer/server.
  if (/\.(jpe?g|png|webp|gif|svg|avif)$/i.test(text)) {
    return text.replace(/\\/g, "/");
  }

  return null;
}

function normalizeDriveUrl(url) {
  // Convert a Google Drive "share" link into an embeddable image link.
  // drive.google.com/uc?export=view is unreliable for hotlinking (Google
  // often blocks it or shows a scan-warning page instead of the image),
  // so we use the thumbnail endpoint instead, which is meant for embedding.
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
                   || url.match(/[?&]id=([^&]+)/);
  if (driveMatch) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
  }
  return url;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
