// Minimal IndexedDB helper (no external deps)
const DB_NAME = 'duly-noted-db';
const DB_VERSION = 1;
const STORE_NOTES = 'notes';
const STORE_QUEUE = 'queue';
const STORE_KV = 'kv';

// If running in Node/test environment where indexedDB is not available,
// fall back to a simple in-memory store so tests run without browser APIs.
const hasIDB = typeof indexedDB !== 'undefined';
const inMemory = { notes: [], queue: [] };

function openDB() {
  if (!hasIDB) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NOTES)) db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_QUEUE)) db.createObjectStore(STORE_QUEUE, { autoIncrement: true });
      if (!db.objectStoreNames.contains(STORE_KV)) db.createObjectStore(STORE_KV, { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllNotes() {
  if (!hasIDB) return Promise.resolve(inMemory.notes.slice());
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NOTES, 'readonly');
    const store = tx.objectStore(STORE_NOTES);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function setNotes(notes) {
  if (!hasIDB) {
    inMemory.notes = Array.isArray(notes) ? notes.slice() : [];
    return Promise.resolve();
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NOTES, 'readwrite');
    const store = tx.objectStore(STORE_NOTES);
    store.clear();
    for (const n of notes) store.put(n);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getQueue() {
  if (!hasIDB) return Promise.resolve(inMemory.queue.slice());
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readonly');
    const store = tx.objectStore(STORE_QUEUE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function setQueue(queue) {
  if (!hasIDB) {
    inMemory.queue = Array.isArray(queue) ? queue.slice() : [];
    return Promise.resolve();
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    const store = tx.objectStore(STORE_QUEUE);
    store.clear();
    for (const item of queue) store.add(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearQueue() {
  if (!hasIDB) {
    inMemory.queue = [];
    return Promise.resolve();
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    const store = tx.objectStore(STORE_QUEUE);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export { getAllNotes, setNotes, getQueue, setQueue, clearQueue };

// Key/value helpers (for token storage etc.)
async function getKV(key) {
  if (!hasIDB) return Promise.resolve(inMemory[key] || null);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KV, 'readonly');
    const store = tx.objectStore(STORE_KV);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

async function setKV(key, value) {
  if (!hasIDB) {
    inMemory[key] = value;
    return Promise.resolve();
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KV, 'readwrite');
    const store = tx.objectStore(STORE_KV);
    const req = store.put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function removeKV(key) {
  if (!hasIDB) {
    delete inMemory[key];
    return Promise.resolve();
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KV, 'readwrite');
    const store = tx.objectStore(STORE_KV);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export { getKV, setKV, removeKV };