Chrome-tab body silhouette
==========================

Active background art:

    silhouette.svg   (viewBox 0 0 854 1972)

The Chrome tab (Inventory -> Chrome -> Cybernetic Frame) renders this SVG as the
body in the BACKGROUND, with the Static heat-map markers on a transparent SVG
overlay in the FOREGROUND. Marker anchor coordinates live in
app/data/cyberware.js (EN.cyberware.zones) in this same 854 x 1972 space; if you
swap the art for a differently-proportioned silhouette, re-tune those anchors.

If silhouette.svg is missing the <img> hides itself (markers still render).

Later: species / gender / lineage variants can live alongside it
(e.g. silhouette-clanker.svg) and be selected per character.


#GRIDOS '98 wallpapers
=======================

    wallpapers/<key>.jpg          the desktop, 1672 x 941, JPEG q86
    wallpapers/<key>.thumb.jpg    the picker's card, 360 px wide

Listed in app/data/wallpapers.js (key, display name, both files), because
file:// cannot read a folder. Add a preset by dropping both files here and
adding one line there; a listed file that is missing shows a blank card and
the desktop falls back to the dither. Users' own wallpapers never land in this
folder: they are resized through a canvas and kept in localStorage.
