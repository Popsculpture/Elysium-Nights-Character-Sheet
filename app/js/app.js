/* ===========================================================================
   ELYSIUM NIGHTS · #GRID Smartdeck OS bootstrap
   Boot sequence, tab routing, OS chrome, autosave indicator.

   TWO DESKTOPS SHARE THIS OS AND NOTHING ELSE. The Freelancer portal is the
   seven player tabs; the Admin portal is the GM toolkit on its own rail. A
   tab's `portal` field says which one it belongs to and is never inferred,
   because which desktop a tab lands on is exactly what a silent default gets
   wrong. Tab KEYS MUST STAY UNIQUE ACROSS BOTH RAILS: gotoTab's portal
   resolution and _lastTab's scroll restore both depend on that silently.
   =========================================================================== */
window.EN = window.EN || {};

EN.app = (function () {
  var el = EN.ui.el, store = EN.store;

  // The Admin desktop is drawn entirely by the GM modules. If they are deleted
  // the desktop does not exist, the splash offers one card, and the app is
  // exactly the player-only app it was before the toolkit landed.
  function adminReady() { return !!(EN.gmView && EN.gmStore && EN.gmEngine); }

  /* The Freelancer rail is for REGISTERED Freelancers. Until the active record
     has been through #PRINT's Submit & File (which stamps meta.filedAt), the
     rail hides everything but the gear: an unfiled draft gets the wizard and
     nothing else. #PRINT itself is never gated on this, or a draft could never
     reach the step that files it. An example counts as registered: it is a
     finished demo record that cannot be stored, and the tabs are what it is
     for. Records from before the gate shipped are grandfathered in store.js.
     The first `gated` that reads character state rather than module presence;
     it is re-evaluated on every render, which is every store change, so the
     rail appears the moment a record is filed with no further plumbing. */
  function registered() {
    var ch = EN.store.active();
    if (!ch) return false;
    if (EN.store.activeIsExample && EN.store.activeIsExample()) return true;
    return !!(ch.meta && ch.meta.filedAt);
  }

  // Tabs. Only "#PRINT" is built today on the Freelancer side; the rest read
  // the same character record once they're implemented (the foundation is
  // shared). #PRINT lives last: you create + file a record there, then it
  // becomes the place to level up. Tapping it lands on the Advance step
  // (onSelect), since advancing is the usual reason to return.
  /* A tab may carry an SVG icon instead of a text glyph. The Codex wears the author's own art
     (a book with a question mark, from book-question-icon.svg, its path copied unchanged); it
     is inline rather than an <img> so it takes the tab's current colour on every skin, and
     `glyph` stays beside it for the stub page and anything else that wants a character. */
  // the author's anonymous figure (a fedora and a masked face), for #GRID; the author reviewed
  // two candidates for this tab and picked this one for holding up at the rail's actual size,
  // where the first (a hooded figure at a terminal) had lost its detail to a blur
  var ICON_GRID = '<svg viewBox="0 0 495 511.962" fill="currentColor" aria-hidden="true"><path d="M62.686 511.962h372.371l-36.089-62.816L495 366.77c-28.169-39.57-62.177-73.186-83.426-82.313 4.492-11.642 5.27-13.683 1.515-20.139 39.914-11.352 66.091-27.943 66.035-49.863-.059-23.9-34.387-46.861-85.543-54.849-12.249-51.822-24.432-92.624-39.938-119.402-2.82-4.867-5.749-9.275-8.811-13.195-46.162-59.204-62.34-2.606-95.067-2.672-37.938-.077-42.766-52.014-92.236-3.124-5.32 5.258-10.296 11.648-14.938 19.092-16.825 26.955-29.385 67.801-38.669 119.301-54.538 10.31-88.209 33.076-87.091 56.325 1.012 21.062 27.574 37.207 67.494 48.355-2.624 8.118-2.006 9.511 1.55 19.503C56.059 296.357 24.902 334.551 0 367.998l96.902 81.148-34.216 62.816zm184.129-101.745c8.695 0 15.746 7.053 15.746 15.748 0 8.693-7.051 15.746-15.746 15.746s-15.745-7.053-15.745-15.746c0-8.695 7.05-15.748 15.745-15.748zm-43.494-72.864c0-2.911.483-5.876 1.432-8.873 1.994-6.363 5.997-12.39 10.917-16.854 5.737-5.213 12.947-8.985 20.488-10.746 17.9-4.172 40.37.352 51 16.562l.13.219c6.033 9.281 7.471 22.053 2.16 31.982-3.503 6.559-7.651 10.311-12.944 15.198l-8.663 7.843-2.411 2.272c-3.162 3.131-4.364 4.935-5.562 9.672l-.796 3.524c-.68 3.494-2.097 6.189-4.242 8.059l-.207.165c-2.216 1.841-5.06 2.767-8.512 2.767-3.698 0-6.876-1.234-9.45-3.695-1.349-1.293-2.352-2.885-3.009-4.758-.612-1.757-.917-3.731-.917-5.914 0-8.881 2.663-16.615 8.725-23.186 4.405-4.781 9.548-9.13 14.42-13.45 3.604-3.29 7.683-6.95 7.683-12.207 0-8.204-7.05-12.6-14.532-12.6-7.61 0-11.106 2-14.668 8.642-1.131 2.121-2.166 4.573-3.089 7.352-1.125 3.674-2.805 6.494-5.033 8.44-8.662 7.557-22.92.622-22.92-10.414zM379.85 268.38l.538 3.545 3.092 20.384c30.035-5.503 9.778 69.444-14.87 65.515-4.251 13.322-7.139 39.976-10.879 49.934-34.937 93-184.185 87.349-219.85-6.156-3.527-9.243-6.82-35.042-10.903-46.838-26.757 6.684-43.251-69.348-13.819-62.836l3.373-20.225.574-3.447.305-1.819c83.026 18.029 182.824 16.091 262.214.455l.225 1.488zm-260.025-97.561l7.198-24.639c46.656 39.159 207.874 33.023 243.016 0l6.065 24.639c-40.982 43.351-212.466 37.461-256.279 0z"/></svg>';
  // the author's linked figures (three networked contacts), for Social
  var ICON_SOCIAL = '<svg viewBox="0 0 122.88 119.91" fill="currentColor" aria-hidden="true"><path d="M20,52a4.32,4.32,0,0,1-7.79-3.73A52.4,52.4,0,0,1,15,43.09a54.42,54.42,0,0,1,3.4-4.83l.06-.08a55.27,55.27,0,0,1,3.83-4.33,54.44,54.44,0,0,1,4.36-4l0,0a4.33,4.33,0,0,1,3.15-.93,4.27,4.27,0,0,1,2.89,1.56l0,0a4.33,4.33,0,0,1,.93,3.15,4.27,4.27,0,0,1-1.56,2.89h0a44.87,44.87,0,0,0-3.68,3.34A44.45,44.45,0,0,0,20,52ZM8.91,95.49l.25-.19c2.57-1.53,6.46-1.13,9-2.9a5.41,5.41,0,0,0,.47-.91c.24-.54.45-1.13.59-1.53a18.83,18.83,0,0,1-1.54-2.2l-1.56-2.48A4.54,4.54,0,0,1,15.23,83a1.79,1.79,0,0,1,.15-.82,1.44,1.44,0,0,1,.53-.62,1.93,1.93,0,0,1,.38-.19,41.2,41.2,0,0,1-.07-4.46,5.64,5.64,0,0,1,2.83-4.37,8.36,8.36,0,0,1,2.2-1c.5-.14-.42-1.72.09-1.77,2.48-.26,6.49,2,8.21,3.87a6,6,0,0,1,1.53,3.83l-.09,4h0a1.13,1.13,0,0,1,.82.85,3.54,3.54,0,0,1-.43,2.13h0l0,0-1.77,2.93a15.8,15.8,0,0,1-2.18,3,4,4,0,0,0,.23.34,10.37,10.37,0,0,0,1.16,1.5s0,0,0,0c2,1.45,7,1.8,8.94,2.86l.07,0,.24.19a19.11,19.11,0,0,0-1-25.74L37,69.64A19.11,19.11,0,0,0,8.91,95.49ZM23.5,59.65a23.41,23.41,0,0,1,16.61,6.88l.13.14a23.49,23.49,0,0,1-.13,33.09l-.14.13A23.49,23.49,0,1,1,23.5,59.65ZM85.56,96.11c1.91-1.68,6-2.1,8.51-3.58,2.2-1.32,1.82-2.65,1.81-4.83H92.39c-9.06,0-3.09.71-1.86-9.13,1.84-13.9,15.84-13.91,17.91,0,1.32,9.47,7,9.13-1.87,9.13H103c0,2.41-.39,3.64,2.11,5,1.86,1,6.09,1.65,8.12,3.33A19.12,19.12,0,0,0,113,69.5l-.12-.1A19.11,19.11,0,0,0,86,69.28l-.11.12a19.13,19.13,0,0,0-.31,26.71Zm13.82-36.7A23.44,23.44,0,0,1,116,66.29l.12.14A23.48,23.48,0,0,1,116,99.52l-.14.13a23.47,23.47,0,0,1-33.09-.13l-.13-.13a23.48,23.48,0,0,1,.13-33.1l.13-.13a23.44,23.44,0,0,1,16.48-6.75ZM48.72,35.84l.25-.2c2.58-1.52,6.46-1.12,9-2.89a7.53,7.53,0,0,0,.47-.91c.23-.54.45-1.13.58-1.53a20.12,20.12,0,0,1-1.54-2.2l-1.56-2.48A4.54,4.54,0,0,1,55,23.36a1.78,1.78,0,0,1,.15-.81,1.46,1.46,0,0,1,.54-.62,1.5,1.5,0,0,1,.38-.19A38.76,38.76,0,0,1,56,17.28a5.8,5.8,0,0,1,.19-1,6,6,0,0,1,2.64-3.36,8.42,8.42,0,0,1,2.21-1c.49-.14-.42-1.72.09-1.78,2.47-.25,6.48,2,8.21,3.88a6.11,6.11,0,0,1,1.53,3.82l-.1,4h0a1.13,1.13,0,0,1,.82.85,3.54,3.54,0,0,1-.43,2.13h0a.17.17,0,0,1,0,.05l-1.78,2.93a15.38,15.38,0,0,1-2.18,3l.23.34a10.29,10.29,0,0,0,1.16,1.49l0,.05c2,1.45,7,1.8,8.94,2.86l.07,0,.24.19a19.13,19.13,0,0,0-1-25.74L76.82,10a19.11,19.11,0,0,0-28.1,25.85ZM63.31,0A23.41,23.41,0,0,1,79.92,6.88l.13.14a23.47,23.47,0,0,1-.13,33.09l-.13.13A23.49,23.49,0,1,1,63.31,0Zm29,37.29a4.32,4.32,0,0,1,2.4-7.6,4.34,4.34,0,0,1,3.14,1L99.37,32l1.49,1.42c1,1,2,2,2.86,3s1.73,2.06,2.52,3.12,1.59,2.22,2.32,3.38,1.42,2.34,2,3.52l0,.12a4.31,4.31,0,0,1-5.15,6A4.23,4.23,0,0,1,103,50.51c-.52-1-1.1-2-1.71-2.94s-1.27-1.92-1.94-2.81S97.9,42.94,97.12,42s-1.52-1.68-2.3-2.45-1.65-1.55-2.53-2.3ZM76.05,109a4.27,4.27,0,0,1,3.28.23l.08,0a4.33,4.33,0,0,1,2.1,2.45v0a4.31,4.31,0,0,1-2.73,5.42c-1.37.46-2.75.86-4.15,1.21s-2.76.62-4.19.85-2.86.41-4.27.52-2.89.18-4.32.18-2.92-.06-4.38-.18-2.9-.3-4.36-.54-2.92-.55-4.31-.9-2.83-.78-4.19-1.24a4.33,4.33,0,0,1-2.48-2.2,4.28,4.28,0,0,1-.21-3.3,4.34,4.34,0,0,1,2.19-2.48,4.28,4.28,0,0,1,3.3-.21l0,0c1.13.38,2.3.73,3.49,1l0,0c1.16.29,2.33.54,3.49.73h0c1.16.19,2.37.34,3.61.44s2.43.15,3.7.15,2.46-.05,3.64-.15,2.42-.24,3.56-.43h.07c1.16-.19,2.33-.43,3.49-.72s2.32-.62,3.44-1Z"/></svg>';
  var ICON_FLOW = '<svg viewBox="0 0 512 480.24" fill="currentColor" aria-hidden="true"><path fill-rule="nonzero" d="M512 220.6c-163.88 61.72-149.02 38.94-206.92 208.29-57.91-169.35-43.06-146.57-206.92-208.26 163.86-61.72 149.01-38.95 206.92-208.3C362.98 181.68 348.12 158.91 512 220.6zM193.38 382.9c-76.59 28.86-69.65 18.21-96.71 97.34C69.63 401.11 76.59 411.76 0 382.9c76.59-28.81 69.63-18.15 96.67-97.31 27.06 79.16 20.12 68.5 96.71 97.31zm8.2-316.66c-52.13 19.66-47.41 12.38-65.81 66.28-18.43-53.86-13.69-46.62-65.84-66.28C122.08 46.63 117.34 53.87 135.77 0c18.4 53.87 13.68 46.63 65.81 66.24z"/></svg>';
  // the author's archive box (a lidded storage crate), used for Inventory's rail tab and its
  // Stash sub-tab, which is the same idea at two scales: the whole tab and one bucket inside it
  var ICON_ARCHIVE = '<svg viewBox="0 0 122.878 110.041" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.149,0h120.583c0.631,0,1.146,0.518,1.146,1.149v28.383 c0,0.634-0.516,1.149-1.146,1.149H1.149C0.518,30.681,0,30.166,0,29.532V1.149C0,0.518,0.518,0,1.149,0L1.149,0z M7.224,36.787 h108.433c0.526,0,0.962,0.43,0.962,0.961v71.331c0,0.529-0.436,0.962-0.962,0.962H7.224c-0.528,0-0.961-0.433-0.961-0.962V37.749 C6.263,37.217,6.695,36.787,7.224,36.787L7.224,36.787z M45.005,48.526h32.87c3.529,0,6.419,2.888,6.419,6.417l0,0 c0,3.529-2.89,6.416-6.419,6.416h-32.87c-3.532,0-6.419-2.887-6.419-6.416l0,0C38.586,51.414,41.474,48.526,45.005,48.526 L45.005,48.526z"/></svg>';
  var ICON_CODEX = '<svg viewBox="0 0 442 512.12" fill="currentColor" aria-hidden="true"><path d="M73.5 0h354.32v395.44c-.64 11.05-14.91 11.3-30.32 10.62H68.28c-21.33 0-38.77 17.43-38.77 38.76 0 21.34 17.44 38.77 38.77 38.77h343.39v-41.25H442v52.43c0 9.55-7.8 17.35-17.35 17.35H69.78C22.54 511.76 0 494.94 0 456.56V73.5C0 33.07 33.07 0 73.5 0zm107.17 253.02v-10.73c0-12.59 1-22.66 2.95-30.13 1.97-7.48 4.95-13.5 8.88-18.07 3.87-4.52 8.66-8.66 14.31-12.32 4.89-3.23 9.25-6.29 13.12-9.31 3.88-2.95 6.89-6.13 9.15-9.46 2.26-3.39 3.39-7.21 3.39-11.46 0-3.82-.92-7.21-2.75-10.11-1.82-2.91-4.3-5.17-7.42-6.78-3.17-1.56-6.61-2.37-10.43-2.37-4.15 0-7.96.92-11.41 2.85-3.49 1.88-6.29 4.52-8.39 7.91-2.1 3.34-3.12 7.26-3.12 11.67h-58.69c.11-16.78 3.93-30.44 11.46-40.93 7.48-10.55 17.43-18.24 29.8-23.19 12.37-4.95 25.98-7.37 40.78-7.37 16.35 0 30.93 2.37 43.78 7.16 12.86 4.78 22.97 11.94 30.4 21.51 7.37 9.64 11.08 21.58 11.08 35.94 0 9.25-1.56 17.37-4.74 24.37-3.17 6.99-7.58 13.12-13.17 18.45-5.6 5.32-12.16 10.17-19.64 14.52-5.54 3.17-10.16 6.51-13.88 9.9-3.76 3.39-6.59 7.25-8.5 11.57-1.9 4.29-2.85 9.52-2.85 15.65v10.73h-54.11zm27.97 82.28c-8.88 0-16.48-3.1-22.76-9.3-6.3-6.22-9.36-13.83-9.36-22.76 0-8.71 3.07-16.19 9.36-22.38 6.3-6.18 13.88-9.25 22.76-9.25 8.39 0 15.82 3.07 22.27 9.25 6.45 6.19 9.84 13.67 9.84 22.38 0 5.92-1.66 11.35-4.68 16.2-3.01 4.84-6.94 8.7-11.72 11.56-4.85 2.89-10.06 4.3-15.71 4.3zM68.17 452.81h315.37c3.19 0 5.8 2.62 5.8 5.8v3.53c0 3.18-2.61 5.8-5.8 5.8H68.17c-3.18 0-5.79-2.61-5.79-5.8v-3.53c0-3.19 2.6-5.8 5.79-5.8zm0-29.96h315.37c3.19 0 5.8 2.62 5.8 5.8v3.53c0 3.18-2.61 5.8-5.8 5.8H68.17c-3.18 0-5.79-2.61-5.79-5.8v-3.53c0-3.19 2.6-5.8 5.79-5.8z"/></svg>';
  // the author's fingerprint, for #PRINT alone
  var ICON_PRINT = '<svg viewBox="0 0 122.88 121.74" fill="currentColor" aria-hidden="true"><path d="M32.18,105.73c0.7-1.11,2.16-1.44,3.27-0.74c1.11,0.7,1.44,2.16,0.74,3.27l-4.81,7.68c-0.7,1.11-2.16,1.44-3.27,0.74 c-1.11-0.7-1.44-2.16-0.74-3.27L32.18,105.73L32.18,105.73z M6.57,75.32c0.33,1.27-0.42,2.57-1.69,2.9 c-1.27,0.33-2.57-0.42-2.9-1.69c-0.39-1.5-0.73-3.01-1.02-4.54c-0.28-1.52-0.5-3.03-0.66-4.54c-0.1-0.98-0.18-1.98-0.22-2.99 C0.02,63.37,0,62.36,0,61.44C0,44.47,6.88,29.11,18,18C29.11,6.88,44.47,0,61.44,0c16.97,0,32.34,6.83,43.47,17.91 c11.11,11.06,17.97,26.36,17.97,43.3c0,1.31-1.07,2.38-2.38,2.38c-1.31,0-2.38-1.07-2.38-2.38c0-15.64-6.33-29.74-16.56-39.93 C91.3,11.06,77.12,4.76,61.44,4.76c-15.65,0-29.82,6.34-40.08,16.6C11.11,31.62,4.76,45.79,4.76,61.44c0,1.04,0.02,1.97,0.06,2.8 c0.04,0.91,0.11,1.82,0.2,2.73c0.15,1.4,0.35,2.79,0.61,4.17C5.89,72.51,6.2,73.9,6.57,75.32L6.57,75.32z M12.97,96.87 c-0.99,0.86-2.49,0.75-3.35-0.24c-0.86-0.99-0.75-2.49,0.24-3.35c0.6-0.52,1.13-1.14,1.58-1.86c0.47-0.74,0.86-1.61,1.17-2.6 c1.59-5.06,0.63-10.34-0.34-15.69c-0.66-3.64-1.33-7.31-1.3-11.14c0.12-19.6,12.38-35.58,28.42-43.77 c6.73-3.44,14.15-5.5,21.63-5.89c7.51-0.39,15.08,0.93,22.07,4.25C98.7,24,111.38,41.37,114.02,72.13 c0.11,1.31-0.87,2.46-2.18,2.57c-1.31,0.11-2.46-0.87-2.57-2.18c-2.47-28.79-14.02-44.89-28.21-51.64 c-6.26-2.98-13.05-4.15-19.8-3.81c-6.79,0.35-13.55,2.24-19.71,5.38C26.96,29.89,15.82,44.34,15.71,62 c-0.02,3.4,0.61,6.86,1.23,10.29c1.08,5.94,2.14,11.8,0.21,17.95c-0.43,1.38-1,2.62-1.69,3.72C14.76,95.07,13.92,96.04,12.97,96.87 L12.97,96.87z M109.22,82.01c0-1.32,1.07-2.38,2.38-2.38s2.38,1.07,2.38,2.38v9.98c0,1.32-1.07,2.38-2.38,2.38 s-2.38-1.07-2.38-2.38V82.01L109.22,82.01z M20.01,106.56c-0.98,0.87-2.48,0.78-3.35-0.2c-0.87-0.98-0.78-2.48,0.2-3.35 c2.95-2.6,5.1-5.96,6.34-10.17c1.28-4.34,1.6-9.61,0.85-15.92c-1.38-6.78-1.63-13.04-0.82-18.69c0.84-5.91,2.84-11.15,5.89-15.63 c0.74-1.08,2.22-1.36,3.3-0.62c1.08,0.74,1.36,2.22,0.62,3.3c-2.64,3.87-4.37,8.44-5.11,13.62c-0.73,5.13-0.5,10.84,0.77,17.07 c0.03,0.12,0.06,0.24,0.07,0.36c0.84,6.97,0.45,12.88-1.01,17.85C26.26,99.28,23.63,103.36,20.01,106.56L20.01,106.56z M44.18,34.97c-1.14,0.66-2.59,0.27-3.25-0.87c-0.66-1.14-0.27-2.59,0.87-3.25c2.66-1.54,5.5-2.76,8.43-3.65 c8.04-2.44,16.77-2.37,24.71,0.41c7.98,2.8,15.15,8.32,20.03,16.77c1.63,2.81,3,5.96,4.06,9.45c1.51,4.98,2.54,10.54,3.07,16.65 c0.52,6.01,0.55,12.61,0.09,19.79c0,0.07-0.01,0.13-0.02,0.2l-1.66,16.38c-0.13,1.3-1.29,2.26-2.6,2.13 c-1.3-0.13-2.26-1.29-2.13-2.6l1.66-16.4l0-0.01c0.44-6.91,0.41-13.29-0.09-19.1c-0.5-5.82-1.46-11.05-2.86-15.66 c-0.94-3.11-2.17-5.92-3.63-8.45c-4.27-7.4-10.53-12.23-17.48-14.67c-6.99-2.45-14.68-2.51-21.77-0.36 C49.04,32.53,46.55,33.6,44.18,34.97L44.18,34.97z M38.95,98.15c-0.23,1.29-1.46,2.16-2.75,1.93c-1.29-0.23-2.16-1.46-1.93-2.75 c0.55-3.08,0.86-6.53,0.97-10.29c0.11-3.81,0.02-7.98-0.24-12.44c-0.05-0.96-0.14-2.15-0.22-3.31c-0.54-7.59-0.97-13.71,3.47-21.6 c0.98-1.74,2.15-3.36,3.55-4.84c1.4-1.48,3.01-2.82,4.84-3.99c0.12-0.08,0.24-0.14,0.37-0.19c2.71-1.3,5.4-2.31,8.09-2.97 c2.77-0.68,5.52-0.98,8.23-0.83c1.31,0.07,2.32,1.18,2.25,2.49c-0.07,1.31-1.18,2.32-2.49,2.25c-2.25-0.12-4.54,0.13-6.87,0.7 c-2.32,0.57-4.7,1.46-7.12,2.62c-1.47,0.95-2.75,2.01-3.84,3.17c-1.12,1.19-2.07,2.49-2.86,3.91c-3.74,6.66-3.36,12.14-2.88,18.94 c0.07,1,0.14,2.04,0.22,3.38c0.26,4.54,0.35,8.84,0.24,12.83C39.85,91.22,39.53,94.9,38.95,98.15L38.95,98.15z M72.44,44.51 c-1.12-0.68-1.47-2.15-0.79-3.26c0.68-1.12,2.14-1.47,3.26-0.79c0.73,0.45,1.44,0.93,2.13,1.45c0.68,0.51,1.35,1.07,2.02,1.68 c9.06,8.23,12.13,21.46,12.33,35.3c0.19,13.48-2.34,27.54-4.66,37.91c-0.28,1.28-1.55,2.09-2.83,1.8c-1.28-0.28-2.09-1.55-1.8-2.83 c2.26-10.12,4.74-23.81,4.55-36.83c-0.18-12.66-2.88-24.65-10.79-31.84c-0.55-0.5-1.12-0.97-1.69-1.4 C73.6,45.25,73.02,44.86,72.44,44.51L72.44,44.51z M43.15,119.69c-0.76,1.07-2.24,1.33-3.31,0.57c-1.07-0.76-1.33-2.24-0.57-3.31 c1.68-2.37,3.1-4.97,4.26-7.79c1.16-2.84,2.06-5.93,2.68-9.27c1.16-6.23,0.61-14.17,0.08-21.67c-0.18-2.53-0.35-5-0.46-7.54 c-0.16-3.71-0.23-7.35,0.46-10.66c0.75-3.61,2.37-6.74,5.62-9.02c0.73-0.51,1.52-0.97,2.37-1.36c0.85-0.39,1.77-0.74,2.76-1.02 c0.74-0.21,1.47-0.38,2.18-0.5c4.87-0.83,8.73,0.43,11.71,3.03c2.83,2.47,4.75,6.11,5.93,10.24c0.35,1.24,0.64,2.53,0.87,3.85 c0.12,0.72,0.23,1.45,0.31,2.18c0.08,0.72,0.15,1.46,0.2,2.22c0.5,7.54,0.17,16.95-0.85,26.16c-0.98,8.83-2.6,17.53-4.75,24.3 c-0.4,1.25-1.73,1.94-2.98,1.55c-1.25-0.4-1.94-1.73-1.55-2.98c2.04-6.43,3.59-14.81,4.54-23.38c0.99-8.95,1.31-18.06,0.83-25.34 c-0.04-0.63-0.1-1.29-0.18-1.97c-0.07-0.64-0.17-1.28-0.28-1.91c-0.2-1.14-0.45-2.26-0.75-3.35c-0.94-3.31-2.4-6.15-4.48-7.96 c-1.92-1.67-4.47-2.47-7.77-1.91c-0.53,0.09-1.09,0.22-1.68,0.39c-0.77,0.22-1.46,0.47-2.07,0.76c-0.62,0.29-1.17,0.6-1.64,0.93 c-2.09,1.46-3.16,3.59-3.68,6.09c-0.58,2.79-0.51,6.1-0.37,9.49c0.1,2.25,0.28,4.81,0.46,7.43c0.54,7.78,1.12,16.01-0.16,22.85 c-0.68,3.65-1.67,7.04-2.96,10.2C46.64,114.11,45.04,117.02,43.15,119.69L43.15,119.69z M59.44,62.15 c-0.24-1.29,0.62-2.53,1.91-2.76c1.29-0.24,2.53,0.62,2.76,1.91c1.21,6.52,1.79,13.11,1.81,19.73c0.02,6.59-0.52,13.21-1.54,19.84 c-0.2,1.29-1.41,2.18-2.71,1.98c-1.29-0.2-2.18-1.41-1.98-2.71c0.99-6.38,1.51-12.76,1.49-19.11C61.16,74.7,60.6,68.4,59.44,62.15 L59.44,62.15z M56.72,108.31c0.28-1.28,1.55-2.09,2.83-1.8c1.28,0.28,2.09,1.55,1.8,2.83l-2.08,9.37c-0.28,1.28-1.55,2.09-2.83,1.8 c-1.28-0.28-2.09-1.55-1.8-2.83L56.72,108.31L56.72,108.31z"/></svg>';
  var TABS = [
    { key: "combat",  label: "Freelancer", glyph: "✦", sub: "live play dashboard", portal: "freelancer", gated: registered, view: function (m) { EN.combatView.render(m); } },
    { key: "face",    label: "Social",    glyph: "◑", icon: ICON_SOCIAL, sub: "people and reputation", portal: "freelancer", gated: registered, view: function (m) { EN.faceView.render(m); },
      // unread #POST raises the rail's attention dot; renderTabs runs on every render, so it clears itself
      badge: function () { try { return EN.faceView.unread(store.active()); } catch (e) { return 0; } } },
    { key: "grid",    label: "#GRID",     glyph: "⌬", icon: ICON_GRID, sub: "the network", portal: "freelancer", gated: registered, view: function (m) { EN.gridView.render(m); } },
    { key: "flow",    label: "Flow",      glyph: "❋", icon: ICON_FLOW, sub: "the current", portal: "freelancer", gated: registered, view: function (m) { EN.flowView.render(m); } },
    { key: "gear",    label: "Inventory", glyph: "▣", icon: ICON_ARCHIVE, sub: "gear, chrome, gray market", portal: "freelancer", gated: registered, view: function (m) { EN.inventoryView.render(m); } },
    { key: "codex",   label: "Codex",     glyph: "❒", icon: ICON_CODEX, sub: "rules on hand", portal: "freelancer", gated: registered, view: function (m) { EN.codexView.render(m); } },
    { key: "print",   label: "#PRINT", glyph: "▤", icon: ICON_PRINT, sub: "identity record and leveling", portal: "freelancer", view: function (m) { EN.builder.render(m); },
      onSelect: function () { if (EN.builder && EN.builder.openAdvance) EN.builder.openAdvance(); } },

    /* The Admin rail. Every entry is gated on adminReady, so the desktop is
       all-or-nothing rather than degrading to four MODULE PENDING pages with
       a working Table tab above them. */
    { key: "table",      label: "Table",      glyph: "◆", sub: "initiative and the crew", portal: "admin", gated: adminReady,
      view: function (m) { EN.gmView.renderTable(m); } },
    { key: "threats",    label: "Threats",    glyph: "✦", sub: "build a threat", portal: "admin", gated: adminReady,
      view: function (m) { EN.gmView.renderThreats(m); } },
    { key: "bestiary",   label: "Bestiary",   glyph: "▤", sub: "gangers, sentries, cryptids", portal: "admin", gated: adminReady,
      view: function (m) { EN.gmView.renderBestiary(m); } },
    { key: "encounters", label: "Encounters", glyph: "⌗", sub: "module pending", portal: "admin", gated: adminReady,
      stub: "Budgeting an encounter: XP shares by crew Caliber, four difficulty bands from Milk Run " +
            "to Red Work, and the book's own line that past 2x is not an encounter, it is an ambush " +
            "you are writing on purpose. The tables already live in data/threats.js." },
    { key: "hazards",    label: "Hazards",    glyph: "⚠", sub: "module pending", portal: "admin", gated: adminReady,
      stub: "Set Pieces: the eight pre-written hazards, all authored at Gauge 3, plus the DC ladder " +
            "and bite tables Part 4 already prices." },
    { key: "jobs",       label: "Job Board",  glyph: "▣", sub: "module pending", portal: "admin", gated: adminReady,
      stub: "The Job Board: five roll tables and twelve postings." },
    { key: "payroll",    label: "Payroll",    glyph: "◈", sub: "module pending", portal: "admin", gated: adminReady,
      stub: "Paying the Crew: contract pay bands, bounties, and salvage values, likely lifting " +
            "splitPayout out of inventory.js rather than writing a second splitter." }
  ];

  /* Device state: which desktop, persisted; which tab on each desktop, not.
     Neither an activeTab reset nor a portal choice needs to survive a reload
     any harder than that, and the splash is deliberately per-first-run. */
  var PORTAL_KEY = "en_portal_v1";
  var portal = "freelancer";
  var LAST = { freelancer: "print", admin: "table" };

  function storedPortal() {
    try {
      var v = localStorage.getItem(PORTAL_KEY);
      return (v === "admin" || v === "freelancer") ? v : null;
    } catch (e) { return null; }
  }

  /* One reader for "which tabs exist right now" IN THE CURRENT PORTAL. Both
     the rail and the dispatch ask it, so they can never disagree about
     whether a tab is there. */
  function visibleTabs() {
    return TABS.filter(function (t) { return t.portal === portal && (!t.gated || t.gated()); });
  }
  function hasAdmin() {
    return TABS.some(function (t) { return t.portal === "admin" && (!t.gated || t.gated()); });
  }
  // the rail in swipe order and a tab's label, for swipe.js (read live, never captured)
  function tabOrder() { return visibleTabs().map(function (t) { return t.key; }); }
  function tabLabel(k) { var t = TABS.filter(function (x) { return x.key === k; })[0]; return t ? t.label : k; }

  /* THE one writer for `portal`. Validates (Admin is meaningless with the GM
     modules gone; the Freelancer side is never empty, so no symmetric check
     is needed), persists so a splash pick, a tray flip, and the empty-rail
     self-heal below can never disagree, and clears any confirm armed on the
     desktop being left (ui.js's _armedKey is a single global slot). */
  /* #GRIDroid's app list folds itself when you open another app, but every OTHER route out of a
     tab (a portal flip, a gotoTab from a card, a skin change in settings.js) used to leave the
     class set, so the list came back unfolded later, sometimes on a rail with no rows to tap. */
  function foldRail() { try { document.documentElement.classList.remove("rail-open"); } catch (e) {} }
  function usePortal(p) {
    portal = (p === "admin" && hasAdmin()) ? "admin" : "freelancer";
    try { localStorage.setItem(PORTAL_KEY, portal); } catch (e) {}
    EN.ui.disarm();
    foldRail();
  }
  function setPortal(p) { usePortal(p); render(); }

  function renderTabs() {
    var nav = document.getElementById("os-tabs");
    EN.ui.clear(nav);
    // tabs live in their own scroller; the gear is a sibling outside it so it never scrolls or drifts
    var scroll = el("div.os-tabs-scroll");
    /* An unregistered Freelancer gets NO tabs, only the gear. visibleTabs()
       still holds #PRINT for them, and render() still dispatches to it; this
       only decides whether that lone tab is drawn. The scroller itself is
       always appended, empty when locked: it is the flex spacer that keeps the
       gear pinned to the right, and dropping it slid the gear to the left edge.
       Admin is untouched: a GM needs no character. */
    /* #GRIDroid folds the rail down to the app you are in, so a dot on a row nobody can see
       announces nothing. This says "one of the rows you are NOT looking at wants you", which is
       the only thing a folded list can honestly say; the skin draws it on the folded row. Inert
       on Classic and '98, where every row is on screen wearing its own dot. */
    var railAttn = false;
    if (!(portal === "freelancer" && !registered())) {
      visibleTabs().forEach(function (t) {
        // a tab may report something waiting on it; the dot is decorative and the tap
        // falls through to the tab itself, which is where the reader wants to go anyway
        var badge = t.badge ? t.badge() : 0;
        if (badge && t.key !== LAST[portal]) railAttn = true;
        // data-sub is a skin hook: #GRIDroid prints it under the label as the app row's subtitle
        scroll.appendChild(el("div.os-tab" + (t.key === LAST[portal] ? ".active" : ""), {
          dataset: t.sub ? { sub: t.sub } : null,
          onclick: function () {
            // #GRIDroid draws the rail as a phone's app list, folded to the open app: tapping
            // that app unfolds or folds the list instead of re-opening it (so #PRINT's
            // re-tap-for-Advance is a desktop gesture). No other skin ever sees rail-open.
            var root = document.documentElement;
            if (t.key === LAST[portal] && root.classList.contains("skin-droid")) { root.classList.toggle("rail-open"); return; }
            root.classList.remove("rail-open");
            LAST[portal] = t.key; if (t.onSelect) t.onSelect(); render();
          }
        }, [t.icon ? el("span", { html: t.icon }) : el("span", { text: t.glyph }), document.createTextNode(t.label),
            badge ? el("span.attn-dot", { title: badge + (badge === 1 ? " unread message" : " unread messages") + " in #POST" }) : null]));
      });
    }
    if (railAttn) document.documentElement.classList.add("rail-attn");
    else document.documentElement.classList.remove("rail-attn");
    nav.appendChild(scroll);
    // settings gear, pinned to the right end of the rail
    if (EN.settings && EN.settings.gearTab) nav.appendChild(EN.settings.gearTab());
    /* The system tray: two status glyphs and a second clock. Always rendered,
       because the DOM cannot move the top-bar clock into the rail, and a skin
       is CSS only. Classic hides it; a skin with a bottom taskbar ('98) shows
       it and hides the top-bar clock instead, so there is always exactly one
       clock on screen. Both are ticked by tickClock. */
    // ⇋ is LINK STABLE and ⬤ is SYNC OK, the two top-bar readouts the '98 title
    // bar drops; the words survive as hover titles, and ⬤ flashes with the save
    // pulse exactly as SYNC OK does (see flashSave).
    /* With the list unfolded its scrim covers the page, so a tap that lands on the rail itself
       (not on a row) folds it back rather than being swallowed. Inert on the other skins. */
    nav.onclick = function (e) { if (e.target === nav) foldRail(); };
    nav.appendChild(el("div.os-tray", null, [
      el("span.os-tray-ico", { text: "⇋", title: "LINK STABLE" }),
      el("span.os-tray-ico", { id: "os-tray-sync", text: "⬤", title: "SYNC OK" }),
      el("span.os-tray-clock", { id: "os-tray-clock", text: clockText() })
    ]));
    if (_saveKind === "fail") paintSave("fail");   // a fresh tray glyph must not read as healthy
  }

  var _lastTab = null;
  var _swipe = null;   // the swipe gesture, when the module is present (see start)
  function render() {
    // a rebuild under a finger strands its touch (the events keep targeting the removed node),
    // so the gesture is told to snap back first; a no-op unless a drag is in flight
    if (_swipe) _swipe.abort();
    // per-character theme: repaint to whatever the active Freelancer selected (no-op if unchanged).
    // In Admin this resolves to the Admin desktop's own device theme instead (see settings.js).
    if (EN.theme && EN.theme.syncToActive) EN.theme.syncToActive();
    // re-renders empty the view, which momentarily collapses the page and lets
    // the browser clamp scroll to the top, capture and restore the position.
    // Inner scrollable wells (.feature-scroll, .actions-scroll) are rebuilt too, so save theirs as well.
    var sy = window.scrollY, sx = window.scrollX;
    var WELLS = "#view .feature-scroll, #view .actions-scroll";
    var wells = Array.prototype.map.call(document.querySelectorAll(WELLS), function (w) { return w.scrollTop; });
    renderTabs();
    var view = document.getElementById("view");
    EN.ui.clear(view);
    var vis = visibleTabs();
    // Same self-healing shape as the tab fallback below, for the same reason:
    // the rail and the dispatch must never disagree. Reachable only if the GM
    // modules vanish while Admin is the current desktop.
    if (!vis.length) { usePortal("freelancer"); vis = visibleTabs(); }
    /* Resolve through the VISIBLE list and fall back, writing LAST[portal] back
       so the rail highlight agrees. Without this, a tab disappearing (GM mode
       toggling off used to do this) throws on `tab.view` and blanks the page
       with the rail still painted. The same hole made gotoTab("nope") throw;
       it was simply unreachable until a tab could disappear. */
    var tab = vis.filter(function (t) { return t.key === LAST[portal]; })[0];
    if (!tab) { tab = vis[0]; LAST[portal] = tab.key; }
    if (tab.view) { tab.view(view); }
    else {
      view.appendChild(el("div", null, [
        el("h1", { style: { fontSize: "22px", marginBottom: "6px" }, text: tab.label.toUpperCase() }),
        el("div.muted-box", { style: { marginTop: "20px", padding: "40px" }, html: tab.glyph + " &nbsp; MODULE PENDING<br><br>" + tab.stub })
      ]));
    }
    if (_lastTab === LAST[portal]) {                       // same view → stay put
      window.scrollTo(sx, sy);
      Array.prototype.forEach.call(document.querySelectorAll(WELLS), function (w, i) {
        if (wells[i]) w.scrollTop = wells[i];
      });
    } else window.scrollTo(0, 0);                          // tab switch → start at top
    _lastTab = LAST[portal];
    // top bar's active-name slot: the loaded Freelancer on the player side, the
    // live encounter on the GM side, since Admin is not about a character
    var nameEl = document.getElementById("active-name");
    if (portal === "admin") {
      var enc = null;
      try { enc = EN.gmStore && EN.gmStore.get && EN.gmStore.get().encounter; } catch (e) {}
      nameEl.textContent = (enc && enc.round > 0) ? ("ROUND " + enc.round) : "NO ENCOUNTER";
    } else {
      var ch = store.active();
      nameEl.textContent = ch ? (ch.name || "UNNAMED FREELANCER").toUpperCase() : "NO FREELANCER LOADED";
    }
    /* Currency marks, last, once the view is fully built. A NO-OP on any device whose fonts
       carry U+1D4A2 and U+25CE, which is the common case and costs one cached measurement;
       on devices that lack them it walks the freshly-rendered text and swaps the tofu box
       for a readable letter. Runs here rather than inside el() because most of these marks
       arrive as catalog PROSE, never passing through a builder at all. */
    if (EN.ui.substituteCurrencyGlyphs) EN.ui.substituteCurrencyGlyphs(document.getElementById("os") || document.body);
  }

  /* save indicator pulse */
  /* The save readout, in the top bar and as the tray's ⬤ on a skin with a taskbar. It reports
     the WRITE, not the edit: an edit only ever flashes it, and the store's own save watcher
     below settles it to what actually happened. A failure is sticky, because the record on this
     device really is behind until a later write lands. */
  var _saveKind = "ok";                                 // "ok" | "saving" | "fail"
  var SAVE_FAIL_TIP = "This device refused the write, so changes since then are NOT stored here. Export the record from #PRINT to keep them.";
  function paintSave(kind) {
    var s = document.getElementById("save-state");
    var g = document.getElementById("os-tray-sync");   // the tray's ⬤, which IS SYNC OK on a skin with a taskbar
    if (!s && !g) return;
    var txt = kind === "saving" ? "SYNC…" : kind === "fail" ? "NOT SAVED" : "SYNC OK";
    var col = kind === "saving" ? "var(--warn)" : kind === "fail" ? "var(--danger)" : "var(--success)";
    var tip = kind === "fail" ? SAVE_FAIL_TIP : txt;
    if (s) { s.textContent = txt; s.style.color = col; s.title = tip; }
    // on a good save the glyph's inline color is CLEARED rather than set, so it falls back to
    // the skin's own rule and keeps its pulse; a warning has to override that rule to be seen
    if (g) { g.title = tip; g.style.color = kind === "ok" ? "" : col; }
  }
  function flashSave() {
    paintSave("saving");
    clearTimeout(flashSave._t);
    // settle to whatever the last write reported, NOT to success: an immediate write has
    // already landed and reported by the time this runs, and a debounced one reports right after
    flashSave._t = setTimeout(function () { paintSave(_saveKind); }, 300);
  }

  /* clock */
  function clockText() {
    var d = new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + ":" + String(d.getSeconds()).padStart(2, "0");
  }
  function tickClock() {
    var t = clockText();
    var c = document.getElementById("os-clock");
    if (c) c.textContent = t;
    var tray = document.getElementById("os-tray-clock");   // the taskbar clock, when a skin shows one
    if (tray) tray.textContent = t;
  }

  /* boot sequence */
  function boot() {
    var lines = [
      "init grid.kernel ……… <b>OK</b>",
      "mount smartdeck.fs ……… <b>OK</b>",
      "load ruleset elysium_nights ……… <b>OK</b>",
      "spin flow.reservoir ……… <b>OK</b>",
      "auth freelancer credentials ……… <b>OK</b>",
      "decrypt local roster ……… <b>OK</b>"
    ];
    var box = document.getElementById("boot-lines");
    var i = 0;
    function step() {
      if (i < lines.length) {
        box.innerHTML += "&gt; " + lines[i] + "<br>";
        i++; setTimeout(step, 150 + Math.floor((i % 3) * 40));
      } else {
        box.innerHTML += '<span class="cyan">&gt; smartdeck online.</span> <span class="cursor"></span>';
        setTimeout(finish, 420);
      }
    }
    function finish() {
      var reveal = function () {
        var b = document.getElementById("boot");
        b.classList.add("hide");
        document.getElementById("os").style.display = "flex";
        setTimeout(function () { b.style.display = "none"; }, 520);
      };
      /* After the gate: which desktop. The gate answers with the profile the
         player entered as (or resumed as, silently), and that profile IS the
         desktop. Set the portal FIRST, then reveal, so the render inside
         setPortal happens while #os is still display:none and any repaint is
         invisible. With gate.js deleted the app boots straight into the
         remembered desktop, and the settings tray's desktop buttons are the
         only way across. */
      var land = function (p) { setPortal(p || portal); reveal(); };
      if (EN.gate && EN.gate.require) EN.gate.require(land); else land(portal);
    }
    step();
  }

  function start() {
    store.load();
    // after store.load, always: the crew prune needs the roster to tell a live
    // charId from a dead one, and running first would drop every crew entry
    if (EN.gmStore && EN.gmStore.load) EN.gmStore.load();
    // Resolve the remembered desktop BEFORE the first render, so a returning
    // user's first paint is already correct rather than a Freelancer flash.
    // validated the same way usePortal validates, in case Admin was saved
    // while the GM modules were present and they are gone now.
    var sp = storedPortal();
    if (sp) portal = (sp === "admin" && hasAdmin()) ? "admin" : "freelancer";
    // Any non-silent store change re-renders the active view. (Text fields use
    // silent updates, so typing never triggers a disruptive re-render.)
    // render FIRST, then flash: render rebuilds the rail, and the tray's sync
    // glyph lives in it, so a flash applied before the rebuild would be thrown
    // away with the old rail a moment later (the top bar's readout is static
    // HTML and never noticed the difference)
    store.on(function () { render(); flashSave(); });
    /* The one place that knows whether the record is really on this device. It also has to
       out-live a re-render, which rebuilds the tray glyph from scratch, so renderTabs repaints
       a failure after appending it. */
    store.onSave(function (ok) {
      var was = _saveKind;
      _saveKind = ok ? "ok" : "fail";
      clearTimeout(flashSave._t);
      paintSave(_saveKind);
      if (!ok && was !== "fail") EN.ui.toast("NOT SAVED. This device refused the write; export the record from #PRINT to keep your changes.");
      if (ok && was === "fail") EN.ui.toast("Saved. This device is storing the record again.");
    });
    renderTabs();
    render();
    tickClock(); setInterval(tickClock, 1000);
    /* Swipe between tabs, on the phone skin only: its rail is folded to the app you are in,
       so a swipe is the way between tabs there. enabled() is the SAME test that folds the
       rail, so the two can never disagree, and it refuses while the list is unfolded. #view
       is the container because render() replaces its children and never the node, which is
       the one thing swipe.js requires of it, and render() tells the gesture when it does so
       (see _swipe.abort there). The module itself refuses a drag that starts inside anything
       position:fixed, which covers the roll trays, the rest sheets and the roster manager,
       overlays a translated #view would otherwise carry off with it; the exclude adds the rest
       buttons themselves and the Freelancer dashboard's layout-edit drag handle. A committed
       swipe runs the tab's onSelect exactly as a rail tap does, so swiping into #PRINT lands
       on Advance like tapping it, and closes any rest popover first, since the claimed drag
       swallows the click the popovers' own closer listens for. */
    if (EN.swipe) _swipe = EN.swipe.create({
      container: document.getElementById("view"),
      order: tabOrder,
      current: function () { return LAST[portal]; },
      onChange: function (k) {
        if (EN.combatView && EN.combatView.closePops) EN.combatView.closePops();
        var t = TABS.filter(function (x) { return x.key === k; })[0];
        if (t && t.onSelect) t.onSelect();
        EN.app.gotoTab(k);
      },
      label: tabLabel,
      enabled: function () { var c = document.documentElement.classList; return c.contains("skin-droid") && !c.contains("rail-open"); },
      exclude: "input, textarea, select, [contenteditable], [data-no-swipe], .drag-handle, .pop-anchor"
    });
    boot();
  }

  return {
    start: start, render: render,
    activeTab: function () { return LAST[portal]; },
    tabOrder: tabOrder,
    iconArchive: ICON_ARCHIVE,   // shared with inventory.js's Stash sub-tab, same art at two scales
    /* Resolves the key's own portal rather than assuming the caller's, so
       every existing caller (all of which name a Freelancer tab today) stays
       correct with zero edits, and the function can never strand the app on
       an unknown key. */
    gotoTab: function (k) {
      foldRail();
      var t = TABS.filter(function (x) { return x.key === k; })[0];
      if (!t) return;
      usePortal(t.portal);
      LAST[portal] = k;
      render();
    },
    portal: function () { return portal; },
    setPortal: setPortal,
    hasAdmin: hasAdmin
  };
})();

document.addEventListener("DOMContentLoaded", EN.app.start);
