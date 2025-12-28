"use client";

import { useState } from "react";
import { useMusicStore } from "@/store/useMusicStore";
import { cn } from "@/lib/utils";
import { Platform } from "@/lib/types";
import { transferPlaylist } from "@/actions/transfer";

export function TransferFlow() {
    const {
        selectedPlaylist,
        sourcePlatform,
        destinationPlatform,
        setDestinationPlatform,
        spotifyToken,
        deezerArl
    } = useMusicStore();

    const [isTransferring, setIsTransferring] = useState(false);
    const [status, setStatus] = useState<"idle" | "matching" | "transferring" | "done">("idle");

    if (!selectedPlaylist) return null;

    const handleTransfer = async () => {
        if (!destinationPlatform || !selectedPlaylist) return;

        try {
            setStatus("matching");
            // We moved logic to server action, so "matching" and "transferring" happen in one go
            // But for UI feedback we can keep state or stream it. 
            // For now, simpler await.

            setStatus("transferring");
            // Pass spotifyToken if available (Client-Side Auth)
            const token = spotifyToken || undefined;
            const arl = deezerArl || undefined;
            const result = await transferPlaylist(selectedPlaylist.id, destinationPlatform, token, arl);

            setStatus("done");
            console.log("Transfer result:", result);
        } catch (e) {
            console.error(e);
            setStatus("idle");
            alert("Transfer failed: " + (e as Error).message);
        }
    };

    return (
        <div className="rounded-xl border border-white/10 bg-card p-6 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold">Transfer Playlist</h2>
                    <p className="text-sm text-muted-foreground">
                        Moving <span className="text-primary font-medium font-mono">{selectedPlaylist.name}</span> from {sourcePlatform}
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Destination Selection */}
                <div>
                    <label className="text-sm font-medium mb-3 block">Select Destination</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(['spotify', 'deezer', 'apple', 'youtube'] as Platform[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setDestinationPlatform(p)}
                                className={cn(
                                    "p-3 rounded-lg border text-sm font-medium capitalize transition-all",
                                    destinationPlatform === p
                                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                                        : "border-white/10 hover:bg-white/5"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Area */}
                <div className="pt-4 border-t border-white/5">
                    {status === 'idle' && (
                        <button
                            onClick={handleTransfer}
                            disabled={!destinationPlatform}
                            className="w-full py-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {destinationPlatform ? `Start Transfer to ${destinationPlatform}` : "Select a Destination"}
                        </button>
                    )}

                    {status === 'matching' && (
                        <div className="space-y-4 text-center py-4">
                            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-sm animate-pulse">Matching tracks...</p>
                        </div>
                    )}

                    {status === 'transferring' && (
                        <div className="space-y-4 text-center py-4">
                            <div className="h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-sm animate-pulse">Creating playlist on {destinationPlatform}...</p>
                        </div>
                    )}

                    {status === 'done' && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                            <p className="text-green-500 font-bold mb-2">Transfer Complete!</p>
                            <button onClick={() => setStatus('idle')} className="text-xs hover:underline">Dismiss</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
