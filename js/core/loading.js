// ══════════════════════════════════════════
//  LOADING OVERLAY HELPERS
// ══════════════════════════════════════════

export function showLoad(text) {
  document.getElementById('loading-text').textContent = text;
  document.getElementById('loading').classList.remove('hidden');
}

export function hideLoad() {
  document.getElementById('loading').classList.add('hidden');
}
