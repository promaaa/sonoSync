"use server";

import { Playlist, Track } from "@/lib/types";

const DEEZER_GW_URL = "https://www.deezer.com/ajax/gw-light.php";

interface DeezerResponse<T> {
    error: any[];
    results: T;
}

// Helper to make requests to Deezer internal API
async function deezerRequest<T>(
    method: string,
    arl: string,
    apiToken: string = 'null',
    body: any = {}
): Promise<T> {
    const params = new URLSearchParams({
        method,
        api_version: "1.0",
        api_token: apiToken,
        input: "3"
    });

    const response = await fetch(`${DEEZER_GW_URL}?${params.toString()}`, {
        method: "POST",
        headers: {
            "Cookie": `arl=${arl}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`Deezer API error: ${response.statusText}`);
    }

    const data = await response.json() as DeezerResponse<T>;

    if (data.error && data.error.length > 0) {
        // sometimes error is empty array []
        if (Object.keys(data.error).length > 0) {
            throw new Error(`Deezer Internal API Error: ${JSON.stringify(data.error)}`);
        }
    }

    return data.results;
}

// Get User Data (ID and CSRF Token)
async function getDeezerUserData(arl: string) {
    // Initial call to get checkForm (token) and user ID
    const results = await deezerRequest<{ checkForm: string; USER: { USER_ID: string; BLOG_NAME: string } }>(
        "deezer.getUserData",
        arl,
        "null"
    );

    if (!results.USER || !results.checkForm) {
        throw new Error("Invalid ARL or failed to fetch user data");
    }

    return {
        userId: results.USER.USER_ID,
        userName: results.USER.BLOG_NAME,
        token: results.checkForm
    };
}

// Create a new playlist
export async function createDeezerPlaylist(arl: string, name: string, description: string = ""): Promise<string> {
    try {
        const { userId, token } = await getDeezerUserData(arl);

        const result = await deezerRequest<any>(
            "playlist.create",
            arl,
            token,
            { title: name, description: description, user_id: userId }
        );

        console.log("Deezer Create Playlist Result:", result);

        if (!result || !result.PLAYLIST_ID) {
            throw new Error(`Failed to create playlist. Deezer response: ${JSON.stringify(result)}`);
        }

        return String(result.PLAYLIST_ID);
    } catch (e) {
        console.error("Failed to create Deezer playlist", e);
        throw e;
    }
}

// Search for a track
export async function searchDeezerTrack(arl: string, query: string): Promise<Track | null> {
    try {
        const { token } = await getDeezerUserData(arl);
        // Using deezer.pageSearch
        const result = await deezerRequest<any>(
            "deezer.pageSearch",
            arl,
            token,
            { query: query, types: ["TRACK"] }
        );

        const trackData = result?.TRACK?.data?.[0];

        if (!trackData) return null;

        return {
            id: String(trackData.SNG_ID),
            title: trackData.SNG_TITLE,
            artist: trackData.ART_NAME,
            album: trackData.ALB_TITLE,
            image: `https://e-cdns-images.dzcdn.net/images/cover/${trackData.ALB_PICTURE}/500x500-000000-80-0-0.jpg`,
            duration: parseInt(trackData.DURATION),
            uri: `deezer:track:${trackData.SNG_ID}`,
            isrc: trackData.ISRC
        };
    } catch (e) {
        console.error("Failed to search Deezer track", e);
        return null; // Return null on failure to not break the batch
    }
}

// Add tracks to a playlist
export async function addTracksToDeezerPlaylist(arl: string, playlistId: string, trackIds: string[]): Promise<void> {
    try {
        const { token } = await getDeezerUserData(arl);

        // API expects nested array of arrays [[song_id, 0]]
        const songs = trackIds.map(id => [id, 0]);

        await deezerRequest<any>(
            "playlist.addSongs",
            arl,
            token,
            { playlist_id: playlistId, songs: songs }
        );

    } catch (e) {
        console.error("Failed to add tracks to Deezer playlist", e);
        throw e;
    }
}

export async function fetchDeezerPlaylists(arl: string): Promise<Playlist[]> {
    try {
        const { userId, userName, token } = await getDeezerUserData(arl);

        const profileData = await deezerRequest<any>(
            "deezer.pageProfile",
            arl,
            token,
            { tab: "playlists", user_id: userId }
        );

        const playlistsData = profileData?.TAB?.playlists?.data || [];

        return playlistsData.map((p: any) => ({
            id: String(p.PLAYLIST_ID),
            name: p.TITLE,
            description: p.DESCRIPTION || "",
            owner: p.PARENT_USERNAME || userName,
            trackCount: p.NB_SONG,
            image: `https://e-cdns-images.dzcdn.net/images/cover/${p.PICTURE_TYPE}/${p.PICTURE_MD5}/500x500-000000-80-0-0.jpg`,
            platform: 'deezer',
            externalUrl: `https://www.deezer.com/playlist/${p.PLAYLIST_ID}`
        }));

    } catch (e) {
        console.error("Failed to fetch Deezer playlists", e);
        throw e;
    }
}
