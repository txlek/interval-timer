import { openDB, DBSchema, IDBPDatabase } from "idb";

const DB_NAME = "interval-timer-db";
const DB_VERSION = 1;
const STORE_AUDIO = "audio";

interface AudioRecord {
  key: "interval" | "finish";
  blob: Blob;
  updatedAt: number;
}

interface TimerDB extends DBSchema {
  [STORE_AUDIO]: {
    key: string;
    value: AudioRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<TimerDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TimerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_AUDIO)) {
          db.createObjectStore(STORE_AUDIO, { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveAudio(key: "interval" | "finish", blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put(STORE_AUDIO, {
    key,
    blob,
    updatedAt: Date.now(),
  });
}

export async function getAudio(key: "interval" | "finish"): Promise<Blob | null> {
  const db = await getDB();
  const record = await db.get(STORE_AUDIO, key);
  return record?.blob ?? null;
}

export async function deleteAudio(key: "interval" | "finish"): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_AUDIO, key);
}
