import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { offlineStorage, type DownloadProgress } from '@/lib/offline-storage';
import { FileDownloader, type DownloadProgress as FileDownloadProgress } from '@/lib/file-download';
import toast from 'react-hot-toast';
import type { LegacyTrack as Track } from '@shared/schema';

export function useDownload() {
  const [downloadingTracks, setDownloadingTracks] = useState<Set<string>>(new Set());
  const [fileDownloadingTracks, setFileDownloadingTracks] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<Map<string, number>>(new Map());
  const queryClient = useQueryClient();

  // Get offline songs
  const { data: offlineSongs = [] } = useQuery({
    queryKey: ['offline-songs'],
    queryFn: () => offlineStorage.getAllSongs(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: async (track: Track) => {
      if (!track.url) {
        throw new Error('No audio URL available');
      }

      setDownloadingTracks(prev => new Set(prev).add(track.id));

      // Set initial progress
      await offlineStorage.setDownloadProgress({
        songId: track.id,
        progress: 0,
        status: 'downloading'
      });

      try {
        const response = await fetch(track.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          chunks.push(value);
          loaded += value.length;

          if (total > 0) {
            const progress = (loaded / total) * 100;
            await offlineStorage.setDownloadProgress({
              songId: track.id,
              progress,
              status: 'downloading'
            });
          }
        }

        // Combine chunks into blob
        const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });

        // Store in IndexedDB
        await offlineStorage.storeSong({
          id: track.id,
          title: track.title,
          artist: track.artist,
          artwork: track.artwork || undefined,
          duration: track.duration,
          category: track.category,
          isFavorite: track.isFavorite || false,
          audioBlob,
          downloadedAt: Date.now(),
          originalUrl: track.url
        });

        // Mark as completed
        await offlineStorage.setDownloadProgress({
          songId: track.id,
          progress: 100,
          status: 'completed'
        });

        return track.id;
      } catch (error) {
        await offlineStorage.setDownloadProgress({
          songId: track.id,
          progress: 0,
          status: 'error'
        });
        throw error;
      } finally {
        setDownloadingTracks(prev => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
      }
    },
    onSuccess: (trackId) => {
      toast.success('Song downloaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['offline-songs'] });
      offlineStorage.clearDownloadProgress(trackId);
    },
    onError: (error: Error) => {
      toast.error(`Download failed: ${error.message}`);
    }
  });

  // Delete offline song mutation
  const deleteMutation = useMutation({
    mutationFn: async (trackId: string) => {
      await offlineStorage.deleteSong(trackId);
      return trackId;
    },
    onSuccess: () => {
      toast.success('Song removed from offline storage');
      queryClient.invalidateQueries({ queryKey: ['offline-songs'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove song: ${error.message}`);
    }
  });

  const downloadSong = useCallback((track: Track) => {
    if (isDownloaded(track.id) || downloadingTracks.has(track.id)) {
      return;
    }
    downloadMutation.mutate(track);
  }, [downloadMutation, downloadingTracks]);

  const deleteSong = useCallback((trackId: string) => {
    deleteMutation.mutate(trackId);
  }, [deleteMutation]);

  const isDownloaded = useCallback((trackId: string) => {
    return offlineSongs.some(song => song.id === trackId);
  }, [offlineSongs]);

  const isDownloading = useCallback((trackId: string) => {
    return downloadingTracks.has(trackId);
  }, [downloadingTracks]);

  const getOfflineSong = useCallback(async (trackId: string) => {
    return await offlineStorage.getSong(trackId);
  }, []);

  const getStorageSize = useCallback(async () => {
    return await offlineStorage.getStorageSize();
  }, []);

  // File download mutation (downloads to device storage)
  const fileDownloadMutation = useMutation({
    mutationFn: async (track: Track) => {
      if (!track.url) {
        throw new Error('No audio URL available');
      }

      setFileDownloadingTracks(prev => new Set(prev).add(track.id));

      try {
        await FileDownloader.downloadToDevice(track, (progress) => {
          setDownloadProgress(prev => new Map(prev).set(track.id, progress.percentage));
        });
        return track.id;
      } finally {
        setFileDownloadingTracks(prev => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
        setDownloadProgress(prev => {
          const next = new Map(prev);
          next.delete(track.id);
          return next;
        });
      }
    },
    onSuccess: () => {
      toast.success('Song downloaded to your device successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Download failed: ${error.message}`);
    }
  });

  const downloadToDevice = useCallback((track: Track) => {
    if (fileDownloadingTracks.has(track.id)) {
      return;
    }
    fileDownloadMutation.mutate(track);
  }, [fileDownloadMutation, fileDownloadingTracks]);

  const isDownloadingToDevice = useCallback((trackId: string) => {
    return fileDownloadingTracks.has(trackId);
  }, [fileDownloadingTracks]);

  const getFileDownloadProgress = useCallback((trackId: string) => {
    return downloadProgress.get(trackId) || 0;
  }, [downloadProgress]);

  return {
    // Offline storage functions
    downloadSong,
    deleteSong,
    isDownloaded,
    isDownloading,
    getOfflineSong,
    getStorageSize,
    offlineSongs,
    downloadingTracks: Array.from(downloadingTracks),
    
    // File download functions
    downloadToDevice,
    isDownloadingToDevice,
    getFileDownloadProgress,
    isFileDownloadSupported: FileDownloader.isSupported()
  };
}