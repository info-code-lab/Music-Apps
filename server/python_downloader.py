#!/usr/bin/env python3

import yt_dlp
import sys
import json
import os
import uuid
from pathlib import Path
import re

def clean_url(url):
    """Remove playlist and radio parameters from YouTube URL"""
    return url.split('&list=')[0].split('&start_radio=')[0]

def download_youtube_audio(url, output_dir):
    """Download audio from YouTube with multiple fallback strategies"""
    
    # Clean the URL
    clean_url_str = clean_url(url)
    print(f"Cleaned URL: {clean_url_str}")
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    output_template = os.path.join(output_dir, f"{file_id}.%(ext)s")
    
    # Advanced bypass configurations
    strategies = [
        {
            'name': 'Android Client',
            'extractor_args': {
                'youtube': {
                    'player_client': ['android'],
                }
            },
            'user_agent': 'com.google.android.youtube/17.31.35 (Linux; U; Android 11) gzip'
        },
        {
            'name': 'iOS Client', 
            'extractor_args': {
                'youtube': {
                    'player_client': ['ios'],
                }
            },
            'user_agent': 'com.google.ios.youtube/17.33.2 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)'
        },
        {
            'name': 'TV Client',
            'extractor_args': {
                'youtube': {
                    'player_client': ['tv'],
                }
            }
        },
        {
            'name': 'Web Client with Bypass',
            'extractor_args': {
                'youtube': {
                    'player_client': ['web'],
                    'player_skip': ['configs', 'webpage'],
                }
            },
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        {
            'name': 'Android Music',
            'extractor_args': {
                'youtube': {
                    'player_client': ['android_music'],
                }
            },
            'user_agent': 'com.google.android.apps.youtube.music/5.16.51 (Linux; U; Android 11) gzip'
        },
        {
            'name': 'TV Embedded',
            'extractor_args': {
                'youtube': {
                    'player_client': ['tv_embedded'],
                }
            }
        },
        {
            'name': 'Age Gate Bypass',
            'extractor_args': {
                'youtube': {
                    'player_client': ['android'],
                    'player_skip': ['dash', 'hls'],
                }
            },
            'age_limit': 99
        },
        {
            'name': 'Embed Bypass',
            'embed_subs': True,
            'writesubtitles': False,
            'user_agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        }
    ]
    
    base_options = {
        'format': 'bestaudio/best',
        'extractaudio': True,
        'audioformat': 'mp3',
        'audioquality': 0,
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
        'ignoreerrors': True,
        'retries': 3,
        'fragment_retries': 3,
        'skip_unavailable_fragments': True,
    }
    
    for i, strategy in enumerate(strategies):
        try:
            print(f"Attempt {i + 1}: {strategy['name']}")
            
            # Merge base options with strategy-specific options
            options = {**base_options, **strategy}
            
            with yt_dlp.YoutubeDL(options) as ydl:
                # Extract info first to get metadata
                info = ydl.extract_info(clean_url_str, download=False)
                if not info:
                    continue
                    
                # Download the audio
                ydl.download([clean_url_str])
                
                # Find the downloaded file
                for ext in ['mp3', 'm4a', 'webm', 'ogg']:
                    potential_file = os.path.join(output_dir, f"{file_id}.{ext}")
                    if os.path.exists(potential_file):
                        # Extract better metadata
                        title = info.get('title', 'Unknown')
                        
                        # Try to extract artist from title (common formats: "Artist - Song", "Artist: Song")
                        artist = info.get('uploader', 'Unknown')
                        if ' - ' in title:
                            parts = title.split(' - ', 1)
                            if len(parts) == 2:
                                artist = parts[0].strip()
                                title = parts[1].strip()
                        elif ': ' in title:
                            parts = title.split(': ', 1)
                            if len(parts) == 2:
                                artist = parts[0].strip()
                                title = parts[1].strip()
                        
                        # Try to get artist from channel name if uploader looks like an artist
                        if artist == 'Unknown' or 'Records' in artist or 'Music' in artist:
                            artist = info.get('channel', info.get('uploader', 'Unknown'))
                            
                        return {
                            'success': True,
                            'filename': f"{file_id}.{ext}",
                            'title': title,
                            'artist': artist,
                            'duration': info.get('duration', 0),
                            'strategy': strategy['name']
                        }
                        
        except Exception as e:
            print(f"Attempt {i + 1} failed: {str(e)}")
            continue
    
    return {'success': False, 'error': 'All download strategies failed'}

def main():
    if len(sys.argv) != 3:
        print(json.dumps({'success': False, 'error': 'Usage: python_downloader.py <url> <output_dir>'}))
        sys.exit(1)
    
    url = sys.argv[1]
    output_dir = sys.argv[2]
    
    # Ensure output directory exists
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    try:
        result = download_youtube_audio(url, output_dir)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

if __name__ == "__main__":
    main()