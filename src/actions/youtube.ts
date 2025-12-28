"use server";

import { google } from "googleapis";
import { Playlist, Track } from "@/lib/types";
import { auth } from "@/lib/auth";

// Helper to get authenticated YouTube client
async function getYouTubeClient(accessToken?: string) {
    if (!accessToken) {
        throw new Error("No access token provided for YouTube");
    }

    const authClient = new google.auth.OAuth2();
    authClient.setCredentials({ access_token: accessToken });

    return google.youtube({ version: "v3", auth: authClient });
}

export async function getUserYouTubePlaylists(accessToken?: string): Promise<Playlist[]> {
    try {
        const youtube = await getYouTubeClient(accessToken);

        // Fetch playlists from "mine"
        const response = await youtube.playlists.list({
            part: ["snippet", "contentDetails", "status"],
            mine: true,
            maxResults: 50
        });

        const items = response.data.items || [];

        return items.map(item => ({
            id: item.id!,
            name: item.snippet?.title || "Untitled",
            description: item.snippet?.description || "",
            owner: item.snippet?.channelTitle || "Unknown",
            trackCount: item.contentDetails?.itemCount || 0,
            image: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || "",
            platform: 'youtube',
            externalUrl: `https://www.youtube.com/playlist?list=${item.id}`
        }));

    } catch (e) {
        console.error("Failed to fetch YouTube playlists", e);
        throw e;
    }
}

export async function createYouTubePlaylist(accessToken: string, name: string, description: string = ""): Promise<string> {
    try {
        const youtube = await getYouTubeClient(accessToken);

        const response = await youtube.playlists.insert({
            part: ["snippet", "status"],
            requestBody: {
                snippet: {
                    title: name,
                    description: description
                },
                status: {
                    privacyStatus: "private" // Default to private for safety
                }
            }
        });

        if (!response.data.id) {
            throw new Error("Failed to create YouTube playlist");
        }

        return response.data.id;
    } catch (e) {
        console.error("Failed to create YouTube playlist", e);
        throw e;
    }
}

export async function searchYouTubeTrack(accessToken: string, query: string): Promise<Track | null> {
    try {
        const youtube = await getYouTubeClient(accessToken);

        // Search for videos of type 'video' and category '10' (Music) could handle strict music filtering
        // But usually 'q' is enough.
        const response = await youtube.search.list({
            part: ["snippet"],
            q: query,
            type: ["video"],
            videoCategoryId: "10", // Music category
            maxResults: 1
        });

        const item = response.data.items?.[0];
        if (!item || !item.id?.videoId) return null;

        // Note: Search API doesn't return duration, so we'd technically need video.list to get exact duration
        // For matching purposes, we might skip duration matching or do a second call.
        // Let's do a second call to be precise, or just return an approximate track.
        // Actually, to display it nicely, let's fetch details.

        const videoDetails = await youtube.videos.list({
            part: ["contentDetails", "snippet"],
            id: [item.id.videoId]
        });

        const details = videoDetails.data.items?.[0];
        if (!details) return null;

        // Parse ISO 8601 duration (PT3M20S)
        const durationStr = details.contentDetails?.duration || "PT0S";
        // Simple parser or just use 0? Let's use 0 for now to be safe or simple regex.
        // Or cleaner: no duration.
        // TODO: Import a duration parser if needed or write simple one.

        return {
            id: item.id.videoId,
            title: details.snippet?.title || item.snippet?.title || "Unknown",
            artist: details.snippet?.channelTitle || "Unknown", // Channel is often the artist
            album: "YouTube",
            image: details.snippet?.thumbnails?.high?.url || "",
            duration: 0, // Placeholder
            uri: `youtube:video:${item.id.videoId}`
        };

    } catch (e) {
        console.error("Youtube Search Failed", e);
        return null;
    }
}

export async function addTracksToYouTubePlaylist(accessToken: string, playlistId: string, videoIds: string[]): Promise<void> {
    const youtube = await getYouTubeClient(accessToken);

    // YouTube API does not support batch insert for playlistItems.
    // We must do it one by one.
    // Rate limits might apply, so we should be careful or do it slowly.

    for (const videoId of videoIds) {
        try {
            await youtube.playlistItems.insert({
                part: ["snippet", "status"], // status resource includes privacyStatus? No, snippet.resourceId is key.
                requestBody: {
                    snippet: {
                        playlistId: playlistId,
                        resourceId: {
                            kind: "youtube#video",
                            videoId: videoId
                        }
                    }
                }
            });
            // Small delay to be nice to API?
            // await new Promise(r => setTimeout(r, 200)); 
        } catch (e) {
            console.error(`Failed to add video ${videoId} to playlist ${playlistId}`, e);
            // Continue with others
        }
    }
}
