

import {
    searchVideos
}
from "./youtube.js";


/* ===== PANEL STATE MANAGEMENT ===== */
let panelOpen = false;

// Mock templates for dynamic HTML injection demo
// Layouts, headers, action buttons, and padded content are now fully controlled in JS!
const panelTemplates = {
  YouTube: `
    <div class="stream-container" id="auraApp">
  <!-- Top Header (Fixed) -->
  <header class="stream-header">
    <div class="header-left">
      <!-- Converts dynamically between Menu and Back icon via JS -->
      <button class="icon-btn mobile-toggle" id="navToggleBtn" aria-label="Navigation" onclick="window.handleNavToggle()">
        <svg id="menuIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg id="backIcon" class="hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
    </div>
    
    <!-- Unified Search Bar -->
    <div class="search-bar">
      <input type="text" id="searchInput" placeholder="Search..." onkeydown="window.handleSearch(event)" />
      <button class="search-btn" aria-label="Search" onclick="window.triggerSearch()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </button>
    </div>

    <div class="header-right">
      
      <div class="user-profile" id="userProfile" onclick="window.navigateTo('profile')">
        <img src="https://i.pravatar.cc/100?img=33" alt="Profile" />
      </div>
    </div>
  </header>

  <!-- Horizontal Category Filters (Only Active on Home Panel) -->
  <nav class="category-scroll" id="categoryNav">
    <button class="tag active" onclick="window.filterCategory(this, 'all')">All Content</button>
    <button class="tag" onclick="window.filterCategory(this, 'live')">Live Premieres</button>
    <button class="tag" onclick="window.filterCategory(this, '4k')">4K Ultra HD</button>
    <button class="tag" onclick="window.filterCategory(this, 'series')">Cinematic Series</button>
    <button class="tag" onclick="window.filterCategory(this, 'masterclasses')">Masterclasses</button>
  </nav>

  <!-- Stack Router Container -->
  <div class="panel-viewport">
    
    <!-- 1. HOME PANEL -->
    <section class="app-panel active" id="panel-home">
      <main class="video-grid" id="homeVideoGrid">
        <article class="video-card" data-category="live" onclick="window.openVideoDetail('World Premiere: Deep Space')">
          <div class="thumbnail-wrapper">
            <img src="https://picsum.photos/600/340?random=10" alt="Thumbnail" class="thumbnail" />
            <span class="badge live-badge">● LIVE</span>
          </div>
          <div class="card-details">
            <img src="https://i.pravatar.cc/100?img=11" alt="Avatar" class="avatar" />
            <div class="info">
              <h3 class="video-title">World Premiere: The Future of Deep Space Exploration</h3>
              <p class="channel-name">Apex Cinema <span class="gold-check">✓</span></p>
              <p class="meta-data"><span class="gold-text">45.2K watching</span> • Live</p>
            </div>
          </div>
        </article>

        <article class="video-card" data-category="4k" onclick="window.openVideoDetail('Hypercar Design Process')">
          <div class="thumbnail-wrapper">
            <img src="https://picsum.photos/600/340?random=11" alt="Thumbnail" class="thumbnail" />
            <span class="badge duration-badge">4K | 18:42</span>
          </div>
          <div class="card-details">
            <img src="https://i.pravatar.cc/100?img=60" alt="Avatar" class="avatar" />
            <div class="info">
              <h3 class="video-title">Hypercar Design Process: Crafting Absolute Luxury</h3>
              <p class="channel-name">Veloci Studios <span class="gold-check">✓</span></p>
              <p class="meta-data">340K views • 2 days ago</p>
            </div>
          </div>
        </article>
      </main>
    </section>
    
    <!-- 2. VIDEO DETAIL PANEL -->
    <section class="app-panel" id="panel-video">
      <div class="video-sticky-wrapper">
        <div class="video-player-container">
          <iframe id="ytPlayer" allowfullscreen frameborder="0"></iframe>
        </div>
        <div class="video-info">
          <h2 id="videoTitle"></h2>
          <p id="videoChannel"></p>
        </div>
      </div>

      <!-- Related videos scroll underneath the sticky player -->
      <div class="related-scroll-section">
        <h4 class="related-heading">Recommended Videos</h4>
        <div id="relatedVideos" class="video-grid"></div>
      </div>
    </section>

  </div>
</div>

<style>
  :root {
    --card-bg: rgba(18, 18, 24, 0.55);
    --card-bg-hover: rgba(28, 28, 38, 0.75);
    --gold-primary: #d4af37;
    --gold-light: #fbeea1;
    --gold-glow: rgba(212, 175, 55, 0.25);
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-border-gold: rgba(212, 175, 55, 0.4);
    --glass-blur: blur(28px);
    --radius-xl: 28px;
    --radius-lg: 20px;
    --text-muted: #9a9ab0;
  }

  .stream-container {
    background: black;
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    padding: 20px 28px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #ffffff;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
  }

  .gold-text {
    background: linear-gradient(135deg, #fff3b0 0%, #d4af37 50%, #997316 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
  }

  .gold-check {
    color: var(--gold-primary);
    font-size: 0.85rem;
    margin-left: 2px;
    filter: drop-shadow(0 0 4px var(--gold-glow));
  }

  /* Fixed Top Navigation Header */
  .stream-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding: 14px 14px;
    background: black;
    -webkit-backdrop-filter: var(--glass-blur);
    border-radius: var(--radius-lg);
    flex-shrink: 0;
    z-index: 20;
  }

  .header-left { display: flex; align-items: center; gap: 16px; }

  .mobile-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    cursor: pointer;
    padding: 10px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.25s ease;
  }

  .mobile-toggle:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .hidden { display: none !important; }

  .search-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    max-width: 520px;
    padding: 5px 6px 5px 18px;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
    transition: all 0.3s ease;
  }

  .search-bar:focus-within {
    border-color: var(--gold-primary);
    box-shadow: 0 0 15px var(--gold-glow);
    background: rgba(0, 0, 0, 0.7);
  }

  .search-bar input {
    background: transparent;
    border: none;
    color: #fff;
    outline: none;
    width: 100%;
    font-size: 0.9rem;
  }

  .search-bar input::placeholder { color: #626275; }

  .search-btn {
    background: linear-gradient(135deg, #d4af37, #8c6a18);
    border: none;
    border-radius: 50%;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #000;
    transition: all 0.25s ease;
    flex-shrink: 0;
  }

  .search-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 12px var(--gold-glow);
  }

  .header-right { display: flex; align-items: center; gap: 16px; }

  .vip-badge {
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid var(--gold-primary);
    color: var(--gold-light);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.1);
  }

  .vip-badge:hover {
    background: var(--gold-primary);
    color: #000;
    box-shadow: 0 0 18px var(--gold-glow);
  }

  .user-profile img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid var(--glass-border);
    cursor: pointer;
    object-fit: cover;
    transition: transform 0.25s ease;
  }

  .user-profile img:hover { transform: scale(1.08); }

  .category-scroll {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding: 16px 0 12px 0;
    flex-shrink: 0;
    scrollbar-width: none;
    transition: all 0.3s ease;
  }

  .category-scroll::-webkit-scrollbar { display: none; }

  .tag {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--glass-border);
    color: var(--text-muted);
    padding: 9px 20px;
    border-radius: 30px;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.25s ease;
  }

  .tag:hover {
    border-color: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .tag.active {
    background: rgba(212, 175, 55, 0.15);
    border-color: var(--gold-primary);
    color: var(--gold-light);
    font-weight: 700;
    box-shadow: 0 0 12px var(--gold-glow);
  }

  .panel-viewport {
    flex: 1;
    position: relative;
    overflow: hidden;
    margin-top: 8px;
  }

  .app-panel {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    pointer-events: none;
    transform: translateY(18px) scale(0.99);
    transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    overflow-y: auto;
    padding-bottom: 40px;
  }

  .app-panel.active {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);
  }

  /* Sticky Player Implementation */
  .video-sticky-wrapper {
    position: sticky;
    top: 0;
    z-index: 10;
    background: black;
    padding-bottom: 12px;
  }

  .video-player-container {
    width: 100%;
    max-height: 52vh;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 20px;
    background: #000;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
  }

  .video-player-container iframe {
    width: 100%;
    height: 100%;
  }

  .video-info {
    margin-top: 12px;
  }

  #videoTitle {
    font-size: 1.15rem;
    margin: 0 0 4px 0;
    color: #ffffff;
    font-weight: 700;
  }

  #videoChannel {
    margin: 0;
    font-size: 0.85rem;
    color: var(--gold-primary);
  }

  .related-heading {
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    margin: 16px 0 12px 0;
  }

  .video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 28px;
  }

  .video-card {
    background: var(--card-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 14px;
    cursor: pointer;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .video-card:hover {
    transform: translateY(-8px);
    background: var(--card-bg-hover);
    border-color: var(--glass-border-gold);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 175, 55, 0.15);
  }

  .thumbnail-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: #101014;
  }

  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .video-card:hover .thumbnail { transform: scale(1.05); }

  .badge {
    position: absolute;
    padding: 5px 10px;
    border-radius: 8px;
    font-size: 0.7rem;
    font-weight: 700;
    backdrop-filter: blur(8px);
  }

  .duration-badge {
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    bottom: 10px;
    right: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .live-badge {
    background: rgba(220, 38, 38, 0.9);
    color: #fff;
    top: 10px;
    left: 10px;
  }

  .card-details {
    display: flex;
    gap: 14px;
    margin-top: 14px;
    align-items: flex-start;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1.5px solid var(--gold-primary);
    object-fit: cover;
    flex-shrink: 0;
  }

  .info { flex: 1; min-width: 0; }

  .video-title {
    margin: 0 0 6px 0;
    font-size: 0.92rem;
    font-weight: 600;
    color: #f4f4f8;
    line-height: 1.35;
  }

  .channel-name { margin: 0; font-size: 0.78rem; color: var(--text-muted); }
  .meta-data { margin: 4px 0 0 0; font-size: 0.74rem; color: #71718a; }

  @media (max-width: 768px) {
    .stream-container { padding: 12px 14px; }
    .video-grid { grid-template-columns: 1fr; padding-bottom: 70px; }
  }
</style>


<script>
  (function () {
  let isScrollingTimeout;

  // Listen globally in the capture phase to intercept scrolls on any child element/panel
  window.addEventListener(
    'scroll',
    function (event) {
      // Trigger when scrolling happens anywhere inside the app viewport
      if (typeof hidePanelCapsuleBar === 'function') {
        hidePanelCapsuleBar();
      }

      clearTimeout(isScrollingTimeout);

      // Trigger show when user stops scrolling for 200ms
      isScrollingTimeout = setTimeout(function () {
        if (typeof showPanelCapsuleBar === 'function') {
          showPanelCapsuleBar();
        }
      }, 200);
    },
    true // 'true' enables event capturing so deep scroll events bubble up
  );
})();

</script>

  `,
  
  socialmedia:`<div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #0a0a0a; margin: 0; padding: 24px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  
  <div style="max-width: 420px; width: 100%; background: rgba(20, 20, 20, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 32px; border: 1px solid rgba(180, 150, 60, 0.2); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6); padding: 40px 28px; text-align: center; box-sizing: border-box;">
    
    <div style="width: 64px; height: 64px; border-radius: 22px; background: rgba(212, 175, 55, 0.05); border: 1px solid rgba(212, 175, 55, 0.25); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto;">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C5A059" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="10.51" x2="15.42" y2="6.49"></line>
        <line x1="8.59" y1="13.49" x2="15.42" y2="17.51"></line>
      </svg>
    </div>

    <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #e5c158; font-weight: 600;">
      Feed Coming Soon
    </h2>

    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a0a0a0; line-height: 1.6; font-weight: 400;">
      We are currently building this feature. Soon, your posts and updates will automatically connect with <strong style="color: #d4af37; font-weight: 600;">Phantom Hub</strong>.
    </p>

    <div style="height: 1px; width: 60px; background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent); margin: 0 auto 20px auto;"></div>

    <p style="margin: 0; font-size: 12px; color: #666666;">
      Thank you for your patience while we work on this!
    </p>

  </div>

</div>



`,
profile: `<div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #0a0a0a; margin: 0; padding: 24px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  
  <div style="max-width: 420px; width: 100%; background: rgba(20, 20, 20, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 32px; border: 1px solid rgba(180, 150, 60, 0.2); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6); padding: 40px 28px; text-align: center; box-sizing: border-box;">
    
    <div style="width: 64px; height: 64px; border-radius: 22px; background: rgba(212, 175, 55, 0.05); border: 1px solid rgba(212, 175, 55, 0.25); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto;">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C5A059" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
        <path d="M12 11v3"></path>
        <path d="M12 17h.01"></path>
      </svg>
    </div>

    <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #e5c158; font-weight: 600;">
      Profile Coming Soon
    </h2>

    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a0a0a0; line-height: 1.6; font-weight: 400;">
      We are currently setting up user profiles. Soon, you will be able to customize your account and connect directly with <strong style="color: #d4af37; font-weight: 600;">Phantom Hub</strong>.
    </p>

    <div style="height: 1px; width: 60px; background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent); margin: 0 auto 20px auto;"></div>

    <p style="margin: 0; font-size: 12px; color: #666666;">
      Thank you for your patience while we finish building this!
    </p>

  </div>

</div>

`,
  notifications: `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #0a0a0a; margin: 0; padding: 24px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  
  <div style="max-width: 440px; width: 100%; background: rgba(20, 20, 20, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 32px; border: 1px solid rgba(180, 150, 60, 0.2); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6); padding: 32px 24px; box-sizing: border-box; color: #e0e0e0;">
    
    <!-- Header -->
    <!-- Header Block (Replace the top section of your panel with this) -->
<div style="text-align: center; margin-bottom: 24px;">
  <div style="width: 60px; height: 60px; border-radius: 20px; background: rgba(212, 175, 55, 0.05); border: 1px solid rgba(212, 175, 55, 0.25); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C5A059" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <!-- Headband -->
      <path d="M3 14v-3a9 9 0 0 1 18 0v3"/>
      <!-- Right Ear Cup -->
      <path d="M21 15a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
      <!-- Left Ear Cup -->
      <path d="M3 15a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
      <!-- Front Microphone Boom Arm & Mic Capsule -->
      <path d="M19 17v1a3 3 0 0 1-3 3h-3"/>
      <circle cx="12" cy="21" r="1" fill="#C5A059"/>
    </svg>
  </div>
  <h2 style="margin: 0 0 4px 0; font-size: 20px; color: #e5c158; font-weight: 600;">
    Phantom Hub Support
  </h2>
  <p style="margin: 0; font-size: 13px; color: #888888;">
    System updates, active alerts & support portal
  </p>
</div>


    <!-- Section 1: Collapsible Announcements -->
    <details style="margin-bottom: 12px; background: rgba(255, 255, 255, 0.03); border-radius: 16px; border: 1px solid rgba(212, 175, 55, 0.15); overflow: hidden;">
      <summary style="padding: 14px 16px; font-size: 14px; font-weight: 600; color: #d4af37; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; list-style: none;">
        <span style="display: flex; align-items: center; gap: 10px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
</svg>

          Announcements
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7;">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </summary>
      <div style="padding: 0 16px 16px 16px; font-size: 13px; color: #aaaaaa; border-top: 1px solid rgba(255, 255, 255, 0.05); margin-top: 4px;">
        <ul style="margin: 12px 0 0 0; padding-left: 18px; line-height: 1.6;">
          <li><strong style="color: #e5c158;">New Features:</strong> Real-time post syncing with Phantom Hub is live.</li>
          <li><strong style="color: #e5c158;">Maintenance Notice:</strong> Scheduled server maintenance on Sunday at 02:00 UTC.</li>
          <li><strong style="color: #e5c158;">Known Issues:</strong> Minor delay in notification delivery under investigation.</li>
          <li><strong style="color: #e5c158;">Version Update:</strong> v2.4.0 is rolling out with performance enhancements.</li>
        </ul>
      </div>
    </details>

    <!-- Section 2: Collapsible Active Alerts -->
    <details style="margin-bottom: 12px; background: rgba(255, 255, 255, 0.03); border-radius: 16px; border: 1px solid rgba(229, 160, 88, 0.2); overflow: hidden;">
      <summary style="padding: 14px 16px; font-size: 14px; font-weight: 600; color: #e5a058; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; list-style: none;">
        <span style="display: flex; align-items: center; gap: 10px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E5A058" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Active Alerts
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E5A058" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7;">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </summary>
      <div style="padding: 0 16px 16px 16px; font-size: 13px; color: #aaaaaa; border-top: 1px solid rgba(255, 255, 255, 0.05); margin-top: 4px;">
        <ul style="margin: 12px 0 0 0; padding-left: 18px; line-height: 1.6;">
          <li><strong style="color: #ff8c00;">Server Issues:</strong> Intermittent delays on US-East region node.</li>
          <li><strong style="color: #ff8c00;">Upload Problems:</strong> High-resolution image uploads might timeout.</li>
          <li><strong style="color: #ff8c00;">Call Feature Outage:</strong> Voice calls temporarily disabled for maintenance.</li>
          <li><strong style="color: #ff8c00;">Temporary Bugs:</strong> Profile picture updates failing for select accounts.</li>
        </ul>
      </div>
    </details>

    <!-- Section 3: Collapsible Report a Bug with Form -->
 <details open style="margin-bottom: 16px; background: rgba(255, 255, 255, 0.03); border-radius: 16px; border: 1px solid rgba(212, 175, 55, 0.15); overflow: hidden;">
  <summary style="padding: 14px 16px; font-size: 14px; font-weight: 600; color: #d4af37; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; list-style: none;">
    <span style="display: flex; align-items: center; gap: 10px;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <path d="M12 11v6"></path>
        <path d="M9 14h6"></path>
      </svg>
      Report a Bug
    </span>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7;">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </summary>
  <div style="padding: 16px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
    
    <form id="bugReportForm" onsubmit="handleBugReportSubmit(event)" style="display: flex; flex-direction: column; gap: 12px;">
      
      <div>
        <label style="display: block; font-size: 11px; color: #888888; margin-bottom: 6px; font-weight: 500;">DESCRIBE ISSUE</label>
        <textarea id="bugDescription" placeholder="Describe what went wrong or share feedback..." required style="width: 100%; height: 70px; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 10px; padding: 10px; color: #ffffff; font-size: 12px; box-sizing: border-box; resize: none; outline: none; font-family: inherit;"></textarea>
      </div>

      <div>
        <label style="display: block; font-size: 11px; color: #888888; margin-bottom: 6px; font-weight: 500;">ATTACH SCREENSHOT</label>
        <input type="file" id="bugScreenshot" accept="image/*" style="width: 100%; font-size: 11px; color: #aaaaaa; background: rgba(0, 0, 0, 0.2); border: 1px dashed rgba(212, 175, 55, 0.3); padding: 8px; border-radius: 10px; box-sizing: border-box; cursor: pointer;">
      </div>

      <button type="submit" id="bugSubmitBtn" style="margin-top: 4px; width: 100%; padding: 10px; background: linear-gradient(135deg, #d4af37, #aa820a); border: none; border-radius: 10px; color: #0a0a0a; font-weight: 600; font-size: 13px; cursor: pointer; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
        <span id="btnText">Send Feedback to Developers</span>
      </button>

    </form>

  </div>
</details>

<div style="text-align: center; font-size: 11px; color: #555555; margin-top: 12px;">
  Phantom Hub System Monitor & System Operations
</div>


</div>



  `,
  security: `
    <div class="custom-panel-header">
      <button class="panel-back-btn" onclick="closePanel()">← Back</button>
      <h2 id="settings-panel-title">Security</h2>
    </div>
    <div class="custom-panel-body">
      <h3>Security & Privacy</h3>
      <p>Manage your passwords and two-factor auth.</p>
      <button style="padding: 10px 15px; background: #ff3b30; color: white; border: none; border-radius: 4px;">Reset Password</button>
    </div>
  `
};

/**
 * Injects dynamic HTML content based on target view
 * @param {string} targetKey - The key matching the content view needed
 */
function switchTarget(targetKey) {
  const contentContainer = document.getElementById('settings-panel-content');

  if (panelTemplates[targetKey]) {
    contentContainer.innerHTML = panelTemplates[targetKey];
  } else {
    contentContainer.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #0a0a0a; margin: 0; padding: 24px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  
  <div style="max-width: 420px; width: 100%; background: rgba(20, 20, 20, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 32px; border: 1px solid rgba(180, 150, 60, 0.2); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6); padding: 40px 28px; text-align: center; box-sizing: border-box;">
    
    <div style="width: 64px; height: 64px; border-radius: 22px; background: rgba(212, 175, 55, 0.05); border: 1px solid rgba(212, 175, 55, 0.25); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto;">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C5A059" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"></path>
        <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
      </svg>
    </div>

    <div class="custom-panel-body">
      <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #e5c158; font-weight: 600;">
        Module Under Development
      </h2>

      <p style="margin: 0 0 24px 0; font-size: 14px; color: #a0a0a0; line-height: 1.6; font-weight: 400;">
        Target configuration standard <span style="color: #d4af37; background: rgba(212, 175, 55, 0.08); padding: 2px 8px; border-radius: 6px; font-family: monospace; border: 1px solid rgba(212, 175, 55, 0.2);">${targetKey}</span> is currently under development.
      </p>
    </div>

    <div style="height: 1px; width: 60px; background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent); margin: 0 auto 20px auto;"></div>

    <p style="margin: 0; font-size: 12px; color: #666666;">
      Thank you for your patience while this module is being configured.
    </p>

  </div>

</div>


    `;
  }
}



window.switchTarget = switchTarget;





// 1. Automatically load EmailJS SDK if not already included in index.html
if (typeof emailjs === "undefined") {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  script.onload = () => {
    // Replace with your actual Public Key from EmailJS Account Settings
    emailjs.init("YRGhgKMi1JbXWQFMt"); 
  };
  document.head.appendChild(script);
} else {
  emailjs.init("YRGhgKMi1JbXWQFMt");
}

// 2. Add spinner animation styles to head
if (!document.getElementById("bug-report-styles")) {
  const styleTag = document.createElement("style");
  styleTag.id = "bug-report-styles";
  styleTag.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleTag);
}

// 3. Dynamic HTML string to inject into your DOM
const bugReportHTML = `
<details open style="margin-bottom: 16px; background: rgba(255, 255, 255, 0.03); border-radius: 16px; border: 1px solid rgba(212, 175, 55, 0.15); overflow: hidden;">
  <summary style="padding: 14px 16px; font-size: 14px; font-weight: 600; color: #d4af37; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; list-style: none;">
    <span style="display: flex; align-items: center; gap: 10px;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <path d="M12 11v6"></path>
        <path d="M9 14h6"></path>
      </svg>
      Report a Bug
    </span>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7;">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </summary>
  <div style="padding: 16px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
    
    <form id="bugReportForm" onsubmit="handleBugReportSubmit(event)" style="display: flex; flex-direction: column; gap: 12px;">
      
      <div>
        <label style="display: block; font-size: 11px; color: #888888; margin-bottom: 6px; font-weight: 500;">DESCRIBE ISSUE</label>
        <textarea id="bugDescription" placeholder="Describe what went wrong or share feedback..." required style="width: 100%; height: 70px; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 10px; padding: 10px; color: #ffffff; font-size: 12px; box-sizing: border-box; resize: none; outline: none; font-family: inherit;"></textarea>
      </div>

      <div>
        <label style="display: block; font-size: 11px; color: #888888; margin-bottom: 6px; font-weight: 500;">ATTACH SCREENSHOT</label>
        <input type="file" id="bugScreenshot" accept="image/*" style="width: 100%; font-size: 11px; color: #aaaaaa; background: rgba(0, 0, 0, 0.2); border: 1px dashed rgba(212, 175, 55, 0.3); padding: 8px; border-radius: 10px; box-sizing: border-box; cursor: pointer;">
      </div>

      <button type="submit" id="bugSubmitBtn" style="margin-top: 4px; width: 100%; padding: 10px; background: linear-gradient(135deg, #d4af37, #aa820a); border: none; border-radius: 10px; color: #0a0a0a; font-weight: 600; font-size: 13px; cursor: pointer; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
        <span id="btnText">Send Feedback to Developers</span>
      </button>

    </form>

  </div>
</details>

<div style="text-align: center; font-size: 11px; color: #555555; margin-top: 12px;">
  Phantom Hub System Monitor & System Operations
</div>
`;

// Helper: Convert File to Base64 String
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// 4. Form Submit Handler Function
async function handleBugReportSubmit(event) {
  event.preventDefault();

  const textarea = document.getElementById("bugDescription");
  const fileInput = document.getElementById("bugScreenshot");
  const submitBtn = document.getElementById("bugSubmitBtn");
  const btnText = document.getElementById("btnText");

  const messageText = textarea.value;
  const file = fileInput.files[0];

  // UI state: Show loading spinner
  submitBtn.disabled = true;
  submitBtn.style.cursor = "not-allowed";
  btnText.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
      <line x1="12" y1="2" x2="12" y2="6"></line>
      <line x1="12" y1="18" x2="12" y2="22"></line>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
      <line x1="2" y1="12" x2="6" y2="12"></line>
      <line x1="18" y1="12" x2="22" y2="12"></line>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
    </svg>
    Sending...
  `;

  try {
    // Invisible 1x1 GIF fallback if no file is uploaded
    let screenshotBase64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; 
    
    if (file) {
      screenshotBase64 = await fileToBase64(file);
    }

    const templateParams = {
      message: messageText,
      screenshot: screenshotBase64
    };

    // Replace YOUR_TEMPLATE_ID with the template ID from your EmailJS dashboard
    await emailjs.send("VENTA_service", "template_ku0ome9", templateParams);

    alert("Report submitted successfully to Phantom Hub developers!");
    document.getElementById("bugReportForm").reset();

  } catch (error) {
    console.error("Failed to send bug report:", error);
    alert("Failed to send report. Please check the console for errors.");
  } finally {
    // UI state: Restore button
    submitBtn.disabled = false;
    submitBtn.style.cursor = "pointer";
    btnText.textContent = "Send Feedback to Developers";
  }
}

window.handleBugReportSubmit = handleBugReportSubmit;
/**
 *  logic to hide bubble bar while scrolling
 */

  (function () {
    let lastScrollTop = 0;
    let isTouching = false;
    let scrollTimeout;
    const threshold = 10; // Ignore tiny movements under 10px

    // Track when finger touches and leaves the screen
    window.addEventListener('touchstart', function () {
      isTouching = true;
    }, { passive: true });

    window.addEventListener('touchend', function () {
      isTouching = false;
      // When finger leaves the screen, delay slightly before showing
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        if (typeof showPanelCapsuleBar === 'function') {
          showPanelCapsuleBar();
        }
      }, 300);
    }, { passive: true });

    // Handle scroll direction & active touch states
    window.addEventListener(
      'scroll',
      function (event) {
        // Target whatever container is currently scrolling
        const target = event.target === document ? document.documentElement : event.target;
        if (!target || typeof target.scrollTop === 'undefined') return;

        const currentScrollTop = target.scrollTop;
        const diff = currentScrollTop - lastScrollTop;

        // Ignore micro movements
        if (Math.abs(diff) < threshold) return;

        if (diff > 0 && currentScrollTop > 50) {
          // SCROLLING DOWN: Hide the bar
          if (typeof hidePanelCapsuleBar === 'function') {
            hidePanelCapsuleBar();
          }
        } else if (diff < 0) {
          // SCROLLING UP: Show the bar unless the finger is still held down
          if (!isTouching && typeof showPanelCapsuleBar === 'function') {
            showPanelCapsuleBar();
          }
        }

        lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;

        // Fallback: If not touching and scroll stops, bring bar back
        clearTimeout(scrollTimeout);
        if (!isTouching) {
          scrollTimeout = setTimeout(function () {
            if (typeof showPanelCapsuleBar === 'function') {
              showPanelCapsuleBar();
            }
          }, 400);
        }
      },
      true // Enable capturing to detect scroll inside deep panels/tunnels
    );
  })();
  