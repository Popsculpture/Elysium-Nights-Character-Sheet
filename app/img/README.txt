Chrome-tab body silhouette
==========================

Active background art:

    silhouette.svg   (viewBox 0 0 854 1972)

The Chrome tab (Inventory -> Chrome -> Cybernetic Frame) renders this SVG as the
body in the BACKGROUND, with the Static heat-map markers on a transparent SVG
overlay in the FOREGROUND. Marker anchor coordinates live in
app/data/cyberware.js (EN.cyberware.zones) in this same 854 x 1972 space — if you
swap the art for a differently-proportioned silhouette, re-tune those anchors.

If silhouette.svg is missing the <img> hides itself (markers still render).

Later: species / gender / lineage variants can live alongside it
(e.g. silhouette-clanker.svg) and be selected per character.
