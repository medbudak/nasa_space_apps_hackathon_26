// Full-screen artwork behind a scene's UI (K4's images in assets/). Owner: K1.

/**
 * A layer that fills the game area with an image, darkened by `dim` (0..1) so text on top stays readable.
 * `path` is relative to the site root, e.g. 'assets/ending/cover_thumbnail.png'.
 */
export function backdrop(path, dim = 0.4) {
  const el = document.createElement('div');
  el.className = 'backdrop';
  const url = new URL(`../../${path}`, import.meta.url).href;
  el.style.cssText =
    'position:absolute;inset:0;background-size:cover;background-position:center;' +
    `background-image:linear-gradient(rgba(8,6,20,${dim}),rgba(8,6,20,${dim})),url("${url}");`;
  return el;
}
