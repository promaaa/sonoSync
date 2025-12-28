"use server";

import { auth } from "@/lib/auth";
import { SpotifyProvider } from "@/lib/providers/SpotifyProvider";
import { matchTracks } from "@/lib/matcher";
import { Playlist, Platform } from "@/lib/types";

import { createDeezerPlaylist, searchDeezerTrack, addTracksToDeezerPlaylist } from "./deezer";
import { createYouTubePlaylist, searchYouTubeTrack, addTracksToYouTubePlaylist } from "./youtube";

export async function transferPlaylist(
    sourcePlaylistId: string,
    destinationPlatform: Platform,
    accessToken?: string,
    deezerArl?: string
) {
    const session = await auth();
    // Prioritize passed token (Client PKCE), then Session Token (NextAuth)
    const token = accessToken || session?.accessToken;

    if (!token && !deezerArl) {
        throw new Error("Not authenticated");
    }

    // Source Provider (Assuming Spotify for now as Source based on token presence)
    if (!token) throw new Error("Source Spotify token missing");
    const sourceProvider = new SpotifyProvider(token as string);

    // 1. Get Source Tracks
    const tracks = await sourceProvider.getPlaylistTracks(sourcePlaylistId);
    const sourcePlaylist = (await sourceProvider.getUserPlaylists()).find(p => p.id === sourcePlaylistId);
    const playlistName = sourcePlaylist?.name || "Transferred Playlist";

    // 2. Destination Logic
    if (destinationPlatform === 'deezer') {
        if (!deezerArl) throw new Error("Deezer ARL missing for destination");

        // Match Tracks on Deezer
        // We need an ad-hoc provider-like object or just use the matcher with a custom search fn
        // The matcher expects a MusicProvider interface. 
        // Let's manually match for now or create a mini-adapter.

        const matchedIds: string[] = [];
        for (const track of tracks) {
            // Try to search
            // 1. Try ISRC
            // 2. Try Title + Artist
            let found = null;
            if (track.isrc) {
                found = await searchDeezerTrack(deezerArl, `isrc:${track.isrc}`);
            }
            if (!found) {
                found = await searchDeezerTrack(deezerArl, `artist:"${track.artist}" track:"${track.title}"`);
            }

            if (found) {
                matchedIds.push(found.id);
            }
        }

        // Create Playlist
        const newId = await createDeezerPlaylist(deezerArl, `${playlistName} (Transfer)`, "Transferred via SonoSync");

        // Add Tracks
        if (matchedIds.length > 0) {
            // Add in batches of 50 just in case
            const chunkSize = 50;
            for (let i = 0; i < matchedIds.length; i += chunkSize) {
                const chunk = matchedIds.slice(i, i + chunkSize);
                await addTracksToDeezerPlaylist(deezerArl, newId, chunk);
            }
        }

        return { success: true, newPlaylistId: newId, matchCount: matchedIds.length, total: tracks.length };

    } else if (destinationPlatform === 'youtube') {
        // For YouTube, we rely on the Server Session (NextAuth) having the Google access token
        // Ensure the session is actually for Google? Or check if session token works for youtube?
        // Right now our auth logic puts 'access_token' in session.accessToken.
        // If the user logged in with Spotify, this token is Spotify's.
        // If they logged in with Google, it matches.
        // MULTI-PROVIDER ISSUE: We need to handle having BOTH tokens.
        // Currently architecture assumes one 'session'.
        // If source is Spotify (PKCE), we have 'token'. 
        // If destination is Google, we need Google Token.
        // We probably need to check `session.provider === 'google'` to get the google token.

        let youtubeToken = "";
        if (session?.provider === 'google' || session?.provider === 'youtube') {
            youtubeToken = session.accessToken as string;
        }

        if (!youtubeToken) {
            throw new Error("Not authenticated with YouTube/Google. Please sign in with Google.");
        }

        const matchedIds: string[] = [];
        for (const track of tracks) {
            // Search YouTube for "Artist - Title"
            const query = `${track.artist} - ${track.title}`;
            const found = await searchYouTubeTrack(youtubeToken, query);

            if (found) {
                matchedIds.push(found.id);
            }
        }

        const newId = await createYouTubePlaylist(youtubeToken, `${playlistName} (Transfer)`, "Transferred via SonoSync");

        if (matchedIds.length > 0) {
            await addTracksToYouTubePlaylist(youtubeToken, newId, matchedIds);
        }

        return { success: true, newPlaylistId: newId, matchCount: matchedIds.length, total: tracks.length };

    } else if (destinationPlatform === 'spotify') {
        const destProvider = new SpotifyProvider(token as string); // Same account for now? Or different?
        // If we want to support transferring TO the same spotify account (cloning), this works.
        // If we want to transfer TO a different spotify account, we'd need a separate destination token.
        // For now, assume same.

        const matches = await matchTracks(tracks, destProvider);
        const idsToAdd = matches.filter(m => m.destination).map(m => m.destination!.id);

        const newPlaylistId = await destProvider.createPlaylist(
            `${playlistName} (Transfer)`,
            `Transferred from Spotify via SonoSync.`
        );

        if (idsToAdd.length > 0) {
            await destProvider.addTracksToPlaylist(newPlaylistId, idsToAdd);
        }

        return { success: true, newPlaylistId, matchCount: idsToAdd.length, total: tracks.length };
    } else {
        throw new Error(`Provider ${destinationPlatform} not implemented yet.`);
    }
}
