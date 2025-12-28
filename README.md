# SonoSync (Open Source Soundiiz Alternative)

**SonoSync** is a modern, free, and open-source web application designed to help you transfer your music playlists between different streaming platforms. Built as an alternative to paid services like Soundiiz, SonoSync runs locally or on your own server, giving you full control over your data.

## 🚀 Features

*   **Playlist Transfer**: Move your favorite playlists seamlessly between supported platforms.
*   **Modern UI**: A sleek, responsive, and beautiful interface built with Next.js and Tailwind CSS.
*   **Advanced Matching**: Intelligent track matching algorithm (ISRC, Artist, Title fuzziness) to find the right songs on the destination platform.
*   **Privacy Focused**: Runs locally. Your credentials (ARL cookies, tokens) stay on your machine.
*   **Platform Support**:
    *   ✅ **Spotify** (Full support: Read/Write via official API & PKCE)
    *   ✅ **Deezer** (Full support: Read/Write via ARL Cookie workaround)
    *   ✅ **YouTube Music** (Full support: Read/Write via YouTube Data API v3)
    *   🚧 **Apple Music** (Coming Soon)

## 🛠️ Tech Stack

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Styling**: Tailwind CSS
*   **Auth**: [Auth.js (NextAuth v5)](https://authjs.dev/) + Client-side PKCE for Spotify
*   **State Management**: Zustand
*   **Language**: TypeScript

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/sonosync.git
    cd sonosync
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env.local` file in the root directory:
    ```env
    AUTH_SECRET="your-random-secret-key"
    NEXTAUTH_URL="http://127.0.0.1:3000"
    
    # Spotify (Create app at developer.spotify.com)
    SPOTIFY_CLIENT_ID="your_spotify_id"
    SPOTIFY_CLIENT_SECRET="your_spotify_secret"
    
    # Google/YouTube (Create app at console.cloud.google.com)
    GOOGLE_CLIENT_ID="your_google_id"
    GOOGLE_CLIENT_SECRET="your_google_secret"
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Open the app**
    Visit `http://127.0.0.1:3000` in your browser.

## 🔑 Platform Setup Guide

### Spotify
1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Set Redirect URI to `http://127.0.0.1:3000/callback` (for Client PKCE) and `http://127.0.0.1:3000/api/auth/callback/spotify` (for NextAuth).
3. Copy Client ID/Secret to `.env.local` or the in-app Setup Wizard.

### Deezer
1. Since Deezer's API is closed to new apps, we use the "ARL Cookie" method.
2. Log in to Deezer.com.
3. Open Developer Tools (F12) > Application > Cookies.
4. Copy the value of the `arl` cookie.
5. Paste it into the Deezer Setup Wizard in SonoSync.

### YouTube Music
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **YouTube Data API v3**.
3. Create OAuth Credentials (Web App).
4. Add Redirect URI: `http://127.0.0.1:3000/api/auth/callback/google`.
5. Add yourself to "Test Users" in the OAuth Consent Screen (or publish the app).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
