// ══════════════════════════════════════════
//  SIDEBAR — section collapse/expand
//  toggleSS is attached to window because it's used from inline onclick=
//  handlers in index.html.
// ══════════════════════════════════════════

window.toggleSS = function (el) {
  el.classList.toggle('collapsed');
};
