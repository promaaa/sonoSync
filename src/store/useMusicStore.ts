import { create } from 'zustand';
import { Playlist, Track, Platform, UserProfile } from '@/lib/types';

interface TransferState {
    // Selection
    sourcePlatform: Platform | null;
    destinationPlatform: Platform | null;
    selectedPlaylist: Playlist | null;
    spotifyToken: string | null;
    deezerArl: string | null;

    // Data
    sourcePlaylists: Playlist[];
    sourceTracks: Track[];

    // Matching Staging
    matches: Array<{
        source: Track;
        destination?: Track; // undefined if not found
        matchType: 'isrc' | 'strict' | 'fuzzy' | 'none';
    }>;

    // Actions
    setSourcePlatform: (p: Platform) => void;
    setDestinationPlatform: (p: Platform) => void;
    setSourcePlaylists: (playlists: Playlist[]) => void;
    selectPlaylist: (playlist: Playlist) => void;
    setSpotifyToken: (token: string | null) => void;
    setDeezerArl: (arl: string | null) => void;
    setSourceTracks: (tracks: Track[]) => void;
    setMatches: (matches: TransferState['matches']) => void;

    reset: () => void;
}

export const useMusicStore = create<TransferState>((set) => ({
    sourcePlatform: null,
    destinationPlatform: null,
    selectedPlaylist: null,
    spotifyToken: null,
    deezerArl: null,
    sourcePlaylists: [],
    sourceTracks: [],
    matches: [],

    setSourcePlatform: (p) => set({ sourcePlatform: p }),
    setDestinationPlatform: (p) => set({ destinationPlatform: p }),
    setSourcePlaylists: (playlists) => set({ sourcePlaylists: playlists }),
    selectPlaylist: (playlist) => set({ selectedPlaylist: playlist }),
    setSpotifyToken: (token) => set({ spotifyToken: token }),
    setDeezerArl: (arl) => set({ deezerArl: arl }),
    setSourceTracks: (tracks) => set({ sourceTracks: tracks }),
    setMatches: (matches) => set({ matches }),

    reset: () => set({
        sourcePlatform: null,
        destinationPlatform: null,
        selectedPlaylist: null,
        spotifyToken: null,
        deezerArl: null,
        sourcePlaylists: [],
        sourceTracks: [],
        matches: []
    })
}));
