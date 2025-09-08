import { db } from '../server/db';
import { genres, artists, albums, songs, songArtists, playlists, playlistSongs } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function populateDatabase() {
  console.log('🎵 Starting database population...\n');

  // 1. Insert Genres
  console.log('📁 Creating music genres...');
  const genreData = [
    { name: 'Pop', description: 'Popular music with catchy melodies and wide appeal' },
    { name: 'Rock', description: 'Guitar-driven music with strong rhythms' },
    { name: 'Hip-Hop', description: 'Rhythmic and rhyming speech with beats' },
    { name: 'Electronic', description: 'Music created using electronic devices and synthesizers' },
    { name: 'Jazz', description: 'Music characterized by improvisation and syncopation' },
    { name: 'Classical', description: 'Traditional orchestral and chamber music' },
    { name: 'Folk', description: 'Traditional music passed down through generations' },
    { name: 'Bollywood', description: 'Music from Indian Hindi-language films' },
    { name: 'World Music', description: 'Traditional and contemporary music from around the world' }
  ];

  const insertedGenres = await db.insert(genres).values(genreData).returning();
  console.log(`✅ Created ${insertedGenres.length} genres`);

  // Get the Bollywood genre for our existing songs
  const bollywoodGenre = insertedGenres.find(g => g.name === 'Bollywood');
  const popGenre = insertedGenres.find(g => g.name === 'Pop');

  // 2. Extract and create artists from existing songs
  console.log('\n🎤 Creating artists from existing songs...');
  
  // Get existing songs to extract artist information
  const existingSongs = await db.select().from(songs);
  
  const artistsToCreate = new Set<string>();
  
  // Parse artists from song titles/filenames
  existingSongs.forEach(song => {
    if (song.title?.includes('Sai Abhyankkar')) {
      artistsToCreate.add('Sai Abhyankkar');
      artistsToCreate.add('Paal Dabba');
      artistsToCreate.add('bebhumika');
      artistsToCreate.add('Deepthi Suresh');
    }
    if (song.title?.includes('Saiyaara')) {
      artistsToCreate.add('Tanishk Bagchi');
      artistsToCreate.add('Faheem Abdullah');
      artistsToCreate.add('Arslan Nizami');
      artistsToCreate.add('Irshad Kamil');
    }
  });

  // Add some additional popular artists
  artistsToCreate.add('Unknown Artist');
  artistsToCreate.add('Various Artists');

  const artistData = Array.from(artistsToCreate).map(name => ({
    name,
    bio: `${name} is a talented music artist`,
    country: name.includes('Tanishk') || name.includes('Sai') ? 'India' : null,
    isVerified: false,
    followerCount: Math.floor(Math.random() * 10000)
  }));

  const insertedArtists = await db.insert(artists).values(artistData).returning();
  console.log(`✅ Created ${insertedArtists.length} artists`);

  // 3. Create Albums
  console.log('\n💽 Creating albums...');
  // Need an artist for albums, let's use the first created artist or create a default one
  const defaultArtist = insertedArtists[0];
  
  const albumData = [
    {
      title: 'Dude (Original Motion Picture Soundtrack)',
      artistId: defaultArtist.id,
      releaseDate: '2023-01-01',
    },
    {
      title: 'Saiyaara (Original Soundtrack)',
      artistId: defaultArtist.id,
      releaseDate: '2023-01-01',
    },
    {
      title: 'Mixed Collection',
      artistId: defaultArtist.id,
      releaseDate: '2024-01-01',
    }
  ];

  const insertedAlbums = await db.insert(albums).values(albumData).returning();
  console.log(`✅ Created ${insertedAlbums.length} albums`);

  // 4. Update existing songs with genre and album associations
  console.log('\n🔗 Linking songs to albums and genres...');
  
  const dudeAlbum = insertedAlbums.find(a => a.title.includes('Dude'));
  const saiyaaraAlbum = insertedAlbums.find(a => a.title.includes('Saiyaara'));
  const mixedAlbum = insertedAlbums.find(a => a.title.includes('Mixed'));

  for (const song of existingSongs) {
    let albumId = mixedAlbum?.id || null;
    let genreId = popGenre?.id || null;

    if (song.title?.includes('Oorum Blood')) {
      albumId = dudeAlbum?.id || null;
      genreId = bollywoodGenre?.id || null;
    } else if (song.title?.includes('Saiyaara')) {
      albumId = saiyaaraAlbum?.id || null;
      genreId = bollywoodGenre?.id || null;
    }

    await db.update(songs)
      .set({ albumId, genreId })
      .where(eq(songs.id, song.id));
  }

  // 5. Create song-artist relationships
  console.log('\n🎵 Creating song-artist relationships...');
  
  for (const song of existingSongs) {
    if (song.title?.includes('Oorum Blood')) {
      // Link to multiple artists for this song
      const songArtistIds = ['Sai Abhyankkar', 'Paal Dabba', 'bebhumika', 'Deepthi Suresh'];
      for (const artistName of songArtistIds) {
        const artist = insertedArtists.find(a => a.name === artistName);
        if (artist) {
          await db.insert(songArtists).values({
            songId: song.id,
            artistId: artist.id
          });
        }
      }
    } else if (song.title?.includes('Saiyaara')) {
      // Link to multiple artists for this song
      const songArtistIds = ['Tanishk Bagchi', 'Faheem Abdullah', 'Arslan Nizami', 'Irshad Kamil'];
      for (const artistName of songArtistIds) {
        const artist = insertedArtists.find(a => a.name === artistName);
        if (artist) {
          await db.insert(songArtists).values({
            songId: song.id,
            artistId: artist.id
          });
        }
      }
    } else {
      // Link to Unknown Artist for other songs
      const unknownArtist = insertedArtists.find(a => a.name === 'Unknown Artist');
      if (unknownArtist) {
        await db.insert(songArtists).values({
          songId: song.id,
          artistId: unknownArtist.id
        });
      }
    }
  }

  // 6. Create sample playlists
  console.log('\n📋 Creating sample playlists...');
  const playlistData = [
    {
      name: 'Bollywood Hits',
      description: 'Best Bollywood songs collection',
      isPublic: true,
      userId: '4987c948-fe2a-4d14-9f88-98f753e011a6' // admin user
    },
    {
      name: 'Mixed Favorites',
      description: 'A collection of favorite tracks',
      isPublic: true,
      userId: '14a7a084-262e-4e5f-91fd-e9d8e9a68dd7' // regular user
    },
    {
      name: 'All Songs',
      description: 'Complete music library',
      isPublic: true,
      userId: '4987c948-fe2a-4d14-9f88-98f753e011a6' // admin user
    }
  ];

  const insertedPlaylists = await db.insert(playlists).values(playlistData).returning();
  console.log(`✅ Created ${insertedPlaylists.length} playlists`);

  // 7. Add songs to playlists
  console.log('\n🎶 Adding songs to playlists...');
  
  const bollywoodPlaylist = insertedPlaylists.find(p => p.name === 'Bollywood Hits');
  const mixedPlaylist = insertedPlaylists.find(p => p.name === 'Mixed Favorites');
  const allSongsPlaylist = insertedPlaylists.find(p => p.name === 'All Songs');

  const allSongs = await db.select().from(songs);

  // Add Bollywood songs to Bollywood playlist
  let position = 1;
  for (const song of allSongs) {
    if (song.title?.includes('Oorum Blood') || song.title?.includes('Saiyaara')) {
      if (bollywoodPlaylist) {
        await db.insert(playlistSongs).values({
          playlistId: bollywoodPlaylist.id,
          songId: song.id
        });
        position++;
      }
    }
  }

  // Add first 3 songs to mixed playlist
  position = 1;
  for (const song of allSongs.slice(0, 3)) {
    if (mixedPlaylist) {
      await db.insert(playlistSongs).values({
        playlistId: mixedPlaylist.id,
        songId: song.id
      });
      position++;
    }
  }

  // Add all songs to "All Songs" playlist
  position = 1;
  for (const song of allSongs) {
    if (allSongsPlaylist) {
      await db.insert(playlistSongs).values({
        playlistId: allSongsPlaylist.id,
        songId: song.id
      });
      position++;
    }
  }

  console.log('\n✅ Database population completed successfully!');
  
  // Final summary
  const finalCounts = {
    songs: await db.select().from(songs).then(r => r.length),
    artists: await db.select().from(artists).then(r => r.length),
    albums: await db.select().from(albums).then(r => r.length),
    genres: await db.select().from(genres).then(r => r.length),
    playlists: await db.select().from(playlists).then(r => r.length),
    songArtists: await db.select().from(songArtists).then(r => r.length),
    playlistSongs: await db.select().from(playlistSongs).then(r => r.length)
  };

  console.log('\n📊 Final Database Summary:');
  console.log(`   Songs: ${finalCounts.songs}`);
  console.log(`   Artists: ${finalCounts.artists}`);
  console.log(`   Albums: ${finalCounts.albums}`);
  console.log(`   Genres: ${finalCounts.genres}`);
  console.log(`   Playlists: ${finalCounts.playlists}`);
  console.log(`   Song-Artist links: ${finalCounts.songArtists}`);
  console.log(`   Playlist songs: ${finalCounts.playlistSongs}`);
}

// Run the population
populateDatabase().catch(console.error);