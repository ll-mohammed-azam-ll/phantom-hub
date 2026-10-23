// youtube.js

import {
    ref,
    get,
    set
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// -----------------------------------------------------------------------------
// Constants & Configuration
// -----------------------------------------------------------------------------

const YOUTUBE_API_KEY = "AIzaSyCMSSgAvEMvG_0pPFNAsbtWGlI3dRSaHKg";
const CACHE_DAYS = 30;

// -----------------------------------------------------------------------------
// Global State
// -----------------------------------------------------------------------------

const MEMORY_CACHE = {};
const VIDEO_DATA = {};
let CURRENT_RESULTS = [];
let CURRENT_PANEL = "panel-home";
const FEED_CACHE = {};

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function getDB() {
    return window.rtdb;
}

function isExpired(timestamp) {
    const age = Date.now() - timestamp;
    const limit = CACHE_DAYS * 24 * 60 * 60 * 1000;
    return age > limit;
}

function decodeHTML(str) {
    if (!str) return "";
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
}

function openPanel(id) {
    CURRENT_PANEL = id;

    // Switch panels
    document.querySelectorAll(".app-panel").forEach(panel => {
        panel.classList.remove("active");
    });
    document.getElementById(id)?.classList.add("active");

    // UI elements to toggle when entering video view vs home view
    const categoryNav = document.getElementById("categoryNav");
    const vipBadge = document.getElementById("vipBadge");
    const userProfile = document.getElementById("userProfile");
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");

    if (id === "panel-video") {
        // Hide top category scroll bar and VIP profile items
        if (categoryNav) categoryNav.classList.add("hidden");
        if (vipBadge) vipBadge.classList.add("hidden");
        if (userProfile) userProfile.classList.add("hidden");

        // Swap 3-line menu icon to back button
        if (menuIcon) menuIcon.classList.add("hidden");
        if (backIcon) backIcon.classList.remove("hidden");
    } else {
        // Restore elements for Home view
        if (categoryNav) categoryNav.classList.remove("hidden");
        if (vipBadge) vipBadge.classList.remove("hidden");
        if (userProfile) userProfile.classList.remove("hidden");

        // Restore menu icon
        if (menuIcon) menuIcon.classList.remove("hidden");
        if (backIcon) backIcon.classList.add("hidden");
    }
}

window.handleNavToggle = function() {
    if (CURRENT_PANEL === "panel-video") {
        window.goHome();
    } else if (typeof window.openSidebar === "function") {
        window.openSidebar();
    }
};

// -----------------------------------------------------------------------------
// API & Cache Services
// -----------------------------------------------------------------------------

async function searchYoutube(query) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=25&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("YouTube API Error: " + response.status);
    }

    const data = await response.json();

    if (data.error) {
        console.error("YouTube API Error Details:", data.error);
        return [];
    }

    return data.items || [];
}

async function getCachedResults(query) {
    if (MEMORY_CACHE[query]) {
        return MEMORY_CACHE[query];
    }

    const snap = await get(ref(getDB(), "youtube_cache/" + query));

    if (!snap.exists()) {
        return null;
    }

    const data = snap.val();
    MEMORY_CACHE[query] = data;

    return data;
}

async function saveCache(query, videos) {
    await set(ref(getDB(), "youtube_cache/" + query), {
        updatedAt: Date.now(),
        results: videos
    });
}

async function refreshCache(query) {
    try {
        const videos = await searchYoutube(query);
        await saveCache(query, videos);
    } catch (err) {
        console.error("Failed to refresh cache:", err);
    }
}

// -----------------------------------------------------------------------------
// Core Controller Functions
// -----------------------------------------------------------------------------

export async function searchVideos(query) {
    query = query.trim().toLowerCase();
    if (!query) return;

    const cached = await getCachedResults(query);

    if (cached) {
        CURRENT_RESULTS = cached.results || [];
        renderYoutubeVideos(CURRENT_RESULTS);

        if (isExpired(cached.updatedAt)) {
            refreshCache(query);
        }
        return;
    }

    const videos = await searchYoutube(query);
    await saveCache(query, videos);

    CURRENT_RESULTS = videos;
    renderYoutubeVideos(videos);
}

function loadRelatedVideos(currentVideoId) {
    const related = CURRENT_RESULTS.filter(
        v => v.id?.videoId !== currentVideoId
    );

    renderRelatedVideos(related);
}

// -----------------------------------------------------------------------------
// UI Renderers
// -----------------------------------------------------------------------------

function renderYoutubeVideos(videos) {
    const grid = document.getElementById("homeVideoGrid");
    if (!grid) return;

    grid.innerHTML = "";

    videos.forEach(video => {
        const snippet = video.snippet;
        const videoId = video.id?.videoId;

        if (!videoId) return;

        VIDEO_DATA[videoId] = {
            title: decodeHTML(snippet.title),
            channel: decodeHTML(snippet.channelTitle)
        };

        grid.innerHTML += `
<article
    class="video-card"
    onclick="window.openYoutubeVideo('${videoId}')">

    <div class="thumbnail-wrapper">
        <img
            class="thumbnail"
            src="${snippet.thumbnails.high.url}">
    </div>

    <div class="card-details">
        <img
            class="avatar"
            src="${snippet.thumbnails.default.url}">

        <div class="info">
            <h3 class="video-title">
                ${snippet.title}
            </h3>
            <p class="channel-name">
                ${snippet.channelTitle}
            </p>
        </div>
    </div>
</article>
`;
    });
}

function renderRelatedVideos(videos) {
    const container = document.getElementById("relatedVideos");
    if (!container) return;

    container.innerHTML = "";

    videos.forEach(video => {
        const s = video.snippet;
        const id = video.id?.videoId;

        if (!id) return;

        VIDEO_DATA[id] = {
            title: decodeHTML(s.title),
            channel: decodeHTML(s.channelTitle)
        };

        container.innerHTML += `
<article
    class="video-card"
    onclick="window.openYoutubeVideo('${id}')">

    <div class="thumbnail-wrapper">
        <img
            class="thumbnail"
            src="${s.thumbnails.high.url}">
    </div>

    <div class="card-details">
        <div class="info">
            <h3 class="video-title">
                ${s.title}
            </h3>
            <p class="channel-name">
                ${s.channelTitle}
            </p>
        </div>
    </div>
</article>
`;
    });
}

// -----------------------------------------------------------------------------
// Global Window Event Handlers
// -----------------------------------------------------------------------------

window.openYoutubeVideo = async function(videoId) {
    const data = VIDEO_DATA[videoId];
    if (!data) return;

    openPanel("panel-video");

    const player = document.getElementById("ytPlayer");
    if (player) {
        player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }

    const titleEl = document.getElementById("videoTitle");
    if (titleEl) {
        titleEl.textContent = data.title;
    }

    const channelEl = document.getElementById("videoChannel");
    if (channelEl) {
        channelEl.textContent = data.channel;
    }

    loadRelatedVideos(videoId);
};

window.triggerSearch = async function() {
    const input = document.getElementById("searchInput");
    if (!input) return;

    const query = input.value.trim();
    if (!query) return;

    // Direct user to home feed to see search results if searching from video panel
    if (CURRENT_PANEL !== "panel-home") {
        openPanel("panel-home");
    }

    await searchVideos(query);
};

window.handleSearch = async function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        await window.triggerSearch();
    }
};

window.goHome = function() {
    const player = document.getElementById("ytPlayer");
    if (player) {
        player.src = "";
    }

    openPanel("panel-home");
};











async function loadDefaultFeed() {

    const topics = [
        "technology",
        "tesla",
        "artificial intelligence",
        "space",
        "science"
    ];

    let feed = [];

    for (const topic of topics) {

        let data =
            await getFeedTopic(
                topic
            );

        if (!data) {

            const videos =
                await refreshFeedTopic(
                    topic
                );

            feed.push(
                ...videos.slice(0, 5)
            );

            continue;
        }

        feed.push(
            ...(data.results || [])
            .slice(0, 5)
        );

        if (
            isExpired(
                data.updatedAt
            )
        ) {

            refreshFeedTopic(
                topic
            );

        }

    }

    CURRENT_RESULTS = feed;

    renderYoutubeVideos(
        feed
    );

}



window.addEventListener(
    "load",
    async () => {

        await loadDefaultFeed();

    }
);


async function getFeedTopic(topic) {

    if (FEED_CACHE[topic]) {

        return FEED_CACHE[topic];

    }

    const snap =
        await get(
            ref(
                getDB(),
                "youtube_feed/" + topic
            )
        );

    if (!snap.exists()) {

        return null;

    }

    const data =
        snap.val();

    FEED_CACHE[topic] =
        data;

    return data;

}


async function saveFeedTopic(
    topic,
    videos
) {

    await set(
        ref(
            getDB(),
            "youtube_feed/" + topic
        ),
        {
            updatedAt:
                Date.now(),

            results:
                videos
        }
    );

}


async function refreshFeedTopic(
    topic
) {

    try {

        const videos =
            await searchYoutube(
                topic
            );

        await saveFeedTopic(
            topic,
            videos
        );

        return videos;

    } catch (err) {

        console.error(err);

        return [];

    }

}


window.loadEntertainmentFeed =
async function() {

    if (
        CURRENT_RESULTS.length > 0
    ) {

        renderYoutubeVideos(
            CURRENT_RESULTS
        );

        return;
    }

    await loadDefaultFeed();

}