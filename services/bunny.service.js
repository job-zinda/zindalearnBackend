import crypto from 'crypto';
import fs from 'fs';

/**
 * Bunny.net Stream Service
 * 
 * Handles video upload, deletion, status checks, and secure playback URL
 * generation for the Bunny.net Stream platform.
 * 
 * Required environment variables:
 *   BUNNY_API_KEY          – Stream API key from Bunny.net dashboard
 *   BUNNY_LIBRARY_ID       – Video library ID
 *   BUNNY_CDN_HOSTNAME     – CDN hostname (e.g. vz-abc123.b-cdn.net)
 *   BUNNY_TOKEN_AUTH_KEY   – Token authentication key for signed URLs
 */

const BUNNY_BASE_URL = 'https://video.bunnycdn.com';

/**
 * Get config from environment (read lazily so tests can override env).
 */
function getConfig() {
  return {
    apiKey: process.env.BUNNY_API_KEY,
    libraryId: process.env.BUNNY_LIBRARY_ID,
    cdnHostname: process.env.BUNNY_CDN_HOSTNAME,
    tokenAuthKey: process.env.BUNNY_TOKEN_AUTH_KEY,
  };
}

export const bunnyService = {
  /**
   * Step 1: Create a video slot in the Bunny Stream library.
   * Returns the video object including its GUID.
   * 
   * @param {string} title - Title for the video
   * @returns {Promise<Object>} Bunny video object with guid, status, etc.
   */
  createVideo: async (title) => {
    const { apiKey, libraryId } = getConfig();

    const response = await fetch(
      `${BUNNY_BASE_URL}/library/${libraryId}/videos`,
      {
        method: 'POST',
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ title }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bunny.net create video failed (${response.status}): ${errorText}`);
    }

    return response.json();
  },

  /**
   * Step 2: Upload the actual video file to the created slot.
   * Uses binary PUT with the raw file data.
   * 
   * @param {string} videoId - The GUID from createVideo()
   * @param {string} filePath - Path to the local video file
   * @returns {Promise<Object>} Upload response
   */
  uploadVideoFile: async (videoId, filePath) => {
    const { apiKey, libraryId } = getConfig();
    const fileBuffer = fs.readFileSync(filePath);

    const response = await fetch(
      `${BUNNY_BASE_URL}/library/${libraryId}/videos/${videoId}`,
      {
        method: 'PUT',
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: fileBuffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bunny.net upload failed (${response.status}): ${errorText}`);
    }

    return response.json();
  },

  /**
   * Combined: Create video slot + upload file in one call.
   * This is what the videoController will call.
   * 
   * @param {string} filePath - Path to the local video file
   * @param {string} title - Video title
   * @returns {Promise<Object>} { videoId, hlsUrl, status }
   */
  uploadVideo: async (filePath, title = 'Untitled Video') => {
    try {
      const { cdnHostname } = getConfig();

      // Step 1: Create the video slot
      const video = await bunnyService.createVideo(title);
      const videoId = video.guid;

      // Step 2: Upload the binary file
      await bunnyService.uploadVideoFile(videoId, filePath);

      // HLS URL (available after transcoding completes)
      const hlsUrl = `https://${cdnHostname}/${videoId}/playlist.m3u8`;

      return {
        videoId,
        hlsUrl,
        thumbnailUrl: `https://${cdnHostname}/${videoId}/thumbnail.jpg`,
        status: 'processing', // Bunny transcodes asynchronously
        duration: video.length || 0,
      };
    } catch (error) {
      console.error('Bunny.net upload error:', error);
      throw error;
    }
  },

  /**
   * Get video details/status from Bunny.net.
   * Useful for checking transcoding progress.
   * 
   * @param {string} videoId - The Bunny video GUID
   * @returns {Promise<Object>} Video details including status
   */
  getVideoStatus: async (videoId) => {
    const { apiKey, libraryId } = getConfig();

    const response = await fetch(
      `${BUNNY_BASE_URL}/library/${libraryId}/videos/${videoId}`,
      {
        method: 'GET',
        headers: {
          'AccessKey': apiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bunny.net get video failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Bunny status codes:
    // 0 = created, 1 = uploaded, 2 = processing, 3 = transcoding,
    // 4 = finished, 5 = error, 6 = upload_failed
    const statusMap = {
      0: 'created',
      1: 'uploaded',
      2: 'processing',
      3: 'transcoding',
      4: 'finished',
      5: 'error',
      6: 'upload_failed',
    };

    return {
      videoId: data.guid,
      title: data.title,
      status: statusMap[data.status] || 'unknown',
      statusCode: data.status,
      duration: data.length || 0, // in seconds
      width: data.width || 0,
      height: data.height || 0,
      size: data.storageSize || 0,
      isReady: data.status === 4,
    };
  },

  /**
   * Delete a video from Bunny.net Stream.
   * 
   * @param {string} videoId - The Bunny video GUID
   * @returns {Promise<void>}
   */
  deleteVideo: async (videoId) => {
    const { apiKey, libraryId } = getConfig();

    const response = await fetch(
      `${BUNNY_BASE_URL}/library/${libraryId}/videos/${videoId}`,
      {
        method: 'DELETE',
        headers: {
          'AccessKey': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bunny.net delete failed (${response.status}): ${errorText}`);
    }
  },

  /**
   * Generate a token-authenticated (signed) HLS playback URL.
   * The signed URL expires after the specified duration.
   * 
   * This prevents students from sharing video links — each URL is
   * time-limited and optionally IP-locked.
   * 
   * @param {string} videoId - The Bunny video GUID
   * @param {number} expiresInSeconds - URL validity duration (default: 6 hours)
   * @returns {Object} { url, expiresAt }
   */
  generateSignedUrl: (videoId, expiresInSeconds = 21600) => {
    const { cdnHostname, tokenAuthKey } = getConfig();

    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    
    // Use directory-level token path so ALL files under /{videoId}/ are covered.
    // HLS manifests reference relative sub-playlists (e.g. 360p/video.m3u8) and
    // .ts segments — all of these need to be authenticated.
    const tokenPath = `/${videoId}/`;

    // Bunny token authentication: SHA256(tokenAuthKey + tokenPath + expires)
    const message = tokenAuthKey + tokenPath + expires;
    const hash = crypto
      .createHash('sha256')
      .update(message)
      .digest('base64');

    // Make the hash URL-safe
    const token = hash
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Use PATH-BASED token (Bunny Token Auth v2).
    // Embedding the token in the URL path ensures that when media_kit/libmpv
    // resolves relative HLS sub-playlist URLs (e.g., "360p/video.m3u8"),
    // the auth params are inherited from the base path.
    const url = `https://${cdnHostname}/bcdn_token=${token}&expires=${expires}&token_path=${encodeURIComponent(tokenPath)}/${videoId}/playlist.m3u8`;

    return {
      url,
      expiresAt: new Date(expires * 1000).toISOString(),
    };
  },

  /**
   * Generate a direct (unsigned) HLS playback URL.
   * Use this only when token auth is disabled on the library.
   * 
   * @param {string} videoId - The Bunny video GUID
   * @returns {string} The HLS URL
   */
  getDirectUrl: (videoId) => {
    const { cdnHostname } = getConfig();
    return `https://${cdnHostname}/${videoId}/playlist.m3u8`;
  },

  /**
   * Generate a thumbnail URL for the video.
   * 
   * @param {string} videoId - The Bunny video GUID
   * @returns {string} The thumbnail URL
   */
  getThumbnailUrl: (videoId) => {
    const { cdnHostname } = getConfig();
    return `https://${cdnHostname}/${videoId}/thumbnail.jpg`;
  },
};
