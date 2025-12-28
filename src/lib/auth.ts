import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import GoogleProvider from "next-auth/providers/google";

// Define scopes
const spotifyScopes = [
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
].join(" ");

const DeezerProvider = {
    id: "deezer",
    name: "Deezer",
    type: "oauth" as const,
    authorization: "https://connect.deezer.com/oauth/auth.php?perms=basic_access,email,manage_library,delete_library,listening_history",
    token: "https://connect.deezer.com/oauth/access_token.php",
    userinfo: "https://api.deezer.com/user/me",
    clientId: process.env.DEEZER_CLIENT_ID || "",
    clientSecret: process.env.DEEZER_CLIENT_SECRET || "",
    profile(profile: any) {
        return {
            id: String(profile.id),
            name: profile.name,
            email: profile.email,
            image: profile.picture,
        }
    },
};

const AppleProvider = {
    id: "apple",
    name: "Apple",
    type: "oauth" as const,
    issuer: "https://appleid.apple.com",
    authorization: {
        params: {
            scope: "name email",
            response_mode: "form_post",
            response_type: "code id_token",
        },
    },
    client: {
        token_endpoint_auth_method: "client_secret_post",
    },
    clientId: process.env.APPLE_ID || "",
    clientSecret: process.env.APPLE_SECRET || "",
    profile(profile: any) {
        return {
            id: profile.sub,
            name: profile.name?.firstName ? `${profile.name.firstName} ${profile.name.lastName}` : profile.email,
            email: profile.email,
            image: null,
        }
    }
};

export const { handlers, auth, signIn, signOut } = NextAuth({
    basePath: "/api/auth",
    providers: [
        SpotifyProvider({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            authorization: {
                params: { scope: spotifyScopes },
            },
        }),
        DeezerProvider,
        AppleProvider,
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/youtube",
                    access_type: "offline",
                    prompt: "consent"
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at;
                token.provider = account.provider;
            }
            return token;
        },
        async session({ session, token }: any) {
            session.accessToken = token.accessToken;
            session.provider = token.provider;
            return session;
        },
    },
    debug: true,
    trustHost: true,
    secret: process.env.AUTH_SECRET,
});
