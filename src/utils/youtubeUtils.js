// src/utils/youtubeUtils.js

const parseISODuration = (duration) => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(match?.[1]) || 0;
  const minutes = parseInt(match?.[2]) || 0;
  const seconds = parseInt(match?.[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Fetches playlist items and merges with existing metadata to minimize API calls.
 * @param {string} playlistUrl 
 * @param {Object} existingMetadata - Map of { videoId: { duration, startTime, endTime, title } }
 */
export const fetchPlaylistDetails = async (playlistUrl, existingMetadata = {}) => {
  try {
    const YOUTUBE_API_KEY = localStorage.getItem('youtubeApiKey');
    if (!YOUTUBE_API_KEY) {
      console.warn("YouTube API Key is missing. Please configure it in Settings.");
      return null;
    }

    const listMatch = playlistUrl.match(/[&?]list=([^&]+)/i);
    const playlistId = listMatch ? listMatch[1] : playlistUrl;
    if (!playlistId) throw new Error("Invalid Playlist URL or ID");

    let playlistItemsList = [];
    let nextPageToken = '';

    // Step 1: Get the raw list of video IDs & snippet titles
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (!data.items) break;
      data.items.forEach(item => {
        playlistItemsList.push({
          videoId: item.contentDetails.videoId,
          publishedAt: new Date(item.snippet.publishedAt).getTime(),
          title: item.snippet.title
        });
      });
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    if (playlistItemsList.length === 0) return null;

    // Step 2: Filter for IDs that don't have duration OR startTime cached locally
    const idsToFetch = playlistItemsList.filter(v => !existingMetadata[v.videoId]?.duration || !existingMetadata[v.videoId]?.startTime).map(v => v.videoId);

    const freshDetails = {};
    if (idsToFetch.length > 0) {
      // Step 3: Fetch details ONLY for the unknown videos
      for (let i = 0; i < idsToFetch.length; i += 50) {
        const chunk = idsToFetch.slice(i, i + 50).join(',');
        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,liveStreamingDetails&id=${chunk}&key=${YOUTUBE_API_KEY}`;
        const videoRes = await fetch(videoUrl);
        const videoData = await videoRes.json();
        
        if (videoData.items) {
          videoData.items.forEach(video => {
            const actualStart = video.liveStreamingDetails?.actualStartTime;
            const actualEnd = video.liveStreamingDetails?.actualEndTime;
            const published = video.snippet?.publishedAt;
            
            freshDetails[video.id] = {
              duration: parseISODuration(video.contentDetails?.duration || "PT0S"),
              startTime: (actualStart || published) ? new Date(actualStart || published).getTime() : null,
              endTime: actualEnd ? new Date(actualEnd).getTime() : null
            };
          });
        }
      }
    }

    // Step 4: Construct the final list
    return playlistItemsList.map(item => {
      const fresh = freshDetails[item.videoId];
      const cached = existingMetadata[item.videoId];
      return {
        videoId: item.videoId,
        title: item.title, 
        startTime: fresh?.startTime || cached?.startTime || item.publishedAt,
        endTime: fresh?.endTime || cached?.endTime || null,
        duration: fresh?.duration || cached?.duration || 0
      };
    }).filter(v => v.startTime); 
  } catch (error) {
    console.error("Error fetching playlist data:", error);
    return null;
  }
};