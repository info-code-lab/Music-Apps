import { type User, type InsertUser, type Track, type InsertTrack } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Track operations
  getAllTracks(): Promise<Track[]>;
  getTrack(id: string): Promise<Track | undefined>;
  createTrack(track: InsertTrack): Promise<Track>;
  updateTrack(id: string, updates: Partial<Track>): Promise<Track | undefined>;
  deleteTrack(id: string): Promise<boolean>;
  searchTracks(query: string): Promise<Track[]>;
  getTracksByCategory(category: string): Promise<Track[]>;
  toggleFavorite(id: string): Promise<Track | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tracks: Map<string, Track>;

  constructor() {
    this.users = new Map();
    this.tracks = new Map();
    
    // Initialize with some sample tracks
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    const sampleTracks: InsertTrack[] = [
      {
        title: "Smooth Night",
        artist: "Marcus Johnson",
        category: "Jazz",
        duration: 204, // 3:24
        url: "https://www.soundjay.com/misc/sounds/jazz-sample.mp3",
        artwork: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        isFavorite: true,
        uploadType: "url"
      },
      {
        title: "Digital Dreams",
        artist: "Cyber Wave",
        category: "Electronic",
        duration: 252, // 4:12
        url: "https://www.soundjay.com/misc/sounds/electronic-sample.mp3",
        artwork: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        isFavorite: false,
        uploadType: "url"
      },
      {
        title: "Moonlight Sonata",
        artist: "Ludwig van Beethoven",
        category: "Classical",
        duration: 453, // 7:33
        url: "https://www.soundjay.com/misc/sounds/classical-sample.mp3",
        artwork: "https://images.unsplash.com/photo-1465821185615-20b3c2fbf41b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        isFavorite: true,
        uploadType: "url"
      },
      {
        title: "Thunder Road",
        artist: "The Storm Riders",
        category: "Rock",
        duration: 227, // 3:47
        url: "https://www.soundjay.com/misc/sounds/rock-sample.mp3",
        artwork: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        isFavorite: false,
        uploadType: "url"
      },
      {
        title: "Campfire Stories",
        artist: "Emma Woods",
        category: "Folk",
        duration: 176, // 2:56
        url: "https://www.soundjay.com/misc/sounds/folk-sample.mp3",
        artwork: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        isFavorite: false,
        uploadType: "url"
      },
      {
        title: "City Lights",
        artist: "DJ Metro",
        category: "Hip-Hop",
        duration: 198, // 3:18
        url: "https://www.soundjay.com/misc/sounds/hiphop-sample.mp3",
        artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        isFavorite: false,
        uploadType: "url"
      }
    ];

    for (const track of sampleTracks) {
      await this.createTrack(track);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllTracks(): Promise<Track[]> {
    return Array.from(this.tracks.values());
  }

  async getTrack(id: string): Promise<Track | undefined> {
    return this.tracks.get(id);
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const id = randomUUID();
    const track: Track = { 
      ...insertTrack, 
      id,
      artwork: insertTrack.artwork || null,
      isFavorite: insertTrack.isFavorite || false
    };
    this.tracks.set(id, track);
    return track;
  }

  async updateTrack(id: string, updates: Partial<Track>): Promise<Track | undefined> {
    const track = this.tracks.get(id);
    if (!track) return undefined;
    
    const updatedTrack = { ...track, ...updates };
    this.tracks.set(id, updatedTrack);
    return updatedTrack;
  }

  async deleteTrack(id: string): Promise<boolean> {
    return this.tracks.delete(id);
  }

  async searchTracks(query: string): Promise<Track[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.tracks.values()).filter(
      track => 
        track.title.toLowerCase().includes(lowercaseQuery) ||
        track.artist.toLowerCase().includes(lowercaseQuery) ||
        track.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getTracksByCategory(category: string): Promise<Track[]> {
    if (category === "All Categories") {
      return this.getAllTracks();
    }
    return Array.from(this.tracks.values()).filter(
      track => track.category.toLowerCase() === category.toLowerCase()
    );
  }

  async toggleFavorite(id: string): Promise<Track | undefined> {
    const track = this.tracks.get(id);
    if (!track) return undefined;
    
    const updatedTrack = { ...track, isFavorite: !track.isFavorite };
    this.tracks.set(id, updatedTrack);
    return updatedTrack;
  }
}

export const storage = new MemStorage();
