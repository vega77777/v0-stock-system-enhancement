// 前端：firebase 初始化與共用 db helper（SDK v9+）
// 請把此檔放到你的前端專案 src/ 下，並在其他檔案中 import 對應方法
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  set,
  update,
  onValue,
  onChildAdded,
  onChildChanged,
  runTransaction,
  serverTimestamp,
  get
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBVI1ow7WhQIEQL2trXoXNCeGFOR2zjClM",
  authDomain: "v0-stock-management-system.firebaseapp.com",
  databaseURL: "https://v0-stock-management-system-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "v0-stock-management-system",
  storageBucket: "v0-stock-management-system.firebasestorage.app",
  messagingSenderId: "857580338780",
  appId: "1:857580338780:web:161bc4dabe03d4f275b099"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// writeWithBackup: 使用 push() 建立新項目並備份內容
async function writeWithBackup(path, data) {
  // path 範例: '/transactions/{uid}'
  const listRef = ref(db, path);
  const newRef = push(listRef);
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    _version: 1
  };
  await set(newRef, payload);
  // 備份：/backups/{normalizedPath}/{itemKey}/{timestamp}
  const normalized = path.replace(/^\/, "").replace(/\//g, "_");
  const backupPath = `/backups/${normalized}/${newRef.key}/${Date.now()}`;
  await set(ref(db, backupPath), { ...payload, backedAt: serverTimestamp() }).catch(() => {});
  return newRef.key;
}

// safeUpdate: 使用 transaction 檢查版本以避免舊資料覆蓋
async function safeUpdate(itemPath, newData) {
  const r = ref(db, itemPath);
  return runTransaction(r, (current) => {
    if (current === null) {
      return { ...newData, updatedAt: serverTimestamp(), _version: 1 };
    }
    const expected = newData._expectedVersion;
    if (expected && current._version && expected < current._version) {
      // 取消，避免舊資料覆蓋
      return;
    }
    const nextVersion = (current._version || 0) + 1;
    const merged = { ...current, ...newData };
    merged._version = nextVersion;
    merged.updatedAt = serverTimestamp();
    // 備份此次變更（非同步 fire-and-forget）
    const normalized = itemPath.replace(/^\/, "").replace(/\//g, "_");
    const backupPath = `/backups/${normalized}/${Date.now()}`;
    set(ref(db, backupPath), { before: current, after: merged, backedAt: serverTimestamp() }).catch(() => {});
    return merged;
  });
}

// listenToPath: 前端用來即時監聽資料變動（手機/電腦皆使用）
function listenToPath(path, callbacks) {
  const listRef = ref(db, path);
  if (callbacks.onChildAdded) onChildAdded(listRef, callbacks.onChildAdded);
  if (callbacks.onChildChanged) onChildChanged(listRef, callbacks.onChildChanged);
  if (callbacks.onValue) onValue(listRef, callbacks.onValue);
}

export {
  db,
  ref,
  writeWithBackup,
  safeUpdate,
  listenToPath,
  get,
  serverTimestamp
};