// ══════════════════════════════════════════
//  OBJECT DATABASE
//  Two-tier storage:
//    - IndexedDB ('mirl_obj_files') for raw OBJ file bytes
//    - localStorage ('mirl_artifact_db') for searchable metadata records
//
//  Window-attached handlers (dbAnalyze / dbAnalyzeUpload / dbDelete) are
//  called from inline onclick= in dynamically rendered table rows.
// ══════════════════════════════════════════

import { App } from '../core/state.js';
import { resizeAll } from '../core/scenes.js';
import { loadMainModel } from '../viewer/loader.js';

const DB_KEY = 'mirl_artifact_db';

// ──── IndexedDB file store ────
export const FilesDB = {
  _db: null,
  async open() {
    if (this._db) return this._db;
    return new Promise((res, rej) => {
      const req = indexedDB.open('mirl_obj_files', 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore('files', { keyPath: 'id' });
      req.onsuccess = e => { this._db = e.target.result; res(this._db); };
      req.onerror = () => rej(req.error);
    });
  },
  async save(id, filename, arrayBuffer) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put({ id, filename, data: arrayBuffer });
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  },
  async get(id) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('files', 'readonly');
      const req = tx.objectStore('files').get(id);
      req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error);
    });
  },
  async delete(id) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').delete(id);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  }
};

// ──── localStorage metadata ────
export function dbLoad() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; }
  catch { return []; }
}

export function dbSave(records) {
  localStorage.setItem(DB_KEY, JSON.stringify(records));
}

export function dbRender(filterText = '') {
  const records = dbLoad();
  const q = filterText.toLowerCase();
  const filtered = q
    ? records.filter(r =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.material || '').toLowerCase().includes(q) ||
        (r.researcher || '').toLowerCase().includes(q) ||
        (r.scanner || '').toLowerCase().includes(q) ||
        (r.notes || '').toLowerCase().includes(q)
      )
    : records;

  const empty = document.getElementById('db-empty');
  const table = document.getElementById('db-table');
  const countLabel = document.getElementById('db-count-label');
  countLabel.textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    empty.style.display = '';
    table.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  table.style.display = '';

  const tbody = document.getElementById('db-tbody');
  tbody.innerHTML = filtered.map((r, i) => `
    <tr>
      <td style="color:var(--text2)">${i + 1}</td>
      <td><strong>${r.name || '—'}</strong></td>
      <td style="white-space:nowrap">${r.scanDate || '—'}</td>
      <td>${r.scanner ? `<span class="db-tag">${r.scanner}</span>` : '—'}</td>
      <td>${r.material ? `<span class="db-tag">${r.material}</span>` : '—'}</td>
      <td>${r.researcher || '—'}</td>
      <td style="font-family:monospace;font-size:11px">${r.filename || '—'}</td>
      <td style="max-width:220px;color:var(--text2)">${r.notes ? r.notes.slice(0, 100) + (r.notes.length > 100 ? '…' : '') : '—'}</td>
      <td style="white-space:nowrap;color:var(--text2);font-size:11px">${r.addedAt || '—'}</td>
      <td style="white-space:nowrap">
        ${r.hasFile
          ? `<button class="btn btn-sm btn-primary" style="font-size:11px;padding:4px 9px" onclick="dbAnalyze('${r.id}')">▶ Analyze</button>`
          : `<button class="btn btn-sm" style="font-size:11px;padding:4px 9px" onclick="dbAnalyzeUpload('${r.id}')" title="File not stored — pick it manually">Upload &amp; Analyze</button>`}
      </td>
      <td><button class="db-del-btn" onclick="dbDelete('${r.id}')">✕</button></td>
    </tr>`).join('');
}

window.dbDelete = async function (id) {
  if (!confirm('Remove this artifact record and its stored file?')) return;
  const records = dbLoad().filter(r => r.id !== id);
  dbSave(records);
  await FilesDB.delete(id).catch(() => {});
  dbRender(document.getElementById('db-search').value);
};

// ──── "Add Artifact" sidebar (Database tab) ────
document.getElementById('btn-db-add').addEventListener('click', () => {
  const name = document.getElementById('db-name').value.trim();
  if (!name) { alert('Artifact name is required.'); return; }

  const record = {
    id: String(Date.now()),
    name,
    scanDate: document.getElementById('db-date').value,
    scanner: document.getElementById('db-scanner').value,
    material: document.getElementById('db-material').value,
    researcher: document.getElementById('db-researcher').value.trim(),
    filename: document.getElementById('db-filename').value.trim(),
    notes: document.getElementById('db-notes').value.trim(),
    addedAt: new Date().toLocaleDateString()
  };

  const records = dbLoad();
  records.unshift(record);
  dbSave(records);
  dbRender();

  // Clear form
  ['db-name', 'db-researcher', 'db-filename', 'db-notes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('db-date').value = '';
  document.getElementById('db-scanner').value = '';
  document.getElementById('db-material').value = '';
});

document.getElementById('db-search').addEventListener('input', e => dbRender(e.target.value));

document.getElementById('btn-db-export-csv').addEventListener('click', () => {
  const records = dbLoad();
  if (!records.length) { alert('No records to export.'); return; }
  const header = 'name,scanDate,scanner,material,researcher,filename,notes,addedAt';
  const rows = records.map(r =>
    [r.name, r.scanDate, r.scanner, r.material, r.researcher, r.filename,
     r.notes, r.addedAt].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')
  );
  const csv = [header, ...rows].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'MIRL_artifact_database.csv';
  a.click();
});

document.getElementById('btn-db-export-json').addEventListener('click', () => {
  const records = dbLoad();
  if (!records.length) { alert('No records to export.'); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' }));
  a.download = 'MIRL_artifact_database.json';
  a.click();
});

// Re-render when switching to Database tab
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    if (t.dataset.tab === 'database-tab') dbRender(document.getElementById('db-search').value);
  });
});

// ──── Save-to-database panel (appears in Viewer sidebar after load) ────
export function showSaveDbSection(filename) {
  document.getElementById('save-db-section').style.display = '';
  const stem = filename.replace(/\.[^.]+$/, '');
  document.getElementById('sdb-name').value = stem;
  document.getElementById('sdb-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('sdb-status').style.display = 'none';
  document.getElementById('btn-sdb-save').textContent = 'Save to Database';
  document.getElementById('btn-sdb-save').disabled = false;
}

document.getElementById('btn-sdb-save').addEventListener('click', async () => {
  const name = document.getElementById('sdb-name').value.trim();
  if (!name) { alert('Artifact name is required.'); return; }
  const q = App.qual;
  const id = String(Date.now());
  const record = {
    id,
    name,
    scanDate: document.getElementById('sdb-date').value,
    scanner: document.getElementById('sdb-scanner').value,
    material: document.getElementById('sdb-material').value,
    researcher: document.getElementById('sdb-researcher').value.trim(),
    filename: App.fileName,
    notes: document.getElementById('sdb-notes').value.trim(),
    vertices: q ? q.nV : '',
    faces: q ? q.nF : '',
    qualityGrade: q ? q.grade : '',
    qualityScore: q ? q.score : '',
    hasFile: false,
    addedAt: new Date().toLocaleDateString()
  };

  if (App.pendingOBJFile) {
    try {
      await FilesDB.save(id, App.pendingOBJFile.name, App.pendingOBJFile.arrayBuffer);
      record.hasFile = true;
    } catch (e) {
      console.warn('Could not store file in IndexedDB:', e);
    }
  }

  const records = dbLoad();
  records.unshift(record);
  dbSave(records);

  const st = document.getElementById('sdb-status');
  st.textContent = record.hasFile ? '✓ Saved with file — Analyze from Database tab' : '✓ Saved (metadata only — file not captured)';
  st.style.color = record.hasFile ? 'var(--green)' : 'var(--yellow)';
  st.style.display = '';
  document.getElementById('btn-sdb-save').textContent = 'Saved ✓';
  document.getElementById('btn-sdb-save').disabled = true;
  dbRender();
});

// ──── Analyze-from-database flows ────
const dbAnalyzeInput = document.createElement('input');
dbAnalyzeInput.type = 'file';
dbAnalyzeInput.accept = '.obj,.mtl,.jpg,.jpeg,.png';
dbAnalyzeInput.multiple = true;
dbAnalyzeInput.style.display = 'none';
document.body.appendChild(dbAnalyzeInput);

let _dbAnalyzePendingRecord = null;

export function switchToViewer() {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector('.tab[data-tab="viewer-tab"]').classList.add('active');
  document.getElementById('viewer-tab').classList.add('active');
  setTimeout(resizeAll, 50);
}

export function prefillSaveSection(record) {
  document.getElementById('save-db-section').style.display = '';
  document.getElementById('sdb-name').value = record.name || '';
  document.getElementById('sdb-date').value = record.scanDate || '';
  document.getElementById('sdb-scanner').value = record.scanner || '';
  document.getElementById('sdb-material').value = record.material || '';
  document.getElementById('sdb-researcher').value = record.researcher || '';
  document.getElementById('sdb-notes').value = record.notes || '';
  document.getElementById('btn-sdb-save').textContent = 'Already in Database';
  document.getElementById('btn-sdb-save').disabled = true;
  const st = document.getElementById('sdb-status');
  st.textContent = 'Loaded from Object Database';
  st.style.color = 'var(--text2)';
  st.style.display = '';
}

window.dbAnalyze = async function (id) {
  const record = dbLoad().find(r => r.id === id);
  if (!record) return;
  const fileData = await FilesDB.get(id).catch(() => null);
  if (!fileData) { alert('Stored file not found. Use "Upload & Analyze" instead.'); return; }

  switchToViewer();
  const blob = new Blob([fileData.data], { type: 'text/plain' });
  const file = new File([blob], fileData.filename || record.filename || 'model.obj', { type: 'text/plain' });
  loadMainModel([file]);
  setTimeout(() => prefillSaveSection(record), 200);
};

window.dbAnalyzeUpload = function (id) {
  const record = dbLoad().find(r => r.id === id);
  _dbAnalyzePendingRecord = record || null;
  dbAnalyzeInput.value = '';
  dbAnalyzeInput.click();
};

dbAnalyzeInput.addEventListener('change', e => {
  if (!e.target.files.length) return;
  switchToViewer();
  loadMainModel(e.target.files);
  if (_dbAnalyzePendingRecord) {
    setTimeout(() => {
      prefillSaveSection(_dbAnalyzePendingRecord);
      _dbAnalyzePendingRecord = null;
    }, 200);
  }
});

// Initial render on load
dbRender();
