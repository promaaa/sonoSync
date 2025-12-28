"use client";

import { useState } from "react";
import { updateProviderConfig } from "@/actions/config";
import { Icons } from "@/components/Icons";
import { cn } from "@/lib/utils";

interface SetupWizardProps {
    platform: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const INSTRUCTIONS: Record<string, { title: string, steps: string[], links: { label: string, url: string }[] }> = {
    spotify: {
        title: "Spotify Setup",
        steps: [
            "Log in to the Spotify Developer Dashboard.",
            "Click 'Create App' and give it a name.",
            "Select 'Web API' when asked which API/SDKs to use.",
            "In Settings, set Redirect URI to: http://127.0.0.1:3000/api/auth/callback/spotify",
            "IMPORTANT: Spotify no longer accepts 'localhost'. You MUST use 127.0.0.1.",
            "Copy the Client ID and Client Secret below.",
            "NOTE: Access this site via http://127.0.0.1:3000 for the login to work."
        ],
        links: [{ label: "Open Spotify Dashboard", url: "https://developer.spotify.com/dashboard" }]
    },
    deezer: {
        title: "Deezer Setup (Manual)",
        steps: [
            "Since Deezer closed their API to new apps, we use the 'ARL Cookie' method.",
            "Open Deezer.com in a new tab and log in.",
            "Open Developer Tools (F12) > Application > Cookies > www.deezer.com.",
            "Find the cookie named 'arl' and copy its value (it's a long string).",
            "Paste the 'arl' value below."
        ],
        links: [{ label: "Open Deezer", url: "https://www.deezer.com" }]
    },
    youtube: {
        title: "YouTube Music Setup",
        steps: [
            "Go to Google Cloud Console > APIs & Services > Credentials.",
            "Create Credentials > OAuth Client ID (Web Application).",
            "Add Redirect URI: http://127.0.0.1:3000/api/auth/callback/google",
            "Copy Client ID and Client Secret.",
            "IMPORTANT: Go to OAuth Consent Screen > Test Users and ADD YOUR EMAIL.",
            "OR click 'Publish App' to bypass the 'Access Blocked' error."
        ],
        links: [
            { label: "Open Google Credentials", url: "https://console.cloud.google.com/apis/credentials" },
            { label: "Enable YouTube API", url: "https://console.cloud.google.com/apis/library/youtube.googleapis.com" }
        ]
    },
    apple: {
        title: "Apple Music Setup",
        steps: [
            "Requires Apple Developer Account ($99/yr).",
            "Go to Identifiers, create a Media ID, and enable MusicKit.",
            "Go to Keys, create a Key with MusicKit access.",
            "This feature requires a paid account to generate valid secrets."
        ],
        links: [
            { label: "Manage Identifiers", url: "https://developer.apple.com/account/resources/identifiers/list" },
            { label: "Manage Keys", url: "https://developer.apple.com/account/resources/authkeys/list" }
        ]
    }
};

export function SetupWizard({ platform, isOpen, onClose, onSuccess }: SetupWizardProps) {
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    // Deezer specific
    const [arl, setArl] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Import store to save ARL
    const { setDeezerArl } = require("@/store/useMusicStore").useMusicStore();

    if (!isOpen) return null;

    const config = INSTRUCTIONS[platform] || INSTRUCTIONS.spotify;
    const Icon = Icons[platform as keyof typeof Icons] || Icons.google;

    const handleSave = async () => {
        setLoading(true);
        setError("");

        if (platform === 'deezer') {
            // Save ARL to store/localstorage
            if (!arl) {
                setError("ARL is required");
                setLoading(false);
                return;
            }
            setDeezerArl(arl);
            localStorage.setItem('deezer_arl', arl);
            onSuccess();
            onClose();
            setLoading(false);
            return;
        }

        const res = await updateProviderConfig(platform, clientId, clientSecret);

        if (res.success) {
            onSuccess();
            onClose();
            // Force reload or just alert
            alert("Configuration saved! You may need to RESTART the server terminal (Ctrl+C then npm run dev) for changes to take effect.");
        } else {
            setError(res.error || "Failed to save");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-white/10 bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{config.title}</h2>
                        <p className="text-sm text-muted-foreground">Configure access</p>
                    </div>
                </div>

                <div className="space-y-4 mb-6 text-sm text-muted-foreground bg-secondary/20 p-4 rounded-lg">
                    <ol className="list-decimal list-inside space-y-1">
                        {config.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                        ))}
                    </ol>
                    <div className="pt-2">
                        {config.links.map(link => (
                            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                                {link.label} &rarr;
                            </a>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {platform === 'deezer' ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">ARL Cookie</label>
                            <input
                                type="text"
                                value={arl}
                                onChange={e => setArl(e.target.value)}
                                className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Paste ARL here..."
                            />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Client ID</label>
                                <input
                                    type="text"
                                    value={clientId}
                                    onChange={e => setClientId(e.target.value)}
                                    className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Paste Client ID here"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Client Secret</label>
                                <input
                                    type="password"
                                    value={clientSecret}
                                    onChange={e => setClientSecret(e.target.value)}
                                    className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Paste Client Secret here"
                                />
                            </div>
                        </>
                    )}
                </div>

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium hover:bg-white/5 rounded-md transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || (platform === 'deezer' ? !arl : (!clientId || !clientSecret))}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
