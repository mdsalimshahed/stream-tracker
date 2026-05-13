// src/utils/youtubeUtils.js

// IMPORTANT: Replace this with your actual YouTube Data API v3 Key
const YOUTUBE_API_KEY = 'AIzaSyBKJGyE5zlxBipRBx2Z88NYyuVjEEwWq_Q';

const parseISODuration = (duration) => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(match?.[1]) || 0;
  const minutes = parseInt(match?.[2]) || 0;
  const seconds = parseInt(match?.[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
};

export const fetchPlaylistDetails = async (playlistUrl) => {
  try {
    const listMatch = playlistUrl.match(/[&?]list=([^&]+)/i);
    if (!listMatch || !listMatch[1]) throw new Error("Invalid Playlist URL");
    const playlistId = listMatch[1];

    let videoItems = [];
    let nextPageToken = '';

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
    for (let i = 0; i < videoItems.length; i += 50) {
      const chunk = videoItems.slice(i, i + 50).join(',');
      const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${chunk}&key=${YOUTUBE_API_KEY}`;
      const videoRes = await fetch(videoUrl);
      const videoData = await videoRes.json();
      
      if (videoData.items) {
        videoData.items.forEach(video => {
          videos.push({
            videoId: video.id,
            duration: parseISODuration(video.contentDetails.duration),
            publishedAt: video.snippet.publishedAt
          });
        });
      }
    }
    return videos;
  } catch (error) {
    console.error("Error fetching playlist data:", error);
    return null;
  }
};