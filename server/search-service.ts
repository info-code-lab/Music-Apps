import { storage } from "./storage";
import type { Song, Artist, Album, User, Genre } from "@shared/schema";

export interface SearchFilters {
  genre?: string;
  artist?: string;
  album?: string;
  duration?: { min?: number; max?: number };
  year?: { min?: number; max?: number };
  quality?: string[];
  mood?: string[];
  bpm?: { min?: number; max?: number };
}

export interface SearchResult {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  genres: Genre[];
  playlists: any[];
  total: number;
  query: string;
  filters: SearchFilters;
  suggestions: string[];
}

export interface RecommendationOptions {
  userId: string;
  baseSongId?: string;
  limit?: number;
  algorithm?: 'collaborative' | 'content_based' | 'hybrid';
  diversityBoost?: number;
}

export class SearchService {
  private searchHistory: Map<string, string[]> = new Map();
  private popularQueries: Map<string, number> = new Map();

  // Main search function with advanced filtering
  async search(
    query: string, 
    filters: SearchFilters = {}, 
    limit: number = 50,
    offset: number = 0
  ): Promise<SearchResult> {
    try {
      // Clean and prepare query
      const cleanQuery = this.cleanQuery(query);
      const searchTerms = this.extractSearchTerms(cleanQuery);
      
      // Track search for analytics
      this.trackSearch(cleanQuery);
      
      // Parallel search across different content types
      const [songs, artists, albums, genres, playlists] = await Promise.all([
        this.searchSongs(searchTerms, filters, limit, offset),
        this.searchArtists(searchTerms, Math.min(limit, 20)),
        this.searchAlbums(searchTerms, Math.min(limit, 20)),
        this.searchGenres(searchTerms, Math.min(limit, 10)),
        this.searchPlaylists(searchTerms, Math.min(limit, 20))
      ]);

      // Generate search suggestions
      const suggestions = this.generateSuggestions(cleanQuery);

      const total = songs.length + artists.length + albums.length + genres.length + playlists.length;

      return {
        songs,
        artists,
        albums,
        genres,
        playlists,
        total,
        query: cleanQuery,
        filters,
        suggestions
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  private async searchSongs(
    terms: string[], 
    filters: SearchFilters, 
    limit: number, 
    offset: number
  ): Promise<Song[]> {
    // This would use advanced database search with full-text search
    // For now, we'll use a simplified version
    const allSongs = await storage.getAllSongs();
    
    let results = allSongs.filter(song => {
      const searchableText = `${song.title} ${song.albumId} ${song.genreId}`.toLowerCase();
      return terms.some(term => searchableText.includes(term.toLowerCase()));
    });

    // Apply filters
    if (filters.genre) {
      results = results.filter(song => song.genreId === filters.genre);
    }

    if (filters.duration) {
      results = results.filter(song => {
        const duration = song.duration || 0;
        const min = filters.duration?.min || 0;
        const max = filters.duration?.max || Infinity;
        return duration >= min && duration <= max;
      });
    }

    if (filters.mood && filters.mood.length > 0) {
      results = results.filter(song => 
        filters.mood?.includes(song.mood || '')
      );
    }

    if (filters.bpm) {
      results = results.filter(song => {
        const bpm = song.bpm || 0;
        const min = filters.bpm?.min || 0;
        const max = filters.bpm?.max || Infinity;
        return bpm >= min && bpm <= max;
      });
    }

    // Sort by relevance (simplified scoring)
    results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, terms);
      const scoreB = this.calculateRelevanceScore(b, terms);
      return scoreB - scoreA;
    });

    return results.slice(offset, offset + limit);
  }

  private async searchArtists(terms: string[], limit: number): Promise<Artist[]> {
    const allArtists = await storage.getAllArtists();
    
    const results = allArtists.filter(artist => {
      const searchableText = `${artist.name} ${artist.bio || ''}`.toLowerCase();
      return terms.some(term => searchableText.includes(term.toLowerCase()));
    });

    return results.slice(0, limit);
  }

  private async searchAlbums(terms: string[], limit: number): Promise<Album[]> {
    const allAlbums = await storage.getAllAlbums();
    
    const results = allAlbums.filter(album => {
      const searchableText = `${album.title} ${album.artistId}`.toLowerCase();
      return terms.some(term => searchableText.includes(term.toLowerCase()));
    });

    return results.slice(0, limit);
  }

  private async searchGenres(terms: string[], limit: number): Promise<Genre[]> {
    const allGenres = await storage.getAllGenres();
    
    const results = allGenres.filter(genre => {
      const searchableText = `${genre.name} ${genre.description || ''}`.toLowerCase();
      return terms.some(term => searchableText.includes(term.toLowerCase()));
    });

    return results.slice(0, limit);
  }

  private async searchPlaylists(terms: string[], limit: number): Promise<any[]> {
    // This would search user playlists
    // For now, return empty array
    return [];
  }

  private calculateRelevanceScore(song: Song, terms: string[]): number {
    let score = 0;
    const title = song.title.toLowerCase();
    
    terms.forEach(term => {
      const termLower = term.toLowerCase();
      
      // Exact title match gets highest score
      if (title === termLower) score += 100;
      
      // Title starts with term
      else if (title.startsWith(termLower)) score += 50;
      
      // Title contains term
      else if (title.includes(termLower)) score += 25;
      
      // Other fields contain term
      else if (song.genreId?.toLowerCase().includes(termLower)) score += 10;
    });

    // Boost popular songs
    score += (song.playCount || 0) * 0.1;
    
    // Boost recent songs
    if (song.createdAt) {
      const daysSinceCreation = (Date.now() - new Date(song.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 30) score += 5; // Recent songs get small boost
    }

    return score;
  }

  // Generate music recommendations
  async getRecommendations(options: RecommendationOptions): Promise<Song[]> {
    const { userId, baseSongId, limit = 10, algorithm = 'hybrid' } = options;
    
    try {
      let recommendations: Song[] = [];

      switch (algorithm) {
        case 'collaborative':
          recommendations = await this.getCollaborativeRecommendations(userId, limit);
          break;
        case 'content_based':
          if (baseSongId) {
            recommendations = await this.getContentBasedRecommendations(baseSongId, limit);
          } else {
            recommendations = await this.getUserContentRecommendations(userId, limit);
          }
          break;
        case 'hybrid':
        default:
          recommendations = await this.getHybridRecommendations(userId, baseSongId, limit);
          break;
      }

      // Apply diversity boost if specified
      if (options.diversityBoost && options.diversityBoost > 0) {
        recommendations = this.applyDiversityBoost(recommendations, options.diversityBoost);
      }

      return recommendations;
    } catch (error) {
      console.error('Recommendation error:', error);
      return [];
    }
  }

  private async getCollaborativeRecommendations(userId: string, limit: number): Promise<Song[]> {
    // "Users who liked X also liked Y" approach
    // This would analyze user behavior patterns
    
    // For now, return popular songs that user hasn't played
    const allSongs = await storage.getAllSongs();
    const userHistory = await storage.getUserListeningHistory(userId);
    const playedSongIds = new Set(userHistory.map(h => h.id));
    
    const unplayedSongs = allSongs.filter(song => !playedSongIds.has(song.id));
    
    // Sort by popularity (play count)
    unplayedSongs.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    
    return unplayedSongs.slice(0, limit);
  }

  private async getContentBasedRecommendations(baseSongId: string, limit: number): Promise<Song[]> {
    const baseSong = await storage.getSong(baseSongId);
    if (!baseSong) return [];

    const allSongs = await storage.getAllSongs();
    
    // Calculate similarity scores based on audio features
    const recommendations = allSongs
      .filter(song => song.id !== baseSongId)
      .map(song => ({
        song,
        similarity: this.calculateSongSimilarity(baseSong, song)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.song);

    return recommendations;
  }

  private async getUserContentRecommendations(userId: string, limit: number): Promise<Song[]> {
    // Recommend based on user's listening patterns and preferences
    const userHistory = await storage.getUserListeningHistory(userId);
    
    if (userHistory.length === 0) {
      // New user - return popular/trending songs
      return this.getTrendingSongs(limit);
    }

    // Analyze user's favorite genres, artists, etc.
    const genrePreferences = this.analyzeGenrePreferences(userHistory);
    const moodPreferences = this.analyzeMoodPreferences(userHistory);
    
    const allSongs = await storage.getAllSongs();
    const playedSongIds = new Set(userHistory.map(h => h.id));
    
    const recommendations = allSongs
      .filter(song => !playedSongIds.has(song.id))
      .map(song => ({
        song,
        score: this.calculateUserAffinityScore(song, genrePreferences, moodPreferences)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.song);

    return recommendations;
  }

  private async getHybridRecommendations(userId: string, baseSongId?: string, limit: number = 10): Promise<Song[]> {
    const collaborativeWeight = 0.4;
    const contentWeight = 0.6;
    
    // Get recommendations from both approaches
    const [collaborative, contentBased] = await Promise.all([
      this.getCollaborativeRecommendations(userId, Math.ceil(limit * 1.5)),
      baseSongId 
        ? this.getContentBasedRecommendations(baseSongId, Math.ceil(limit * 1.5))
        : this.getUserContentRecommendations(userId, Math.ceil(limit * 1.5))
    ]);

    // Combine and weight the results
    const combinedScores = new Map<string, number>();
    
    collaborative.forEach((song, index) => {
      const score = (collaborative.length - index) * collaborativeWeight;
      combinedScores.set(song.id, (combinedScores.get(song.id) || 0) + score);
    });

    contentBased.forEach((song, index) => {
      const score = (contentBased.length - index) * contentWeight;
      combinedScores.set(song.id, (combinedScores.get(song.id) || 0) + score);
    });

    // Get unique songs and sort by combined score
    const allSongs = [...collaborative, ...contentBased];
    const uniqueSongs = Array.from(new Map(allSongs.map(s => [s.id, s])).values());
    
    uniqueSongs.sort((a, b) => 
      (combinedScores.get(b.id) || 0) - (combinedScores.get(a.id) || 0)
    );

    return uniqueSongs.slice(0, limit);
  }

  private calculateSongSimilarity(song1: Song, song2: Song): number {
    let similarity = 0;

    // Genre similarity
    if (song1.genreId === song2.genreId) similarity += 30;

    // Mood similarity
    if (song1.mood === song2.mood) similarity += 20;

    // BPM similarity
    if (song1.bpm && song2.bpm) {
      const bpmDiff = Math.abs(song1.bpm - song2.bpm);
      const bpmSimilarity = Math.max(0, 20 - (bpmDiff / 10));
      similarity += bpmSimilarity;
    }

    // Duration similarity
    if (song1.duration && song2.duration) {
      const durationDiff = Math.abs(song1.duration - song2.duration);
      const durationSimilarity = Math.max(0, 10 - (durationDiff / 30));
      similarity += durationSimilarity;
    }

    // Audio features similarity (energy, danceability, etc.)
    const audioFeatures = ['energy', 'danceability', 'valence', 'acousticness'];
    audioFeatures.forEach(feature => {
      const val1 = (song1 as any)[feature];
      const val2 = (song2 as any)[feature];
      if (val1 && val2) {
        const diff = Math.abs(parseFloat(val1) - parseFloat(val2));
        similarity += Math.max(0, 5 - diff);
      }
    });

    return similarity;
  }

  private async getTrendingSongs(limit: number): Promise<Song[]> {
    const allSongs = await storage.getAllSongs();
    
    // Simple trending algorithm based on recent play count
    const recentCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    return allSongs
      .filter(song => {
        const createdTime = song.createdAt ? new Date(song.createdAt).getTime() : 0;
        return createdTime > recentCutoff;
      })
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      .slice(0, limit);
  }

  private analyzeGenrePreferences(history: any[]): Map<string, number> {
    const genreCount = new Map<string, number>();
    
    history.forEach(item => {
      if (item.song?.genreId) {
        genreCount.set(item.song.genreId, (genreCount.get(item.song.genreId) || 0) + 1);
      }
    });

    return genreCount;
  }

  private analyzeMoodPreferences(history: any[]): Map<string, number> {
    const moodCount = new Map<string, number>();
    
    history.forEach(item => {
      if (item.song?.mood) {
        moodCount.set(item.song.mood, (moodCount.get(item.song.mood) || 0) + 1);
      }
    });

    return moodCount;
  }

  private calculateUserAffinityScore(
    song: Song, 
    genrePrefs: Map<string, number>, 
    moodPrefs: Map<string, number>
  ): number {
    let score = 0;

    // Genre preference
    if (song.genreId && genrePrefs.has(song.genreId)) {
      score += (genrePrefs.get(song.genreId) || 0) * 10;
    }

    // Mood preference
    if (song.mood && moodPrefs.has(song.mood)) {
      score += (moodPrefs.get(song.mood) || 0) * 5;
    }

    // Popularity boost
    score += (song.playCount || 0) * 0.1;

    return score;
  }

  private applyDiversityBoost(songs: Song[], boostFactor: number): Song[] {
    // Ensure genre/mood diversity in recommendations
    const diversified: Song[] = [];
    const usedGenres = new Set<string>();
    const usedMoods = new Set<string>();

    songs.forEach(song => {
      let diversityScore = 1;

      if (song.genreId && !usedGenres.has(song.genreId)) {
        diversityScore += boostFactor;
        usedGenres.add(song.genreId);
      }

      if (song.mood && !usedMoods.has(song.mood)) {
        diversityScore += boostFactor * 0.5;
        usedMoods.add(song.mood);
      }

      // Apply diversity score by potentially reordering
      if (diversityScore > 1.5 && diversified.length < songs.length * 0.7) {
        diversified.unshift(song); // Move diverse songs to front
      } else {
        diversified.push(song);
      }
    });

    return diversified;
  }

  // Utility methods
  private cleanQuery(query: string): string {
    return query.trim().replace(/\s+/g, ' ');
  }

  private extractSearchTerms(query: string): string[] {
    return query.split(' ').filter(term => term.length > 0);
  }

  private trackSearch(query: string): void {
    this.popularQueries.set(query, (this.popularQueries.get(query) || 0) + 1);
  }

  private generateSuggestions(query: string): string[] {
    // Simple suggestion generation based on popular queries
    const suggestions: string[] = [];
    
    for (const [popularQuery, count] of this.popularQueries.entries()) {
      if (popularQuery.includes(query) && popularQuery !== query && count > 1) {
        suggestions.push(popularQuery);
      }
    }

    return suggestions.slice(0, 5);
  }

  // Get search analytics
  getSearchAnalytics() {
    return {
      totalSearches: Array.from(this.popularQueries.values()).reduce((a, b) => a + b, 0),
      uniqueQueries: this.popularQueries.size,
      topQueries: [...this.popularQueries.entries()]
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }))
    };
  }
}

export const searchService = new SearchService();