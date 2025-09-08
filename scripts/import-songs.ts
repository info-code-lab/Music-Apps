import { readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from '../server/db';
import { songs } from '../shared/schema';

const execAsync = promisify(exec);

// Audio file extensions to look for
const audioExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.aac'];

interface AudioMetadata {
  duration: number;
  title?: string;
  artist?: string;
  album?: string;
}

// Extract metadata using ffprobe
async function extractMetadata(filePath: string): Promise<AudioMetadata> {
  try {
    const command = `ffprobe -v quiet -show_format -show_streams -print_format json "${filePath}"`;
    const { stdout } = await execAsync(command);
    const metadata = JSON.parse(stdout);
    
    const duration = parseFloat(metadata.format.duration || 0);
    const tags = metadata.format.tags || {};
    
    // Extract common tag variations
    const title = tags.title || tags.Title || tags.TITLE || 
                 basename(filePath, extname(filePath));
    const artist = tags.artist || tags.Artist || tags.ARTIST || 
                  tags.album_artist || tags['album-artist'] || 'Unknown Artist';
    const album = tags.album || tags.Album || tags.ALBUM;
    
    return {
      duration: Math.round(duration),
      title: title as string,
      artist: artist as string,
      album: album as string
    };
  } catch (error) {
    console.error(`Failed to extract metadata from ${filePath}:`, error);
    // Fallback to filename parsing
    return parseFilename(filePath);
  }
}

// Parse filename to extract artist and title
function parseFilename(filePath: string): AudioMetadata {
  const filename = basename(filePath, extname(filePath));
  
  // Try to parse common formats like "Artist - Title" or "Artist, Artist2 - Title"
  let artist = 'Unknown Artist';
  let title = filename;
  
  if (filename.includes(' - ')) {
    const parts = filename.split(' - ');
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }
  }
  
  return {
    duration: 0, // Will need to be extracted via ffprobe
    title,
    artist,
    album: undefined
  };
}

// Get thumbnail path if it exists
function getThumbnailPath(audioPath: string): string | undefined {
  const audioName = basename(audioPath, extname(audioPath));
  const thumbnailPath = join('uploads', `${audioName}_thumbnail.jpg`);
  
  try {
    statSync(thumbnailPath);
    return `/uploads/${audioName}_thumbnail.jpg`;
  } catch {
    return undefined;
  }
}

async function importSongs() {
  const uploadsDir = 'uploads';
  
  try {
    const files = readdirSync(uploadsDir);
    const audioFiles = files.filter(file => 
      audioExtensions.includes(extname(file).toLowerCase())
    );
    
    console.log(`Found ${audioFiles.length} audio files to import`);
    
    for (const file of audioFiles) {
      const filePath = join(uploadsDir, file);
      console.log(`Processing: ${file}`);
      
      try {
        // Extract metadata
        const metadata = await extractMetadata(filePath);
        
        // Get thumbnail if exists
        const coverArt = getThumbnailPath(filePath);
        
        // Create song record
        const songData = {
          title: metadata.title || 'Unknown Title',
          duration: metadata.duration || 0,
          filePath: `/uploads/${file}`,
          coverArt,
          contentStatus: 'approved' as const,
          isExplicit: false,
          isInstrumental: false,
          isRemix: false,
          playCount: 0,
          albumId: null,
          genreId: null,
          uploadedBy: null,
          lyrics: null
        };
        
        // Insert into database
        const [newSong] = await db
          .insert(songs)
          .values(songData)
          .returning();
        
        console.log(`✅ Imported: ${metadata.title} by ${metadata.artist} (ID: ${newSong.id})`);
        
        // TODO: Handle artist creation and association
        // For now, we'll store artist info in a simple way
        
      } catch (error) {
        console.error(`❌ Failed to import ${file}:`, error);
      }
    }
    
    console.log('\n🎵 Song import completed!');
    
    // Show final count
    const totalSongs = await db.select().from(songs);
    console.log(`Total songs in database: ${totalSongs.length}`);
    
  } catch (error) {
    console.error('Error importing songs:', error);
  }
}

// Run the import
importSongs().catch(console.error);