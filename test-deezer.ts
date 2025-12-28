

const ARL = "7dbde1a746ddad5f2b4c9efa923601c23da965e7583a3cb24daeb5eb401eec5239f87b545e95fc4401bbaaaffc21406449489b92e86210192d9e7604c55301a04fee8820e5af30b28dec22bec7ac75e3ef4e821c95180a7f26570724b19fdaa3";
const DEEZER_GW_URL = "https://www.deezer.com/ajax/gw-light.php";

async function deezerRequest(method: string, arl: string, apiToken: string = 'null', body: any = {}) {
    const params = new URLSearchParams({
        method,
        api_version: "1.0",
        api_token: apiToken,
        input: "3"
    });

    console.log(`Calling ${method}... Token: ${apiToken}`);
    const response = await fetch(`${DEEZER_GW_URL}?${params.toString()}`, {
        method: "POST",
        headers: {
            "Cookie": `arl=${arl}`,
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    return data;
}

async function test() {
    try {
        // 1. Get User Data
        const userData: any = await deezerRequest("deezer.getUserData", ARL);
        console.log("User Data Result:", JSON.stringify(userData, null, 2));

        if (!userData.results.checkForm) {
            console.error("Failed to get checkForm (token)");
            return;
        }

        const token = userData.results.checkForm;
        const userId = userData.results.USER.USER_ID;

        // 2. Try Create Playlist
        console.log("Trying playlist.create...");
        const createResult: any = await deezerRequest("playlist.create", ARL, token, {
            title: "Test Playlist Soundiiz 1",
            description: "Test",
            user_id: userId,
            songs: []
        });
        console.log("Create Result:", JSON.stringify(createResult, null, 2));

    } catch (e) {
        console.error("Error:", e);
    }
}

test();
