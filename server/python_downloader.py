#!/usr/bin/env python3

import yt_dlp
import sys
import json
import os
import uuid
from pathlib import Path
import re
import urllib.request
from urllib.parse import urlparse

def clean_url(url):
    """Remove playlist and radio parameters from YouTube URL"""
    return url.split('&list=')[0].split('&start_radio=')[0]

def progress_hook(d):
    """Progress hook for yt-dlp to report download progress"""
    if d['status'] == 'downloading':
        percent = d.get('_percent_str', '0%').strip('%')
        try:
            progress = float(percent)
            print(f"PROGRESS:{progress}")
        except (ValueError, TypeError):
            pass
    elif d['status'] == 'finished':
        print("PROGRESS:100")

def download_thumbnail(info, file_id, output_dir):
    """Download the best available thumbnail"""
    thumbnail_url = None
    
    # Get the best thumbnail URL
    if 'thumbnails' in info and info['thumbnails']:
        # Try to get the highest quality thumbnail
        thumbnails = info['thumbnails']
        if thumbnails:
            # Find the best thumbnail (prefer larger resolutions)
            best_thumbnail = max(thumbnails, key=lambda x: (x.get('width', 0) * x.get('height', 0)))
            thumbnail_url = best_thumbnail.get('url')
    
    if not thumbnail_url:
        return None
    
    try:
        # Download thumbnail
        thumbnail_ext = 'jpg'  # Default to jpg
        if 'webp' in thumbnail_url.lower():
            thumbnail_ext = 'webp'
        elif 'png' in thumbnail_url.lower():
            thumbnail_ext = 'png'
            
        thumbnail_filename = f"{file_id}_thumbnail.{thumbnail_ext}"
        thumbnail_path = os.path.join(output_dir, thumbnail_filename)
        
        print(f"Downloading thumbnail from: {thumbnail_url}")
        urllib.request.urlretrieve(thumbnail_url, thumbnail_path)
        
        return thumbnail_filename
    except Exception as e:
        print(f"Failed to download thumbnail: {str(e)}")
        return None

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
        'format': 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
        'extractaudio': True,
        'audioformat': 'mp3',
        'audioquality': 0,  # Best quality (0 = highest, 9 = lowest)
        'prefer_ffmpeg': True,  # Use ffmpeg for better quality conversion
        'postprocessor_args': ['-ar', '44100', '-ac', '2'],  # 44.1kHz stereo for better quality
        'outtmpl': output_template,
        'quiet': False,  # Enable progress reporting
        'no_warnings': True,
        'ignoreerrors': True,
        'retries': 3,
        'fragment_retries': 3,
        'skip_unavailable_fragments': True,
        'progress_hooks': [progress_hook],  # Add progress hook
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
                
                # Download thumbnail
                print("Downloading thumbnail...")
                thumbnail_filename = download_thumbnail(info, file_id, output_dir)
                
                # Find the downloaded file
                for ext in ['mp3', 'm4a', 'webm', 'ogg']:
                    potential_file = os.path.join(output_dir, f"{file_id}.{ext}")
                    if os.path.exists(potential_file):
                        # Use original metadata as-is without parsing
                        title = info.get('title', 'Unknown')
                        artist = info.get('uploader', info.get('channel', 'Unknown'))
                            
                        return {
                            'success': True,
                            'filename': f"{file_id}.{ext}",
                            'thumbnail': thumbnail_filename,
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