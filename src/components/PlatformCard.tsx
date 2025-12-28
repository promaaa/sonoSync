"use client";

import { Platform } from "@/lib/types";
import { useSession, signIn, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Icons } from "@/components/Icons";
import { useMusicStore } from "@/store/useMusicStore";
import { loadAccessToken, initiateSpotifyAuth, logoutSpotify } from "@/lib/spotify-pkce";

import { getProviderStatus } from "@/actions/config";
import { SetupWizard } from "@/components/SetupWizard";

interface PlatformCardProps {
    platform: Platform;
    name: string;
    color?: string; // Optional now
}

export function PlatformCard({ platform, name, color }: PlatformCardProps) {
    const { data: session } = useSession();
    const { spotifyToken, setSpotifyToken, deezerArl, setDeezerArl } = useMusicStore();
    const [loading, setLoading] = useState(false);
    const [showSetup, setShowSetup] = useState(false);
    const [isConfigured, setIsConfigured] = useState(false);
    const [checkingConfig, setCheckingConfig] = useState(true);

    // Sync Spotify Token on mount
    useEffect(() => {
        if (platform === 'spotify') {
            const token = loadAccessToken();
            if (token && token !== spotifyToken) {
                setSpotifyToken(token);
            }
        }
        if (platform === 'deezer') {
            const arl = localStorage.getItem('deezer_arl');
            if (arl && arl !== deezerArl) {
                setDeezerArl(arl);
            }
        }
    }, [platform, setSpotifyToken, spotifyToken, setDeezerArl, deezerArl]);

    // Check next-auth session provider or custom spotify/deezer token
    const isConnected = (platform === 'spotify' && !!spotifyToken) ||
        (platform === 'deezer' && !!deezerArl) ||
        (session?.provider === platform || (platform === 'youtube' && session?.provider === 'google'));

    // Map platform to icon key
    const Icon = Icons[platform as keyof typeof Icons] || Icons.google;

    // Check configuration status on mount
    useEffect(() => {
        if (platform === 'deezer') {
            // Deezer is always "Ready" to be configured via ARL (manual)
            // But we can check if it's already connected
            setIsConfigured(!!localStorage.getItem('deezer_arl'));
            setCheckingConfig(false);
            return;
        }

        getProviderStatus().then(status => {
            // Map platform to status key
            const key = platform === 'youtube' ? 'youtube' : platform;
            setIsConfigured(status[key as keyof typeof status]);
            setCheckingConfig(false);
        });
    }, [platform]);

    const handleAction = async () => {
        // For Spotify and Deezer, we use custom flows
        if (platform === 'spotify') {

            // Spotify requires 127.0.0.1 for redirect URI, so we must be on that domain
            // to share localStorage (verifier).
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                // Redirect to 127.0.0.1 (keeping port and path) and let them click again
                const url = new URL(window.location.href);
                url.hostname = '127.0.0.1';
                window.location.href = url.toString();
                return;
            }

            try {
                if (isConnected) {
                    logoutSpotify();
                    setSpotifyToken(null);
                } else {
                    await initiateSpotifyAuth();
                }
            } catch (e) {
                console.error("Spotify Auth Action Failed", e);
                // In case of error (like popup blocked or network), make sure we reset state if needed
            }
            return;
        }

        if (platform === 'deezer') {
            if (isConnected) {
                setDeezerArl(null);
                localStorage.removeItem('deezer_arl');
                setIsConfigured(false);
            } else {
                setShowSetup(true);
            }
            return;
        }

        if (!isConfigured && !isConnected) {
            setShowSetup(true);
            return;
        }

        try {
            setLoading(true);
            if (isConnected) {
                await signOut();
            } else {
                const providerId = platform === 'youtube' ? 'google' : platform;
                await signIn(providerId);
            }
        } catch (e) {
            console.error("Auth action failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSetupSuccess = () => {
        setIsConfigured(true);
    };

    return (
        <div className={cn(
            "group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-md",
            isConnected && "border-primary/50 bg-primary/5"
        )}>
            <SetupWizard
                platform={platform}
                isOpen={showSetup}
                onClose={() => setShowSetup(false)}
                onSuccess={handleSetupSuccess}
            />

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-foreground/70 transition-colors group-hover:text-primary",
                        isConnected && "text-primary bg-primary/10"
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isConnected ? "bg-primary shadow-[0_0_8px_currentColor]" : "bg-muted-foreground/30"
                    )} />
                </div>

                <div>
                    <h3 className="font-semibold text-base mb-1">{name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                        {isConnected ? "Synced" : (isConfigured ? "Ready" : "No Config")}
                    </p>
                </div>

                <button
                    onClick={handleAction}
                    disabled={loading || (checkingConfig && platform !== 'spotify')}
                    className={cn(
                        "w-full rounded px-3 py-1.5 text-xs font-medium transition-all border",
                        isConnected
                            ? "border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                            : "border-primary/20 text-foreground hover:bg-primary/10 hover:border-primary/50",
                        (loading || (checkingConfig && platform !== 'spotify')) && "opacity-50 cursor-wait"
                    )}
                >
                    {loading ? "..." : (isConnected ? "Disconnect" : (isConfigured ? "Connect" : "Setup"))}
                </button>
            </div>
        </div>
    );
}
