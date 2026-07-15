/* ===========================================================
   Aasai Achagam — configuration
   The catalog is read live from a Google Sheet. Fill in the
   three values below to point it at your sheet.
=========================================================== */
window.APP_CONFIG = {
  // 1. Create a Google Sheet with one tab. Columns:
  //      A: Category name   (e.g. "Marriage Invitation")
  //      B: Item title
  //      C: Description
  //      D: Price  (used only for sorting — never shown on the page)
  //      E: (leave blank / spare column)
  //      F onward: image URLs, one per column, as many as the item needs
  //    Do NOT use Insert > Image > Image in cell - that pastes a picture
  //    with no link a script can read. Paste the image's direct URL as
  //    text instead, or use =IMAGE("https://your-image-url").
  //
  // 2. Share the sheet: File > Share > "Anyone with the link - Viewer".
  //
  // 3. Get a free API key: console.cloud.google.com -> APIs & Services ->
  //    Credentials -> Create API key -> restrict it to "Google Sheets API".

  
  //my ref link -https://docs.google.com/spreadsheets/d/1IJZapLt2NGUSY7Hs-RsNzTVGNZBYrLpsX5QH3FNbyYE/edit?usp=sharing
  //AIzaSyAkdcZHIXgViyMspRxq_dsMmTo56DFKXZA
  sheetId: "1IJZapLt2NGUSY7Hs-RsNzTVGNZBYrLpsX5QH3FNbyYE",
  sheetTabName: "Sheet1",
  sheetApiKey: "AIzaSyAkdcZHIXgViyMspRxq_dsMmTo56DFKXZA",

  shopName: "Aasai Achagam",
  tagline: "we print ur aasai..!"
};
