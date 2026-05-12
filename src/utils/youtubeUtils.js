// src/utils/youtubeUtils.js

// IMPORTANT: Replace this with your actual YouTube Data API v3 Key
const YOUTUBE_API_KEY = 'AIzaSyBKJGyE5zlxBipRBx2Z88NYyuVjEEwWq_Q';

// Helper to convert YouTube's ISO 8601 duration (e.g., PT1H2M10S) to seconds
const parseISODuration = (duration) => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(match?.[1]) || 0;
  const minutes = parseInt(match?.[2]) || 0;
  const seconds = parseInt(match?.[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
};

// Helper to format total seconds into a readable string
const formatDuration = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

export const fetchPlaylistDetails = async (playlistUrl) => {
  try {
    // 1. Extract Playlist ID from URL
    const listMatch = playlistUrl.match(/[&?]list=([^&]+)/i);
    if (!listMatch || !listMatch[1]) throw new Error("Invalid Playlist URL");
    const playlistId = listMatch[1];

    let videoItems = [];
    let nextPageToken = '';

    // 2. Fetch all video IDs in the playlist
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (!data.items) break;
      
      videoItems.push(...data.items.map(item => item.contentDetails.videoId));
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    if (videoItems.length === 0) return null;

    let videos = [];
    let totalSeconds = 0;

    // 3. Fetch durations for all those videos in chunks of 50
    for (let i = 0; i < videoItems.length; i += 50) {
      const chunk = videoItems.slice(i, i + 50).join(',');
      const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk}&key=${YOUTUBE_API_KEY}`;
      
      const videoRes = await fetch(videoUrl);
      const videoData = await videoRes.json();
      
      if (videoData.items) {
        videoData.items.forEach(video => {
          const sec = parseISODuration(video.contentDetails.duration);
          totalSeconds += sec;
          videos.push({
            id: video.id,
            url: `https://www.youtube.com/watch?v=${video.id}&list=${playlistId}`,
            durationSec: sec,
            durationStr: formatDuration(sec)
          });
        });
      }
    }

    return {
      totalRuntime: formatDuration(totalSeconds),
      videos: videos
    };

  } catch (error) {
    console.error("Error fetching playlist data:", error);
    return null;
  }
};