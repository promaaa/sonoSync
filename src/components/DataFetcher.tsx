"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMusicStore } from "@/store/useMusicStore";
import { fetchDeezerPlaylists } from "@/actions/deezer";
import { getUserPlaylists } from "@/actions/spotify";
import { getClientSpotifyPlaylists } from "@/lib/spotify-client";

export function DataFetcher() {
    const { data: session } = useSession();
    const { setSourcePlaylists, setSourcePlatform, spotifyToken, deezerArl } = useMusicStore();

    useEffect(() => {
        async function loadData() {
            // 1. Check for Client-Side Spotify Token (PKCE)
            if (spotifyToken) {
                setSourcePlatform('spotify');
                try {
                    const playlists = await getClientSpotifyPlaylists();
                    setSourcePlaylists(playlists);
                } catch (e) {
                    console.error("Failed to fetch Spotify playlists (client)", e);
                }
                return;
            }

            // 2. Check for Deezer ARL
            if (deezerArl) {
                setSourcePlatform('deezer');
                try {
                    const playlists = await fetchDeezerPlaylists(deezerArl);
                    setSourcePlaylists(playlists);
                } catch (e) {
                    console.error("Failed to fetch Deezer playlists", e);
                }
                return;
            }

            // 3. Check for Server-Side Session (Apple, Google, or old Spotify)
            if (session?.accessToken) {
                // If it's Spotify via NextAuth, we might still want to support it if it works?
                // But for now, we assume PKCE is the primary way for Spotify.
                // For other providers:
                if (session.provider === 'spotify') {
                    // NextAuth Spotify flow (keep as fallback)
                    setSourcePlatform('spotify');
                    try {
                        const playlists = await getUserPlaylists();
                        setSourcePlaylists(playlists);
                    } catch (e) {
                        console.error("Failed to fetch Spotify playlists (server)", e);
                    }
                } else {
                    // Logic for other providers would go here if implemented in similar fashion
                    // For now, only Spotify has this explicit loader in this project structure
                }
            }
        }

        if (spotifyToken || deezerArl || (session?.provider === 'spotify')) {
            loadData();
        }
    }, [session, spotifyToken, deezerArl, setSourcePlaylists, setSourcePlatform]);

    return null;
}
