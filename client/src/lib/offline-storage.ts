interface OfflineSong {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
  category?: string;
  isFavorite: boolean;
  audioBlob: Blob;
  downloadedAt: number;
  originalUrl: string;
}

interface DownloadProgress {
  songId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error';
}

class OfflineStorage {
  private dbName = 'HarmonyOfflineMusic';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create songs store
        if (!db.objectStoreNames.contains('songs')) {
          const songsStore = db.createObjectStore('songs', { keyPath: 'id' });
          songsStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }

        // Create download progress store
        if (!db.objectStoreNames.contains('downloadProgress')) {
          db.createObjectStore('downloadProgress', { keyPath: 'songId' });
        }
      };
    });
  }

  async storeSong(song: OfflineSong): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');
      const request = store.put(song);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSong(id: string): Promise<OfflineSong | null> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['songs'], 'readonly');
      const store = transaction.objectStore('songs');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSongs(): Promise<OfflineSong[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['songs'], 'readonly');
      const store = transaction.objectStore('songs');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSong(id: string): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async setDownloadProgress(progress: DownloadProgress): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['downloadProgress'], 'readwrite');
      const store = transaction.objectStore('downloadProgress');
      const request = store.put(progress);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDownloadProgress(songId: string): Promise<DownloadProgress | null> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['downloadProgress'], 'readonly');
      const store = transaction.objectStore('downloadProgress');
      const request = store.get(songId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async clearDownloadProgress(songId: string): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['downloadProgress'], 'readwrite');
      const store = transaction.objectStore('downloadProgress');
      const request = store.delete(songId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async isAvailableOffline(songId: string): Promise<boolean> {
    const song = await this.getSong(songId);
    return !!song;
  }

  async getStorageSize(): Promise<number> {
    const songs = await this.getAllSongs();
    return songs.reduce((total, song) => total + song.audioBlob.size, 0);
  }

  createBlobUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  revokeBlobUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const offlineStorage = new OfflineStorage();
export type { OfflineSong, DownloadProgress };