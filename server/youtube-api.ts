// YouTube Data API v3 integration for real video search
// This would be the production implementation

interface YouTubeSearchResult {
  youtubeId: string;
  title: string;
  description: string;
  duration: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  categoryId: string;
  tags: string[];
}

export async function searchYouTubeVideos(
  topic: string, 
  field: string, 
  level: string, 
  maxResults: number = 50
): Promise<YouTubeSearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YouTube API key not configured");
  }

  try {
    // 1. Build search query
    const educationalKeywords = getEducationalKeywords(level);
    const searchQuery = `${topic} ${field} ${educationalKeywords.join(' ')}`;
    
    // 2. Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&` +
      `q=${encodeURIComponent(searchQuery)}&` +
      `type=video&` +
      `videoDuration=medium&` + // 4-20 minutes for educational content
      `videoDefinition=any&` +
      `videoEmbeddable=true&` + // Only embeddable videos
      `order=relevance&` +
      `maxResults=${maxResults}&` +
      `key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`YouTube search failed: ${searchResponse.statusText}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }

    // 3. Get detailed video information
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?` +
      `part=snippet,contentDetails,statistics,status&` +
      `id=${videoIds}&` +
      `key=${apiKey}`;
    
    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) {
      throw new Error(`YouTube video details failed: ${detailsResponse.statusText}`);
    }
    
    const detailsData = await detailsResponse.json();
    
    // 4. Process and rank results - filter out unavailable videos
    const results: YouTubeSearchResult[] = detailsData.items
      .filter((item: any) => {
        // Only include videos that are available and have content
        return item.contentDetails &&
               item.contentDetails.duration &&
               item.contentDetails.duration !== 'PT0S' && // Not empty/zero duration
               item.snippet &&
               item.snippet.title &&
               !item.snippet.title.toLowerCase().includes('deleted') &&
               !item.snippet.title.toLowerCase().includes('unavailable');
      })
      .map((item: any) => ({
        youtubeId: item.id,
        title: item.snippet.title,
        description: item.snippet.description || '',
        duration: formatDuration(item.contentDetails.duration),
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        viewCount: parseInt(item.statistics.viewCount || '0'),
        likeCount: parseInt(item.statistics.likeCount || '0'),
        categoryId: item.snippet.categoryId,
        tags: item.snippet.tags || []
      }));

    // 5. Filter and rank by educational quality
    const rankedResults = results
      .map(video => ({
        ...video,
        educationalScore: calculateEducationalScore(video, topic, field)
      }))
      .filter(video => video.educationalScore > 0.3) // Filter out low-quality content
      .sort((a, b) => b.educationalScore - a.educationalScore);

    return rankedResults.slice(0, Math.min(maxResults, 20)); // Limit to top 20 results
    
  } catch (error) {
    console.error('YouTube API search error:', error);
    throw error;
  }
}

function getEducationalKeywords(level: string): string[] {
  const keywords = {
    undergraduate: ["introduction", "basics", "fundamentals", "tutorial", "course"],
    graduate: ["advanced", "research", "analysis", "theory", "methodology"],
    doctoral: ["research", "advanced theory", "dissertation", "PhD", "academic"]
  };
  
  return keywords[level as keyof typeof keywords] || keywords.undergraduate;
}

export async function getVideoTranscript(videoId: string): Promise<string | null> {
  // Production implementation would:
  // 1. Use youtube-transcript-api or similar
  // 2. Check if captions are available
  // 3. Extract and clean transcript text
  // 4. Handle multiple languages
  
  return null;
}

export function calculateEducationalScore(video: YouTubeSearchResult, topic: string, field: string): number {
  let score = 0.5; // Base score
  
  // Channel reputation (educational channels get higher scores)
  const educationalChannels = [
    "3Blue1Brown", "Khan Academy", "MIT OpenCourseWare", 
    "Stanford", "Harvard", "Coursera", "edX"
  ];
  
  if (educationalChannels.some(channel => 
    video.channelTitle.toLowerCase().includes(channel.toLowerCase())
  )) {
    score += 0.3;
  }
  
  // Title analysis for educational keywords
  const titleLower = video.title.toLowerCase();
  const educationalTerms = ["lecture", "course", "tutorial", "introduction", "advanced", "theory"];
  const matchingTerms = educationalTerms.filter(term => titleLower.includes(term));
  score += matchingTerms.length * 0.05;
  
  // Topic relevance
  if (titleLower.includes(topic.toLowerCase())) score += 0.2;
  if (titleLower.includes(field.toLowerCase())) score += 0.15;
  
  // Duration preference (educational content is usually 10-60 minutes)
  const duration = parseDuration(video.duration);
  if (duration >= 600 && duration <= 3600) { // 10-60 minutes
    score += 0.1;
  }
  
  // Engagement quality (views vs likes ratio)
  if (video.viewCount > 0 && video.likeCount > 0) {
    const engagementRatio = video.likeCount / video.viewCount;
    if (engagementRatio > 0.01) score += 0.1; // High engagement
  }
  
  return Math.min(1.0, score);
}

function parseDuration(duration: string): number {
  // Parse ISO 8601 duration format (PT15M33S) to seconds
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  
  return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(isoDuration: string): string {
  // Convert ISO 8601 duration (PT15M33S) to readable format (15:33)
  const totalSeconds = parseDuration(isoDuration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}