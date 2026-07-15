/* ===========================================================
   Aasai Achagam — catalog app
   Data source: a Google Sheet (see assets/js/config.js + sheets-loader.js).
=========================================================== */
(function(){
  const SHOP_NAME = "Aasai Achagam";
  const WATERMARK_LINE1 = "Aasai Achagam";
  const WATERMARK_LINE2 = "printed with aasai";
  const CURRENCY = "₹";

  let DATA = null;
  let activeCategoryId = null;
  let currentView = "card"; // 'card' | 'list'
  let currentSort = "default";

  // per-item carousel index, keyed by item id
  const carouselIndex = {};

  const galleryEl = document.getElementById("gallery");
  const tabsEl = document.getElementById("tabs");
  const emptyStateEl = document.getElementById("emptyState");
  const resultCountEl = document.getElementById("resultCount");
  const sortSelect = document.getElementById("sortSelect");
  const cardViewBtn = document.getElementById("cardViewBtn");
  const listViewBtn = document.getElementById("listViewBtn");
  const toastEl = document.getElementById("toast");

  // Lightbox elements
  const lightbox = document.getElementById("lightbox");
  const lbImage = document.getElementById("lbImage");
  const lbTitle = document.getElementById("lbTitle");
  const lbCounter = document.getElementById("lbCounter");
  const lbClose = document.getElementById("lbClose");
  const lbPrev = document.getElementById("lbPrev");
  const lbNext = document.getElementById("lbNext");
  const lbBackdrop = document.getElementById("lightboxBackdrop");
  const lbWatermark = document.querySelector("#lightbox .watermark-overlay");

  let lbState = { item: null, index: 0 };

  init();

  async function init(){
    const cfg = window.APP_CONFIG || {};
    if(cfg.shopName) document.getElementById("shopNameEl").textContent = cfg.shopName;
    if(cfg.tagline) document.getElementById("taglineEl").textContent = cfg.tagline;

    try{
      DATA = await window.loadFromGoogleSheet(cfg);
    }catch(err){
      console.error(err);
      showFatalError(`
        Could not load the catalog from Google Sheets.<br>
        <span style="font-size:13px;opacity:0.8;">${(err && err.message) || ""}</span><br><br>
        <span style="font-size:13px;opacity:0.8;">Check in <code>assets/js/config.js</code>: the sheet is shared as
        "Anyone with the link — Viewer", the <code>sheetId</code> and <code>sheetTabName</code> are correct, and the
        API key is valid and allowed for the Google Sheets API.</span>`);
      return;
    }

    if(!DATA.categories.length){
      showFatalError(`
        Connected to the sheet, but found no usable rows.<br><br>
        <span style="font-size:13px;opacity:0.8;">The most common cause: photos were added with
        Google Sheets' "Insert ▸ Image ▸ Image in cell" — that pastes a picture with no link a
        script can read. Instead, paste the image's direct URL as text in the cell (columns F
        onward), or use <code>=IMAGE("https://your-image-url")</code>. Also double-check column A
        has a category name and column B has a title for every row.</span>`);
      return;
    }

    activeCategoryId = DATA.categories[0]?.id || null;
    renderTabs();
    renderGallery();
    bindGlobalControls();
  }

  function showFatalError(html){
    galleryEl.innerHTML = `<p style="text-align:center;padding:40px;color:#A31621;">${html}</p>`;
  }

  // Resolves an image reference for an item: local items store filenames next
  // to a "folder", Google Sheet items store full image URLs directly.
  function imgSrc(item, idx){
    const raw = item.images[idx];
    return item.folder ? `${item.folder}/${raw}` : raw;
  }

  function renderTabs(){
    tabsEl.innerHTML = "";
    DATA.categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "tab-btn" + (cat.id === activeCategoryId ? " active" : "");
      btn.textContent = cat.name;
      btn.setAttribute("data-cat", cat.id);
      btn.addEventListener("click", () => {
        activeCategoryId = cat.id;
        [...tabsEl.children].forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
        renderGallery();
      });
      tabsEl.appendChild(btn);
    });
  }

  function bindGlobalControls(){
    sortSelect.addEventListener("change", e => {
      currentSort = e.target.value;
      renderGallery();
    });

    cardViewBtn.addEventListener("click", () => setView("card"));
    listViewBtn.addEventListener("click", () => setView("list"));

    lbClose.addEventListener("click", closeLightbox);
    lbBackdrop.addEventListener("click", closeLightbox);
    lbPrev.addEventListener("click", () => stepLightbox(-1));
    lbNext.addEventListener("click", () => stepLightbox(1));
    document.addEventListener("keydown", e => {
      if(lightbox.hidden) return;
      if(e.key === "Escape") closeLightbox();
      if(e.key === "ArrowLeft") stepLightbox(-1);
      if(e.key === "ArrowRight") stepLightbox(1);
    });
  }

  function setView(view){
    currentView = view;
    galleryEl.classList.toggle("card-view", view === "card");
    galleryEl.classList.toggle("list-view", view === "list");
    cardViewBtn.classList.toggle("active", view === "card");
    listViewBtn.classList.toggle("active", view === "list");
    cardViewBtn.setAttribute("aria-pressed", view === "card");
    listViewBtn.setAttribute("aria-pressed", view === "list");
  }

  function getActiveItems(){
    const cat = DATA.categories.find(c => c.id === activeCategoryId);
    if(!cat) return [];
    let items = cat.items.slice();
    if(currentSort === "price-asc") items.sort((a,b) => a.price - b.price);
    if(currentSort === "price-desc") items.sort((a,b) => b.price - a.price);
    return items;
  }

  function renderGallery(){
    const items = getActiveItems();
    resultCountEl.textContent = `${items.length} design${items.length===1?"":"s"}`;
    emptyStateEl.hidden = items.length !== 0;
    galleryEl.innerHTML = "";

    items.forEach(item => {
      if(!(item.id in carouselIndex)) carouselIndex[item.id] = 0;
      galleryEl.appendChild(buildCard(item));
    });
  }

  function watermarkMarkup(){
    // repeated diagonal watermark grid - visible on screen & in screenshots
    return `<div class="watermark-overlay">${wmTextInner()}</div>`;
  }

  function wmTextInner(){
    let cells = "";
    for(let i=0;i<12;i++){
      cells += `<span>${WATERMARK_LINE1}</span>`;
    }
    return `<div class="wm-text">${cells}</div>`;
  }

  function buildCard(item){
    const card = document.createElement("article");
    card.className = "item-card";
    card.setAttribute("data-item", item.id);

    const idx = carouselIndex[item.id];

    card.innerHTML = `
      <div class="card-media">
        <button class="share-btn" title="Share on WhatsApp" aria-label="Share">
          <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8.9-.1.2-.3.2-.6.1-.2-.1-1-.4-2-1.2-.7-.6-1.2-1.4-1.4-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.1.2-.3.2-.4 0-.2 0-.3-.1-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s1 2.6 1.1 2.8c.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.2-.3-.2-.5-.3z"/></svg>
        </button>
        <img src="${imgSrc(item, idx)}" alt="${item.title}" loading="lazy">
        ${watermarkMarkup()}
        ${item.images.length > 1 ? `
          <button class="carousel-btn prev" aria-label="Previous photo">&#10094;</button>
          <button class="carousel-btn next" aria-label="Next photo">&#10095;</button>
          <div class="carousel-dots">
            ${item.images.map((_,i)=>`<span class="${i===idx?'active':''}"></span>`).join("")}
          </div>` : ""}
      </div>
      <div class="card-body">
        <p class="card-title">${item.title}</p>
        ${item.desc ? `<p class="card-sub">${item.desc}</p>` : ""}
      </div>
    `;

    const imgEl = card.querySelector(".card-media img");
    imgEl.addEventListener("click", () => openLightbox(item, carouselIndex[item.id]));

    const prevBtn = card.querySelector(".carousel-btn.prev");
    const nextBtn = card.querySelector(".carousel-btn.next");
    if(prevBtn) prevBtn.addEventListener("click", (e) => { e.stopPropagation(); shiftCarousel(item, -1, card); });
    if(nextBtn) nextBtn.addEventListener("click", (e) => { e.stopPropagation(); shiftCarousel(item, 1, card); });

    // basic touch swipe
    let touchStartX = null;
    const media = card.querySelector(".card-media");
    media.addEventListener("touchstart", e => touchStartX = e.touches[0].clientX, {passive:true});
    media.addEventListener("touchend", e => {
      if(touchStartX===null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if(Math.abs(dx) > 40) shiftCarousel(item, dx < 0 ? 1 : -1, card);
      touchStartX = null;
    }, {passive:true});

    card.querySelector(".share-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      shareItem(item);
    });

    return card;
  }

  function shiftCarousel(item, dir, cardEl){
    const n = item.images.length;
    carouselIndex[item.id] = (carouselIndex[item.id] + dir + n) % n;
    const idx = carouselIndex[item.id];
    cardEl.querySelector(".card-media img").src = imgSrc(item, idx);
    const dots = cardEl.querySelectorAll(".carousel-dots span");
    dots.forEach((d,i) => d.classList.toggle("active", i===idx));
  }

  /* ---------------- Lightbox ---------------- */
  function openLightbox(item, index){
    lbState = { item, index };
    if(lbWatermark) lbWatermark.innerHTML = wmTextInner();
    updateLightbox();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox(){
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }
  function stepLightbox(dir){
    const n = lbState.item.images.length;
    lbState.index = (lbState.index + dir + n) % n;
    updateLightbox();
  }
  function updateLightbox(){
    const { item, index } = lbState;
    lbImage.src = imgSrc(item, index);
    lbImage.alt = item.title;
    lbTitle.textContent = item.title;
    lbCounter.textContent = `${index+1} / ${item.images.length}`;
    lbPrev.style.display = item.images.length > 1 ? "" : "none";
    lbNext.style.display = item.images.length > 1 ? "" : "none";
    // keep card carousel in sync with lightbox browsing
    carouselIndex[item.id] = index;
    const cardEl = document.querySelector(`.item-card[data-item="${item.id}"]`);
    if(cardEl){
      const img = cardEl.querySelector(".card-media img");
      if(img) img.src = lbImage.src;
      const dots = cardEl.querySelectorAll(".carousel-dots span");
      dots.forEach((d,i) => d.classList.toggle("active", i===index));
    }
  }

  /* ---------------- Watermark + Share ---------------- */
  function loadImage(src){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function watermarkToBlob(src){
    const img = await loadImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // tiled diagonal watermark baked into the actual image file
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(-28 * Math.PI/180);
    ctx.translate(-canvas.width/2, -canvas.height/2);

    const fontSize = Math.max(16, Math.round(canvas.width/22));
    ctx.font = `${fontSize}px Georgia, serif`;
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1;
    ctx.textAlign = "center";

    const stepX = canvas.width/2.2;
    const stepY = canvas.height/7;
    for(let y = -canvas.height; y < canvas.height*2; y += stepY){
      for(let x = -canvas.width; x < canvas.width*2; x += stepX){
        ctx.strokeText(WATERMARK_LINE1, x, y);
        ctx.fillText(WATERMARK_LINE1, x, y);
      }
    }
    ctx.restore();

    // small solid brand tag, bottom-right, always legible
    const tagPad = Math.round(canvas.width*0.02);
    ctx.font = `600 ${Math.max(14, Math.round(canvas.width/28))}px Georgia, serif`;
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(canvas.width - tagPad*13, canvas.height - tagPad*4, tagPad*12, tagPad*3);
    ctx.fillStyle = "#FFF6E9";
    ctx.fillText(`${WATERMARK_LINE1} · ${WATERMARK_LINE2}`, canvas.width - tagPad, canvas.height - tagPad*2);

    return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.92));
  }

  async function shareItem(item){
    // Open the tab immediately, synchronously, while we're still inside the
    // click handler — browsers block window.open() called after an `await`
    // because it no longer looks like a direct response to the user's tap.
    // We navigate this pre-opened tab once the watermarked images are ready.
    const preOpenedTab = window.open("", "_blank");

    showToast("Preparing watermarked photos…");
    try{
      const blobs = await Promise.all(item.images.map((_, i) => watermarkToBlob(imgSrc(item, i))));
      const files = blobs.map((b,i) => new File([b], `${item.id}-${i+1}.jpg`, {type:"image/jpeg"}));
      const shareText = `${item.title}\n${SHOP_NAME} — we print ur aasai..!`;

      if(navigator.canShare && navigator.canShare({files})){
        if(preOpenedTab) preOpenedTab.close(); // not needed for the native share sheet
        await navigator.share({ files, title: item.title, text: shareText });
        showToast("Shared!");
        return;
      }

      // fallback: download watermarked images, then open WhatsApp with the caption
      files.forEach((file, i) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText + "\n(photos downloaded — attach them in WhatsApp)")}`;
      if(preOpenedTab){
        preOpenedTab.location.href = waUrl;
      } else {
        // pop-up was blocked outright — fall back to navigating this tab
        window.location.href = waUrl;
      }
      showToast("Photos downloaded — attach them in the WhatsApp chat that opened.");
    }catch(err){
      console.error(err);
      const shareText = `${item.title}\n${SHOP_NAME} — we print ur aasai..!\n${imgSrc(item, 0)}`;
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      if(preOpenedTab){
        preOpenedTab.location.href = waUrl;
      } else {
        window.location.href = waUrl;
      }
      showToast("Couldn't stamp the watermark (often a hosting/CORS limit on the image) — opened WhatsApp with a plain link instead.");
    }
  }

  function showToast(msg){
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toastEl.hidden = true; }, 3200);
  }
})();
