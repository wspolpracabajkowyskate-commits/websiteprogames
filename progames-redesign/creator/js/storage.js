// Configuration state -> localStorage, uploaded images -> IndexedDB (too big for localStorage).
import { STORAGE_KEY } from './config.js?v=7';

export function loadState(productId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${productId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

let saveTimer = null;
export function saveState(productId, state) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}:${productId}`, JSON.stringify(state));
    } catch (e) {
      console.warn('[creator] could not persist configuration', e);
    }
  }, 150);
}

export function clearState(productId) {
  try { localStorage.removeItem(`${STORAGE_KEY}:${productId}`); } catch (e) { /* ignore */ }
}

// ---------------------------------------------------------------- IndexedDB image store
const DB_NAME = 'progames-creator';
let dbPromise = null;
function db() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore('images');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) { reject(e); }
  });
  return dbPromise;
}

export async function putImage(id, blob) {
  try {
    const d = await db();
    await new Promise((res, rej) => {
      const tx = d.transaction('images', 'readwrite');
      tx.objectStore('images').put(blob, id);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
    return true;
  } catch (e) {
    console.warn('[creator] image not persisted', e);
    return false;
  }
}

export async function getImage(id) {
  try {
    const d = await db();
    return await new Promise((res, rej) => {
      const tx = d.transaction('images', 'readonly');
      const r = tx.objectStore('images').get(id);
      r.onsuccess = () => res(r.result || null); r.onerror = () => rej(r.error);
    });
  } catch (e) {
    return null;
  }
}

export async function deleteImage(id) {
  try {
    const d = await db();
    await new Promise((res) => {
      const tx = d.transaction('images', 'readwrite');
      tx.objectStore('images').delete(id);
      tx.oncomplete = res; tx.onerror = res;
    });
  } catch (e) { /* ignore */ }
}
