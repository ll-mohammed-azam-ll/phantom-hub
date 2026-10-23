





/* ===============================
   🔐 CONFIGURATION (REPLACE ME)
================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  serverTimestamp,
  set,
  get,
  remove,
  off,
  update,
  onDisconnect,
  query,
  orderByChild,
  limitToLast,
  endAt
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getMessaging,
  getToken,
  isSupported,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";




window.firebaseRemove = remove;
window.firebaseRef = ref;

window.firebaseUpdate = update;
window.firebaseRef = ref;



// 🔹 Firebase Config
const firebaseConfig = {
apiKey: "AIzaSyBWA-zRkPFH4svRjkMUO80TUdI9zIm5ICc",
authDomain: "phantom-messaging-a5bf0.firebaseapp.com",
databaseURL: "https://phantom-messaging-a5bf0-default-rtdb.firebaseio.com",
projectId: "phantom-messaging-a5bf0",
storageBucket: "phantom-messaging-a5bf0.firebasestorage.app",
messagingSenderId: "475147330421",
appId: "1:475147330421:web:6fe73f781a9dbf443ca93c",
measurementId: "G-1974SDM4VW"
};


// 🔹 Cloudinary Config
export const CLOUDINARY_URL =
  "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/upload";




/* ===============================
   🔥 FIREBASE INIT
================================ */

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app); 
const db = getDatabase(app);
const auth = getAuth(app);
const messaging = getMessaging(app);

let currentUser = null;
let panelOpen = false;


// Expose your Firebase instances to the global window object
window.auth = auth;
window.rtdb = rtdb;

// Track the current chat user globally so the call system can read it
// Replace the top-level assignment with a dynamic getter property:
Object.defineProperty(window, "currentChatUser", {
    get: () => {
        try { return currentChatUser; } catch(e) { return null; }
    },
    configurable: true
});



/* ===============================
   🌐 GLOBAL STATE
================================ */

let activeChatId = null;
let contacts = {};
let chatListener = null;

const beg_CONTACTS = [
  {
    uid: "phantomhub",
    username: "Phantom Hub",
    verified: true
  },
  {
    uid: "developer",
    username: "Developer",
    verified: true
  },
  {
    uid: "john123",
    username: "John",
    verified: false
  }
];
/* ===============================
   🔐 AUTH & INTERFACE SUBSYSTEMS
================================ */

document.addEventListener("DOMContentLoaded", () => {

  // Protect page
  onAuthStateChanged(auth, async (user) => {

    const session = getSession();

    // ❌ Not logged in
    if (!user || !session || user.uid !== session.uid) {
      clearSession();
      window.location.href = "ooooo1.html"; // login page
      return;
    }

    // ✅ Logged in correctly
    window.CURRENT_SESSION = session;
    console.log("Auth OK:", user.uid);

    // Initialize core application architecture
    initAppAfterLogin(user);
    
    // Bind scroll listeners securely now that the UI is guaranteed to exist
    setupScrollEngine();
  
    // Dynamically load the call system safely inside the authenticated thread
    try {
        console.log("STEP 1: Initializing dynamic module import...");
        const module = await import("./call-system.js");
        console.log("STEP 2: Module resolved:", module);

        const { listenForIncomingCalls } = module;
        console.log("STEP 3: Extracted hook:", listenForIncomingCalls);

        if (typeof listenForIncomingCalls === "function") {
            listenForIncomingCalls();
            console.log("STEP 4: Call listener successfully attached.");
        } else {
            console.warn("Hook failed: listenForIncomingCalls is not a function.");
        }
    } catch (error) {
        console.error("Failed to load call-system.js:", error);
    }
  });
});

/**
 * Encapsulates the message history infinite scroll engine.
 * Prevents script failure by confirming DOM presence before binding events.
 */
function setupScrollEngine() {

    const msgList = document.getElementById("msg-list");

    if (!msgList) return;

    let scrollTimeout = null;

    msgList.addEventListener("scroll", () => {

        clearTimeout(scrollTimeout);

        scrollTimeout = setTimeout(() => {

            if (
                msgList.scrollTop <= 150 &&
                !isLoadingOlderMessages
            ) {
                loadOlderMessages();
            }

        }, 100);

    });

}



async function loadOlderMessages() {

    if (isLoadingOlderMessages) return;
    if (!oldestLoadedTimestamp) return;
    if (!currentChatId) return;

    isLoadingOlderMessages = true;

    try {

        const msgList =
            document.getElementById("msg-list");

        if (!msgList) return;

        const previousHeight =
            msgList.scrollHeight;

        const olderQuery = query(
            ref(
                rtdb,
                "messages/" + currentChatId
            ),
            orderByChild("time"),
            endAt(oldestLoadedTimestamp - 1),
            limitToLast(50)
        );

        const snap =
            await get(olderQuery);

        if (!snap.exists()) {
            isLoadingOlderMessages = false;
            return;
        }

        const olderMessages = [];

        snap.forEach(child => {

            const msg = child.val();
            const key = child.key;

            if (!MESSAGE_CACHE[key]) {

                MESSAGE_CACHE[key] = {
                    ...msg,
                    id: key
                };

                olderMessages.push(
                    MESSAGE_CACHE[key]
                );

                if (
                    !oldestLoadedTimestamp ||
                    msg.time < oldestLoadedTimestamp
                ) {
                    oldestLoadedTimestamp =
                        msg.time;
                }

            }

        });

        olderMessages.sort(
            (a, b) => a.time - b.time
        );

        olderMessages.sort(
    (a, b) => a.time - b.time
);

// 👇 ADD IT HERE
olderMessages.forEach(msg => {
    renderOlderMessageUI(msg);
});

requestAnimationFrame(() => {

    const newHeight =
        msgList.scrollHeight;

    msgList.scrollTop =
        newHeight -
        previousHeight;

});
    } catch (err) {

        console.error(
            "Failed loading older messages:",
            err
        );

    } finally {

        isLoadingOlderMessages = false;

    }

}





const handleLogout = () => {
  signOut(auth)
    .then(() => {
      // Sign-out successful.
      console.log("User logged out");
      // Redirect to login page or refresh
      window.location.href = "ooooo1.html"; 
    })
    .catch((error) => {
      // An error happened.
      console.error("Logout Error:", error);
    });
};

window.handleLogout = handleLogout;

// ================= AUTO LOGIN CHECK =================
// ================= AUTH GUARD =================

const SESSION_KEY = "gold_hub_session";

function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}



// ================= FOLLOW SYSTEM =================


// Fetch all users (UID => profile)
async function fetchGlobalUsers() {

    const snap = await get(ref(window.rtdb, "global_users"));

    return snap.val() || {};
}

window.fetchGlobalUsers = fetchGlobalUsers;



// Follow a user
async function followUser(targetUid) {

    const myUid = CURRENT_SESSION.uid;

    if (!myUid || !targetUid) return;

    await set(
        ref(window.rtdb, `following/${myUid}/${targetUid}`),
        true
    );

    await set(
        ref(window.rtdb, `followers/${targetUid}/${myUid}`),
        true
    );
}



// Unfollow a user
async function unfollowUser(targetUid) {

    const myUid = CURRENT_SESSION.uid;

    if (!myUid || !targetUid) return;

    await remove(
        ref(window.rtdb, `following/${myUid}/${targetUid}`)
    );

    await remove(
        ref(window.rtdb, `followers/${targetUid}/${myUid}`)
    );
}



// Check if current user follows target
async function isFollowing(targetUid) {

    const myUid = CURRENT_SESSION.uid;

    if (!myUid || !targetUid) return false;

    const snap = await get(
        ref(window.rtdb, `following/${myUid}/${targetUid}`)
    );

    return snap.exists();
}



// ================= EXPLORE =================


async function showExplore() {

  const list = document.getElementById("network-list");

  if (!list) return;

  list.innerHTML = "Loading...";

  const myUid = CURRENT_SESSION.uid;

  if (!myUid) {
    list.innerHTML = "Not logged in";
    return;
  }

  // Get all users
  const users = await fetchGlobalUsers();

  // ✅ Check users object, not 'data'
  if (!users || Object.keys(users).length === 0) {
    list.innerHTML = "No users found";
    return;
  }

  // Get my following list
  const followSnap = await get(ref(window.rtdb, `following/${myUid}`));
  const followingData = followSnap.val() || {};

  let html = "";

  for (const uid in users) {
    const user = users[uid];

    if (uid === myUid) continue;

    const following = followingData[uid] === true;

    html += `
      <!-- Container with strict alignment, pure black background, and animated action glow effects -->
      <div class="list-item relative flex items-center justify-between gap-4 p-4 bg-black border border-white/[0.08] rounded-4xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 hover:border-white/[0.15] group">
        
        <!-- Modern Action Background Animation (Glow effects behind the text) -->
        <div class="absolute -inset-px bg-gradient-to-r from-blue-500/0 via-white/[0.03] to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" aria-hidden="true"></div>
        <div class="absolute -top-12 -left-12 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-500"></div>
        <div class="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500"></div>

        <!-- Left Section: Avatar & Info perfectly aligned -->
        <div class="flex items-center gap-4 z-10 flex-1 min-w-0">
          
          <!-- Avatar Frame -->
          <div class="relative flex-shrink-0 w-11 h-11 rounded-full overflow-hidden bg-neutral-900 border border-white/[0.1] flex items-center justify-center text-sm font-bold text-white/90 shadow-inner">
            ${
              user.profile_pic
              ? `<img src="${user.profile_pic}" class="w-full h-full object-cover">`
              : (user.username || "U")[0]
            }
          </div>

          <!-- Identity Text Area -->
          <div class="flex flex-col min-w-0">
            <span class="flex items-center gap-1.5 text-sm font-semibold text-white tracking-wide truncate">
              ${user.username || "Unknown"}
              ${user.verified ? `
              <span class="verified-badge inline-flex items-center flex-shrink-0 filter drop-shadow-[0_2px_8px_rgba(59,130,246,0.4)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#3B82F6">
                  <path d="M12 2l2.4 2.6 3.5-.5.5 3.5L22 10l-1.6 2.4.5 3.5-3.5.5L12 22l-2.4-2.6-3.5.5-.5-3.5L2 12l1.6-2.4-.5-3.5 3.5-.5L12 2z"/>
                  <path d="M10 13.2l-1.8-1.8-1.2 1.2L10 15.6l6-6-1.2-1.2z" fill="white"/>
                </svg>
              </span>
              ` : ""}
            </span>
          </div>

        </div>
        
        <br>

        <!-- Right Section: Action Buttons cleanly grouped and aligned -->
        <div class="flex items-center gap-2.5 z-10 flex-shrink-0">
          
          <!-- Follow Action Button -->
          <button
            onclick="toggleFollow('${uid}')"
            class="px-4 py-2 rounded-2xl text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 active:scale-95 min-w-[90px] text-center border ${
              following 
              ? "bg-transparent text-white/40 border-white/[0.1] hover:text-white/80 hover:bg-white/[0.05]" 
              : "bg-white text-black border-transparent hover:bg-neutral-200 shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
            }">
            ${following ? "Following" : "Follow"}
          </button>

          <!-- Message Action Button -->
          <button
            onclick="openChat('${uid}'); exploreChat();"
            class="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/[0.1] hover:border-white/[0.2] rounded-2xl text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm transition-all duration-200 active:scale-95">
            Message
          </button>

        </div>

      </div>
    `;


  }

  list.innerHTML = html || "No users found";
}



// ================= FOLLOWING =================

async function showFollowing() {

    const myUid = CURRENT_SESSION.uid;

    if (!myUid) return;

    const snap = await get(
        ref(window.rtdb, `following/${myUid}`)
    );

    await renderUserList(snap.val());
}



// ================= FOLLOWERS =================

async function showFollowers() {

    const myUid = CURRENT_SESSION.uid;

    if (!myUid) return;

    const snap = await get(
        ref(window.rtdb, `followers/${myUid}`)
    );

    await renderUserList(snap.val());
}



// ================= RENDER LIST =================

async function renderUserList(data) {

    const list = document.getElementById("network-list");

    if (!data) {
        list.innerHTML = "No users found";
        return;
    }

    // All users (UID => profile)
    const users = await fetchGlobalUsers();

    let html = "";

    // data = { uid1:true, uid2:true }
    for (const uid in data) {

        const user = users[uid];

        // Skip if user not found (safety)
        if (!user) continue;

        html += `
          <div class="list-item flex items-center gap-3 p-3 bg-white/5 rounded-2xl">

            <div class="flex-1 text-sm font-bold">
              ${user.username || "Unknown"}
            </div>

            <button
              onclick="openChat('${uid}')"
              class="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold">

              Message

            </button>

          </div>
        `;
    }

    list.innerHTML = html || "No users found";
}



// ================= TOGGLE FOLLOW =================

async function toggleFollow(targetUid) {

    if (!targetUid) return;

    const following = await isFollowing(targetUid);

    if (following) {
        await unfollowUser(targetUid);
    } else {
        await followUser(targetUid);
    }

    await showExplore();
}

window.toggleFollow = toggleFollow;



// ================= NETWORK SWITCH =================

async function showNetwork(type) {

    if (type === "Explore") {
        await showExplore();
    }

    if (type === "Following") {
        await showFollowing();
    }

    if (type === "Followers") {
        await showFollowers();
    }
}

window.showNetwork = showNetwork;



//########___4to open a chat inbox of a specific non user_____###########//

async function openChat(uid) {
  window.IS_CHAT_OPEN = uid;
  if (!uid) return;

  currentChatUser = uid;

  const myUid = auth.currentUser.uid;
  currentChatId = getChatId(myUid, uid);

  const snap = await get(ref(rtdb, "global_users/" + uid));

  if (snap.exists()) {
    const user = snap.val();

    // Update username ONLY
    document.getElementById("h-name").innerHTML = `
      ${user.username || "Unknown"}
      ${user.verified ? `
        <span class="verified-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#3B82F6">
            <path d="M12 2l2.4 2.6 3.5-.5.5 3.5L22 10l-1.6 2.4.5 3.5-3.5.5L12 22l-2.4-2.6-3.5.5-.5-3.5L2 12l1.6-2.4-.5-3.5 3.5-.5L12 2z"/>
            <path d="M10 13.2l-1.8-1.8-1.2 1.2L10 15.6l6-6-1.2-1.2z" fill="white"/>
          </svg>
        </span>
      ` : ""}
    `;

    // Update avatar container
    const avatar = document.getElementById("chat-avatar");

    if (user.profile_pic) {
      avatar.innerHTML = `
        <img src="${user.profile_pic}" 
        class="w-full h-full object-cover rounded-full">
      `;
    } else {
      avatar.innerHTML = `
        <span class="font-bold">
          ${(user.username || "U")[0]}
        </span>
      `;
    }
  }

  selectChat(uid);
}
window.openChat = openChat;

  
/* ===============================
   👤 USER INIT
================================ */

function initUser() {

  const userRef = ref(db, `users/${currentUser.uid}`);

  set(userRef, {
    name: "Agent " + currentUser.uid.slice(0, 4),
    initials: currentUser.uid.slice(0, 2).toUpperCase(),
    status: "secured"
  });
}









/* ========== CLOUDINARY CONFIG ========== */

const CLOUDINARY_CLOUD_NAME = "dkg7pyk5v"; // your cloud name
const CLOUDINARY_UPLOAD_PRESET = "Phantom_messaging";


/* ========== GLOBAL VARIABLES ========== */

let CONTACTS = [];
let CONTACT_INDEX = {};

let activeId = null;

export let currentChatId = null;
export let currentChatUser = null;



let selectedFile = null;

let MESSAGE_CACHE = {};
window.MESSAGE_CACHE = MESSAGE_CACHE;

const CHAT_CACHE = {};

let currentMessagesListener = null;

let oldestLoadedTimestamp = null;

let isLoadingOlderMessages = false;

let currentTypingRef = null;
let currentTypingCallback = null;

let currentStatusRef = null;
let currentStatusCallback = null;

let usersMetaRef = null;
let usersMetaCallback = null;

     // Stores messages for realtime updates
let lastRenderedDate = null; // Stores last date separator


/* ========== CHAT ID ========== */

function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}


/* ========== LOAD USERS ========== */

/* ========== LOAD USERS ========== */
function loadUsers() {

  const myUid =
    auth.currentUser?.uid;

  if (!myUid) return;

  const metaRef =
      ref(
          window.rtdb,
          "chat_meta"
      );

  // Remove old listener if it exists
  if (
      usersMetaRef &&
      usersMetaCallback
  ) {

      off(
          usersMetaRef,
          "value",
          usersMetaCallback
      );

  }

  usersMetaRef =
      metaRef;

  usersMetaCallback =
      async (snap) => {
    if (!snap.exists()) return;

    const chats = snap.val();
    const usersSnap = await get(ref(window.rtdb, "global_users"));
    const users = usersSnap.val() || {};

    let needsFullRender = CONTACTS.length === 0;

    for (const chatId in chats) {
      if (!chatId.includes(myUid)) continue;

      const meta = chats[chatId];
      
      // --- PROFESSIONAL DELETE LOGIC START ---
      // Check if you have cleared/deleted this chat from your side
      const myClearData = meta.clearedBy?.[myUid];
      const lastClearedAt = myClearData?.timestamp || 0;
      const isHiddenForMe = myClearData?.hidden === true;

      // If hidden, only show it again if a NEW message has arrived since you deleted it
      if (isHiddenForMe && (meta.lastTime || 0) <= lastClearedAt) {
        // If it's already in our local list, remove it and trigger a render
        if (CONTACTS.some(c => c.chatId === chatId)) {
          CONTACTS = CONTACTS.filter(c => c.chatId !== chatId);
          needsFullRender = true;
        }
        continue; // Skip to next chat
      }
      // --- PROFESSIONAL DELETE LOGIC END ---

      const [uid1, uid2] = chatId.split("_");
      const otherUid = uid1 === myUid ? uid2 : uid1;
      const user = users[otherUid];

      if (!user) continue;

      const isTyping = meta.typing && meta.typing[otherUid] === true;
      let contact = CONTACTS.find(c => c.uid === otherUid);

      if (contact) {
        if (contact.lastTime !== meta.lastTime || 
            contact.unread !== (meta.unread?.[myUid] || 0) || 
            contact.isTyping !== isTyping) {
          
          contact.lastMessage = meta.lastMessage || "";
          contact.lastTime = meta.lastTime || 0;
          contact.unread = meta.unread?.[myUid] || 0;
          contact.isTyping = isTyping;
          
          updateSingleContactUI(otherUid); 
        }
      } else {
        CONTACTS.push({
          uid: otherUid,
          chatId: chatId, // Added this to help with filtering
          ...user,
          unread: meta.unread?.[myUid] || 0,
          lastMessage: meta.lastMessage || "",
          lastTime: meta.lastTime || 0,
          isTyping: isTyping
        });
        needsFullRender = true;
      }
    }

    if (needsFullRender) {
      renderContacts();
    }
  };

onValue(
    metaRef,
    usersMetaCallback
);

}





function updateSingleContactUI(uid) {
  const contact = CONTACTS.find(c => c.uid === uid);
  if (!contact) return;

  const contactElement = document.querySelector(`[onclick="selectChat('${uid}')"]`);
  if (contactElement) {
    const previewText = contactElement.querySelector("p");
    const timeText = contactElement.querySelector(".text-\\[10px\\]");
    const unreadBadge = contactElement.querySelector(".unread-badge");

    // --- 1. SIDEBAR TYPING LOGIC ---
    if (contact.isTyping) {
        if (previewText) {
            previewText.classList.add("typing-text-gold");
            previewText.innerText = "Typing...";
        }
    } else {
        if (previewText) {
            previewText.classList.remove("typing-text-gold");
            previewText.innerText = truncateText(contact.lastMessage, 25);
        }
    }

    // --- 2. CHAT WINDOW ANIMATION LOGIC ---
    // This part should be independent so the sidebar can still update other info
    if (window.currentChatUser === uid) {
        const chatMessages = document.getElementById("msg-list");
        let typingIndicator = document.getElementById("typing-bubble");

        if (contact.isTyping) {
            if (!typingIndicator && chatMessages) {
                typingIndicator = document.createElement("div");
                typingIndicator.id = "typing-bubble";
                typingIndicator.className = "msg-them msg-bubble typing-dots mb-4 flex gap-1 items-center p-3 rounded-xl w-fit";
                typingIndicator.innerHTML = `
                    <div class="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce"></div>
                    <div class="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div class="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                `;
                chatMessages.appendChild(typingIndicator);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } else if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // --- 3. TIME & UNREAD UPDATES ---
    if (timeText && contact.lastTime) {
        timeText.innerText = new Date(contact.lastTime).toLocaleTimeString([], { 
            hour: "2-digit", 
            minute: "2-digit" 
        });
    }
     
    if (contact.unread > 0) {
        if (unreadBadge) {
            unreadBadge.innerText = contact.unread;
        } else {
            // If badge doesn't exist yet, re-render to create it
            renderContacts(); 
        }
    } else if (unreadBadge) {
        unreadBadge.remove();
    }
  }
}










function showWelcomeChats() {

  CONTACTS = [

    {
      uid: "phantom_hub",
      username: "Phantom Hub",
      lastMessage: "Welcome to GoldHub Messenger ✨",
      lastTime: Date.now(),
      system: true,
      verified: true
    },

    {
      uid: "developer",
      username: "Developer",
      lastMessage: "Thanks for joining GoldHub 💛",
      lastTime: Date.now() - 1,
      system: true,
      verified: true
    }

  ];

  renderContacts();
}

/* ========== OPEN CHAT ========== */

async function selectChat(uid) {
  // ✅ CRITICAL: Tell the app who we are looking at right now
  
  if (uid === "phantom_hub") {
  openPhantomHubChat();
  return;
}

if (uid === "developer") {
  openDeveloperChat();
  return;
}


// 🛠️ REACTIVATE INPUT & CALLS
  // Reactivate using ID
  const inputArea = document.getElementById("input-container");
  if (inputArea) inputArea.style.display = "block";
  
  
  activeId = uid;
  currentChatUser = uid;
  const myUid = auth.currentUser.uid;
  currentChatId = getChatId(myUid, uid);
  window.currentChatId = currentChatId;
  
  // ✅ TARGET THE HEADER DATA
const contact = CONTACTS.find(c => c.uid === uid);

if (contact) {

  // Update username
  document.getElementById("h-name").innerHTML = `
    ${contact.username || "Unknown"}
    ${contact.verified ? `
      <span class="verified-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#3B82F6">
          <path d="M12 2l2.4 2.6 3.5-.5.5 3.5L22 10l-1.6 2.4.5 3.5-3.5.5L12 22l-2.4-2.6-3.5.5-.5-3.5L2 12l1.6-2.4-.5-3.5 3.5-.5L12 2z"/>
          <path d="M10 13.2l-1.8-1.8-1.2 1.2L10 15.6l6-6-1.2-1.2z" fill="white"/>
        </svg>
      </span>
    ` : ""}
  `;

  const avatarContainer = document.getElementById("chat-avatar");

  if (contact.profile_pic) {

    avatarContainer.innerHTML = `
      <img src="${contact.profile_pic.replace('/upload/','/upload/w_100,c_fill,q_auto,f_auto/')}"
           class="w-full h-full object-cover ">
    `;

  } else {

    avatarContainer.innerHTML = `
      <span class="font-bold">
        ${(contact.username || "U")[0]}
      </span>
    `;

  }

    
    // Listen for the OTHER user's live status
    // Remove previous status listener
if (currentStatusRef && currentStatusCallback) {
    off(
        currentStatusRef,
        "value",
        currentStatusCallback
    );
}

const statusRef =
    ref(
        window.rtdb,
        `status/${uid}`
    );

currentStatusRef =
    statusRef;

currentStatusCallback =
    (snap) => {

        const status =
            snap.val();

        const statusElement =
            document.querySelector(
                "#h-name"
            )?.nextElementSibling;

        if (!statusElement)
            return;

        statusElement.innerText =
            formatStatus(status);

        statusElement.style.color =
            status?.state === "online"
                ? "#4ADE80"
                : "#D4AF37";
    };

onValue(
    statusRef,
    currentStatusCallback
);
  }
  

  const msgList = document.getElementById("msg-list");
  if (msgList) msgList.innerHTML = "";


  // Clear my unread count since I just opened the window
  const chatMetaRef = ref(rtdb, "chat_meta/" + currentChatId);
  const metaSnap = await get(chatMetaRef);
  
  if(metaSnap.exists()) {
    let metaData = metaSnap.val();
    let unread = metaData.unread || {};
    unread[myUid] = 0;
    await update(chatMetaRef, { unread });
  }



  // Clear previous chat memory

loadMessagesOptimized();
markMessagesSeen();
  

// Mark again when screen gains focus
window.removeEventListener("focus", markMessagesSeen);
window.addEventListener("focus", markMessagesSeen);

  if (window.innerWidth < 768) {
    if (typeof pushAppState === 'function') {
        pushAppState({ chatOpen: true }); 
    }
    document.getElementById("chat-window").classList.add("active");
    document.getElementById("hub-stack").style.display = "none";
  }
  
  // Reset unread locally
  if (contact) contact.unread = 0;
  
  
  
  
  // Listen for real-time typing in the active chat
// Remove previous typing listener
if (currentTypingRef && currentTypingCallback) {
    off(currentTypingRef, "value", currentTypingCallback);
}

const typingRef =
    ref(
        window.rtdb,
        `chat_meta/${currentChatId}/typing/${uid}`
    );

currentTypingRef = typingRef;

currentTypingCallback = (snapshot) => {

    const isTyping =
        snapshot.val() === true;

    const container =
        document.getElementById("msg-list");

    let indicator =
        document.getElementById("typing-indicator");

    if (isTyping) {

        if (!indicator && container) {

            indicator =
                document.createElement("div");

            indicator.id =
                "typing-indicator";

            indicator.className =
                "flex mb-4";

            indicator.innerHTML = `
                <div class="msg-them typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;

            container.appendChild(
                indicator
            );

            container.scrollTop =
                container.scrollHeight;
        }

    } else if (indicator) {

        indicator.remove();

    }

};

onValue(
    typingRef,
    currentTypingCallback
); 
  
  
  renderContacts();
}


window.selectChat = selectChat;
window.renderContacts = renderContacts;


function saveChatCache() {

    if (!currentChatId) return;

    const messages =
        Object.values(MESSAGE_CACHE)
        .sort((a, b) => a.time - b.time);

    const latestMessages =
        messages.slice(-100);

    const compactCache = {};

    latestMessages.forEach(msg => {

        compactCache[
            msg.id
        ] = msg;

    });

    try {

        localStorage.setItem(
            "chat_cache_" + currentChatId,
            JSON.stringify(compactCache)
        );

    } catch (err) {

        console.warn(
            "Cache save failed:",
            err
        );

    }

}


function loadMessagesOptimized() {

MESSAGE_CACHE = {};
window.MESSAGE_CACHE = MESSAGE_CACHE;

oldestLoadedTimestamp = null;
lastRenderedDate = null;

    const msgList =
        document.getElementById("msg-list");

    if (!msgList) return;

    const cacheKey =
        "chat_cache_" + currentChatId;

    const cached =
        localStorage.getItem(cacheKey);

    if (cached) {

        try {

            MESSAGE_CACHE =
                JSON.parse(cached);

            window.MESSAGE_CACHE =
                MESSAGE_CACHE;

            redrawMessages();

        } catch (err) {

            console.error(err);

        }

    }

    loadLatestMessages();
}

function loadLatestMessages() {

    if (!currentChatId) return;

    if (currentMessagesListener) {
        off(currentMessagesListener);
    }

    const msgQuery = query(
        ref(
            rtdb,
            "messages/" + currentChatId
        ),
        orderByChild("time"),
        limitToLast(50)
    );

    currentMessagesListener = msgQuery;

    const myUid =
        auth.currentUser.uid;

    onChildAdded(
        msgQuery,
        async (snap) => {

            const msg = snap.val();
            const key = snap.key;

            if (
                !oldestLoadedTimestamp ||
                msg.time < oldestLoadedTimestamp
            ) {
                oldestLoadedTimestamp =
                    msg.time;
            }

            if (
                MESSAGE_CACHE[key]
            ) return;

            MESSAGE_CACHE[key] = {
                ...msg,
                id: key
            };

            saveChatCache();

            renderMessageUI(
                MESSAGE_CACHE[key]
            );

            if (
                msg.sender !== myUid &&
                msg.status === "sent"
            ) {

                update(
                    ref(
                        rtdb,
                        `messages/${currentChatId}/${key}`
                    ),
                    {
                        status: "delivered"
                    }
                );

            }

        }
    );

    onChildChanged(
        msgQuery,
        (snap) => {

            const key = snap.key;

            MESSAGE_CACHE[key] = {
                ...snap.val(),
                id: key
            };

            saveChatCache();

            redrawMessages();

        }
    );

    onChildRemoved(
        msgQuery,
        (snap) => {

            delete MESSAGE_CACHE[
                snap.key
            ];

            saveChatCache();

            redrawMessages();

        }
    );

}


let typingTimer;
const messageInput = document.getElementById("chat-input"); // Ensure this ID matches your HTML

messageInput.addEventListener("input", () => {
    if (!currentChatId) return;
    const myUid = auth.currentUser.uid;
    
    // Set status to typing
    set(ref(window.rtdb, `chat_meta/${currentChatId}/typing/${myUid}`), true);

    // Stop typing after 2.5 seconds of no activity
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        set(ref(window.rtdb, `chat_meta/${currentChatId}/typing/${myUid}`), false);
    }, 2500);
});



async function showExploreInChat() {

  const chat = document.getElementById("msg-list");
  chat.innerHTML = `<div class="sys-msg">🔎 Discover new users</div>`;

  const usersSnap = await get(ref(rtdb, "global_users"));
  const users = usersSnap.val() || {};

  const myUid = auth.currentUser.uid;

  Object.keys(users).forEach(uid => {

    if (uid === myUid) return;

    const user = users[uid];

    const item = document.createElement("div");
    item.className = "explore-user";

    item.innerHTML = `
  <div class="explore-card">
    <div class="explore-avatar">
 ${
   user.profile_pic
   ? `<img src="${user.profile_pic}" class="w-full h-full object-cover rounded-full">`
   : (user.username || "U")[0]
 }
</div>
    <div class="explore-content">
        <div class="explore-info">
            <p class="explore-name flex items-center">
  ${user.username || "Unknown"}
  ${user.verified ? `
    <span class="verified-badge">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#3B82F6">
        <path d="M12 2l2.4 2.6 3.5-.5.5 3.5L22 10l-1.6 2.4.5 3.5-3.5.5L12 22l-2.4-2.6-3.5.5-.5-3.5L2 12l1.6-2.4-.5-3.5 3.5-.5L12 2z"/>
        <path d="M10 13.2l-1.8-1.8-1.2 1.2L10 15.6l6-6-1.2-1.2z" fill="white"/>
      </svg>
    </span>
  ` : ""}
</p>
        </div>
        <div class="explore-actions">
            <button class="btn-follow" onclick="followUser('${uid}')">Follow</button>
            <button class="btn-message" onclick="openChat('${uid}')">Message</button>
        </div>
    </div>
  </div>
`;



    chat.appendChild(item);

  });

}

window.showExploreInChat = showExploreInChat;

function openPhantomHubChat() {

  document.getElementById("h-name").innerHTML = `
  <span class="name-wrap">
    Phantom Hub
    <span class="official-badge">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#FFD700">
        <path d="M12 2l2.4 2.6 3.5-.5.5 3.5L22 10l-1.6 2.4.5 3.5-3.5.5L12 22l-2.4-2.6-3.5.5-.5-3.5L2 12l1.6-2.4-.5-3.5 3.5-.5L12 2z"/>
        <path d="M10 13.2l-1.8-1.8-1.2 1.2L10 15.6l6-6-1.2-1.2z" fill="#000"/>
      </svg>
    </span>
  </span>
`;

  const chat = document.getElementById("msg-list");

  chat.innerHTML = `
  
  <div class="sys-msg">
    👋 Welcome to <b>GoldHub Messenger</b>
  </div>

  <div class="sys-msg">
    We are excited to have you here.
  </div>

  <div class="explore-panel" onclick="showExploreInChat()">
      🔎 Click here to explore new users
  </div>

  `;
  
  
// 🛠️ DEACTIVATE INPUT & CALLS
  // Hide the div class="p-6" that contains your input area
  // Reactivate using ID
  const inputArea = document.getElementById("input-container");
  if (inputArea) inputArea.style.display = "none";  
  document.getElementById("chat-window").classList.add("active");
  document.getElementById("hub-stack").style.display = "none";

}

function openDeveloperChat(){

  document.getElementById("h-name").innerHTML = `
  <span class="name-wrap">
    Developer 
    <span class="official-badge">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#FFD700">
        <path d="M12 2l2.4 2.6 3.5-.5.5 3.5L22 10l-1.6 2.4.5 3.5-3.5.5L12 22l-2.4-2.6-3.5.5-.5-3.5L2 12l1.6-2.4-.5-3.5 3.5-.5L12 2z"/>
        <path d="M10 13.2l-1.8-1.8-1.2 1.2L10 15.6l6-6-1.2-1.2z" fill="#000"/>
      </svg>
    </span>
  </span>
`;

  const chat = document.getElementById("msg-list");

  chat.innerHTML = `

  <div class="sys-msg">
    👨‍💻 Hello! I'm the developer of GoldHub.
  </div>

  <div class="sys-msg">
    Thank you for trying this platform.
  </div>

  <div class="sys-msg">
    Your support means a lot 💛
  </div>

  <div class="explore-panel" onclick="showExploreInChat()">
      🔎 Click here to explore users
  </div>

  `;
  

  // 🛠️ DEACTIVATE INPUT & CALLS
  // Hide the div class="p-6" that contains your input area
  // Reactivate using ID
  const inputArea = document.getElementById("input-container");
  if (inputArea) inputArea.style.display = "none";
  document.getElementById("chat-window").classList.add("active");
document.getElementById("hub-stack").style.display = "none";

}




function startChat(userId, username){

    currentChatUser = userId;

    // open chat panel
    document.getElementById("chat-window").style.display = "block";

    // set chat title
    document.getElementById("chat-username").innerText = username;

    // clear messages area
    document.getElementById("msg-list").innerHTML = "";

}
/* ========== CREATE CHAT ========== */

async function createChatIfNotExists(otherUid) {

  const chatRef = ref(rtdb, "chats/" + currentChatId);
  const snap = await get(chatRef);

  if (!snap.exists()) {
    await set(chatRef, {
      users: {
        [auth.currentUser.uid]: true,
        [otherUid]: true
      },
      createdAt: Date.now()
    });

    // Initialize meta as well to prevent nulls
    await set(ref(rtdb, "chat_meta/" + currentChatId), {
        lastMessage: "",
        lastTime: Date.now(),
        unread: {
            [auth.currentUser.uid]: 0,
            [otherUid]: 0
        },
        presence: {
            [auth.currentUser.uid]: "online",
            [otherUid]: "offline"
        }
    });
  }
}


/* ========== LOAD MESSAGES ========== */
 
/* ========== LOAD MESSAGES (FIXED DUPLICATION) ========== */
/* ========== LOAD MESSAGES (STABLE VERSION) ========== */
function loadMessagesFromFirebase() {

  if (!currentChatId) return;

  const msgList = document.getElementById("msg-list");

  if (msgList) msgList.innerHTML = "";

  lastRenderedDate = null;

  MESSAGE_CACHE = {};
  window.MESSAGE_CACHE = MESSAGE_CACHE;

  if (currentMessagesListener) {
    off(currentMessagesListener);
  }

  const msgQuery = query(
    ref(rtdb, "messages/" + currentChatId),
    orderByChild("time"),
    limitToLast(50)
  );

  currentMessagesListener = msgQuery;

  const myUid = auth.currentUser.uid;

  onChildAdded(msgQuery, async (snap) => {

    const msg = snap.val();
    const key = snap.key;

    if (MESSAGE_CACHE[key]) return;

    MESSAGE_CACHE[key] = {
      ...msg,
      id: key
    };

    window.MESSAGE_CACHE = MESSAGE_CACHE;

    saveChatCache();

    if (
      msg.sender !== myUid &&
      msg.status === "sent"
    ) {

      if (
        window.IS_CHAT_OPEN === currentChatUser
      ) {

        await update(
          ref(
            rtdb,
            `messages/${currentChatId}/${key}`
          ),
          {
            status: "seen"
          }
        );

      } else {

        await update(
          ref(
            rtdb,
            `messages/${currentChatId}/${key}`
          ),
          {
            status: "delivered"
          }
        );

      }

    }

    renderMessageUI(MESSAGE_CACHE[key]);

    updateContactAfterMessage(msg);

  });

  onChildChanged(msgQuery, (snap) => {

    const msg = snap.val();
    const key = snap.key;

    if (!MESSAGE_CACHE[key]) return;

    MESSAGE_CACHE[key] = {
      ...msg,
      id: key
    };

    window.MESSAGE_CACHE = MESSAGE_CACHE;

    saveChatCache();

    redrawMessages();

  });

  onChildRemoved(msgQuery, (snap) => {

    const key = snap.key;

    delete MESSAGE_CACHE[key];

    window.MESSAGE_CACHE = MESSAGE_CACHE;

    saveChatCache();

    redrawMessages();

  });

}
















function renderMessageUI(m) {

    const msgList =
        document.getElementById("msg-list");

    if (!msgList) return;

    const html =
        buildMessageHTML(m);

    if (!html) return;

    const isAtBottom =
        msgList.scrollHeight -
        msgList.scrollTop <=
        msgList.clientHeight + 150;

    msgList.insertAdjacentHTML(
        "beforeend",
        html
    );

    if (isAtBottom) {

        msgList.scrollTop =
            msgList.scrollHeight;
    }
}


function renderOlderMessageUI(m) {

    const msgList =
        document.getElementById("msg-list");

    if (!msgList) return;

    const html =
        buildMessageHTML(m);

    if (!html) return;

    msgList.insertAdjacentHTML(
        "afterbegin",
        html
    );
}



function buildMessageHTML(m) {

const dateLabel =
    formatChatDate(m.time);

let dateHTML = "";

if (dateLabel !== lastRenderedDate) {

    lastRenderedDate =
        dateLabel;

    dateHTML =
        buildDateSeparator(m.time);
}

    const myUid = auth.currentUser.uid;

    if (m.deletedFor && m.deletedFor[myUid]) {
        return "";
    }

    const messageId = m.id || m.time;

    const isMe =
        m.sender === auth.currentUser.uid;

    const time = new Date(
        m.time
    ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    const getThumb = (url) =>
        (url && url.includes("cloudinary"))
            ? url.replace(
                "/upload/",
                "/upload/w_300,c_scale,q_auto,f_auto/"
            )
            : url;

    let contentHtml = "";

    if (m.deletedForEveryone) {

        contentHtml = `
            <p class="italic opacity-60 text-sm">
                This message was deleted
            </p>
        `;

    }

    else if (m.type === "text") {

        const safeP =
            document.createElement("p");

        safeP.className =
            "whitespace-pre-wrap break-words text-sm";

        safeP.textContent =
            m.content;

        contentHtml =
            safeP.outerHTML;

    }

else if (m.type === "capsule") {

    const locked =
        Date.now() < m.unlockAt;

    if (locked) {

        const unlockDate =
            new Date(
                m.unlockAt
            ).toLocaleString();

        contentHtml = `
            <div class="relative overflow-hidden rounded-3xl p-4 border border-[#D4AF37]/30 bg-black group">

    <!-- CONTAINED, BRIGHT FIREBASE-THEMED FLAME LAYER -->
    <div class="absolute inset-0 opacity-20 transition-opacity duration-700 group-hover:opacity-35 pointer-events-none z-0"
         style="animation: flameShift 9s ease-in-out infinite alternate;">
        
        <!-- Flame Orb 1: Shifting Gold to Flame Orange -->
        <div class="absolute inset-0 mix-blend-screen filter blur-[14px]"
             style="animation: flameMorph 12s linear infinite; 
                    background: linear-gradient(to top right, hsl(43, 67%, 53%), hsl(25, 95%, 50%), hsl(15, 90%, 45%));">
        </div>
        
        <!-- Flame Orb 2: Intersecting Deep Amber to Crimson Lava Red -->
        <div class="absolute inset-1 mix-blend-screen filter blur-[18px]"
             style="animation: flameMorph 8s linear infinite reverse; 
                    background: linear-gradient(to bottom left, hsl(0, 85%, 45%), hsl(35, 90%, 45%), hsl(10, 95%, 35%));">
        </div>
    </div>

    <!-- CONTENT LAYER (Safely layered on top) -->
    <div class="relative z-10">
        <div class="text-3xl mb-2">
            🔒
        </div>

        <div class="text-[#D4AF37] font-bold">
            Time Capsule
        </div>

        <div class="text-xs text-gray-400 mt-2">
            Opens on
        </div>

        <div class="text-sm text-white">
            ${unlockDate}
        </div>

        <div
            id="capsule-timer-${messageId}"
            class="mt-4 text-center text-lg font-bold text-[#D4AF37] tracking-widest"
        >
            00 : 00 : 00 : 00
        </div>
    </div>

</div>

        `;

        setTimeout(() => {

            const timerEl =
                document.getElementById(
                    `capsule-timer-${messageId}`
                );

            if (!timerEl) return;

            if (
                timerEl.dataset.started
            ) {
                return;
            }

            timerEl.dataset.started =
                "true";

            const updateTimer = () => {

                const remaining =
                    m.unlockAt -
                    Date.now();

                if (
                    remaining <= 0
                ) {

                    clearInterval(
                        intervalId
                    );

                    redrawMessages();

                    return;
                }

                const days =
                    Math.floor(
                        remaining /
                        86400000
                    );

                const hours =
                    Math.floor(
                        (
                            remaining %
                            86400000
                        ) /
                        3600000
                    );

                const minutes =
                    Math.floor(
                        (
                            remaining %
                            3600000
                        ) /
                        60000
                    );

                const seconds =
                    Math.floor(
                        (
                            remaining %
                            60000
                        ) /
                        1000
                    );

                timerEl.textContent =
                    `${String(days).padStart(2,"0")} : ${String(hours).padStart(2,"0")} : ${String(minutes).padStart(2,"0")} : ${String(seconds).padStart(2,"0")}`;
            };

            updateTimer();

            const intervalId =
                setInterval(
                    updateTimer,
                    1000
                );

        }, 0);

    } else {

        const safeP =
            document.createElement("p");

        safeP.className =
            "whitespace-pre-wrap break-words text-sm";

        safeP.textContent =
            m.content;

        contentHtml = `
            <div class="rounded-3xl p-4 border border-[#D4AF37]/30">

                <div class="text-[#D4AF37] font-bold mb-2">
                    ✨ Time Capsule Opened
                </div>

                ${safeP.outerHTML}

            </div>
        `;
    }
}

    else if (
        m.type === "sticker" ||
        m.type === "gif"
    ) {

        contentHtml = `
            <div class="flex justify-center p-1">
                <img
                    src="${m.content}"
                    draggable="false"
                    loading="lazy"
                    class="max-w-[140px] w-full h-auto object-contain rounded-xl select-none pointer-events-none"
                >
            </div>
        `;

    }

    else if (m.type === "call") {

        const icon =
            m.callType === "video"
                ? "📹"
                : "📞";

        const callName =
            m.callType === "video"
                ? "Video Call"
                : "Voice Call";

        let statusText = "Call";

        if (
            m.callStatus === "ended" ||
            m.callStatus === "rejected"
        ) {
            statusText = "Call Ended";
        }
        else if (
            m.callStatus === "missed"
        ) {
            statusText = "No Answer";
        }

        contentHtml = `
            <div class="flex items-center gap-2">
                <span>${icon}</span>
                <span>${callName} • ${statusText}</span>
            </div>
        `;

    }

    else {

        let mediaItem = "";

        if (m.type === "image") {

            mediaItem = `
                <img
                    src="${getThumb(m.content)}"
                    data-full="${m.content}"
                    data-kind="image"
                    class="clickable-media rounded-xl w-full max-h-64 object-cover cursor-pointer"
                >
            `;

        }

        else if (m.type === "video") {

            const vThumb =
                getThumb(m.content)
                .replace(/\.[^/.]+$/, ".jpg");

            mediaItem = `
                <div
                    class="relative cursor-pointer clickable-media"
                    data-full="${m.content}"
                    data-kind="video"
                >
                    <div class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                        <span class="text-white text-3xl">▶</span>
                    </div>

                    <img
                        src="${vThumb}"
                        class="rounded-xl w-full max-h-64 object-cover"
                    >
                </div>
            `;

        }

        else if (m.type === "audio") {

            mediaItem = `
                <button
                    class="clickable-media bg-[#D4AF37] text-black px-4 py-3 rounded-xl text-xs font-bold w-full"
                    data-full="${m.content}"
                    data-kind="audio"
                >
                    🎵 Play Audio
                </button>
            `;

        }

        contentHtml = mediaItem;

    }

    let ticks = "";

    if (isMe) {

        if (m.status === "sent") {
            ticks = "✔";
        }

        else if (
            m.status === "delivered" ||
            m.status === "seen"
        ) {
            ticks = "✔✔";
        }

    }

    const tickColor =
        m.status === "seen"
            ? "text-blue-400"
            : "text-gray-400";

    const dynamicBubbleBg =
        (
            m.type === "sticker" ||
            m.type === "gif"
        )
            ? "bg-transparent shadow-none border-none"
            : (
                isMe
                    ? "msg-me"
                    : "msg-them"
            );

    const alignmentSide =
        isMe
            ? "justify-end"
            : "justify-start";

    const html = `
    <div class="flex w-full ${alignmentSide} mb-2 px-2">
        <div
            class="msg-bubble message-item ${dynamicBubbleBg}"
            data-id="${messageId}"
        >
            ${contentHtml}

            <div
                class="flex justify-end items-center gap-1 mt-1 opacity-80"
                style="font-size:9px"
            >
                <span>${time}</span>

                ${
                    isMe
                        ? `<span class="${tickColor}">${ticks}</span>`
                        : ""
                }
            </div>
        </div>
    </div>
`;

return dateHTML + html;
}




function buildDateSeparator(timestamp) {

    const dateLabel =
        formatChatDate(timestamp);

    return `
        <div class="text-center my-4 text-xs text-gray-400 font-bold tracking-wide w-full">
            ꧁・┆✦ ${dateLabel} ✦ ┆・꧂
        </div>
    `;
}
/* ========== RENDER MESSAGE UI (IMPROVED) ========== */
/* ========== RENDER MESSAGE UI (UPDATED FOR STICKERS & GIFS) ========== */
// Keep track of the last rendered date globally or in an outer scope

// Keep track of the last rendered date globally or in an outer scope


// Keep track of the last rendered date globally or in an outer scope


// Keep track of the last rendered date globally or in an outer scope


/*function renderMessageUI(m) { 

  //============={{{notification}}}========
  if (!localStorage.getItem("phantom_delete_update_v1")) {
    alert(
      "🎉 Chat Deletion Updated!\n\n" +
      "You can now:\n" +
      "• Delete messages for yourself\n" +
      "• Delete your own messages for everyone\n" +
      "• Delete multiple selected messages at once\n\n" +
      "Thank you for using Phantom Messaging."
    );
    localStorage.setItem("phantom_delete_update_v1", "shown");
  }

  //======{{==============}}

  const myUid = auth.currentUser.uid;

  // Hidden only for me
  if (m.deletedFor && m.deletedFor[myUid]) {
    return;
  }
     
  const msgList = document.getElementById("msg-list");    
  if (!msgList || !m.content) return;    
    
  // Prevent duplicate rendering logs
  const messageId = m.id || m.time;
  if (document.querySelector(`[data-id="${messageId}"]`)) return;
      
  const isMe = m.sender === auth.currentUser.uid;    
  const time = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });    

  //========== DATE SEPARATOR ========== 
  let dateHTML = "";
  if (typeof formatChatDate === "function") {
    const dateLabel = formatChatDate(m.time);
    if (dateLabel !== lastRenderedDate) {
      lastRenderedDate = dateLabel;
      dateHTML = `
        <div class="text-center my-4 text-xs text-gray-400 font-bold tracking-wide w-full">
          ꧁・┆✦ ${dateLabel} ✦ ┆・꧂
        </div>
      `;
    }
  }
      
  const getThumb = (url) => (url && url.includes("cloudinary"))     
    ? url.replace("/upload/", "/upload/w_300,c_scale,q_auto,f_auto/")     
    : url;    
      
  let contentHtml = "";    
      
  // --- INCOMING DATA STRUCT ROUTER ROUTINE ---
  if (m.deletedForEveryone) {
    contentHtml = `
      <p class="italic opacity-60 text-sm">
        This message was deleted
      </p>
    `;
  }
  else if (m.type === "text") {
    const safeP = document.createElement("p");
    safeP.className = "whitespace-pre-wrap break-words text-sm";
    safeP.textContent = m.content;
    contentHtml = safeP.outerHTML;
  }
  else if (m.type === "sticker" || m.type === "gif") {
    contentHtml = `
      <div class="flex justify-center p-1">
        <img src="${m.content}"
          alt="media content"
          draggable="false"
          loading="lazy"
          class="max-w-[140px] w-full h-auto object-contain rounded-xl select-none pointer-events-none">
      </div>
    `;
  } 
  else if (m.type === "call") {
    const videoIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-slate-600">
            <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
    `;

    const voiceIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-slate-600">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.435-5.163-3.774-6.598-6.598l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
        </svg>
    `;

    const icon = m.callType === "video" ? videoIcon : voiceIcon;
    const callName = m.callType === "video" ? "Video Call" : "Voice Call";

    // "Call Ended" sits in the center perfectly without pointing fingers
    let statusText = "Active";
    if (m.callStatus === "ended" || m.callStatus === "rejected") {
        statusText = "Call Ended"; 
    } 
    else if (m.callStatus === "missed") {
        statusText = "Missed";
    } 
    else if (m.callStatus) {
        statusText = m.callStatus; 
    }

    const statusColor = (m.callStatus === "missed" || m.callStatus === "rejected") 
        ? "text-red-500 font-medium" 
        : "text-slate-500";

    contentHtml = `
        <div class="flex items-center gap-3 px-4 py-2.5 bg-[#6a4a00] border border-[#6a4a00] rounded-2xl shadow-sm my-1 max-w-xs hover:bg-slate-100 transition-colors duration-200">
            <div class="p-2 bg-[#bebeae] rounded-full shadow-xs flex items-center justify-center border border-[#bebeae]">
                ${icon}
            </div>
            <div class="flex flex-col">
                <span class="text-sm font-semibold text-white">${callName}</span>
                <span class="text-xs capitalize ${statusColor}">${statusText}</span>
            </div>
        </div>
    `;
  }
  else {    
    let mediaItem = "";    
    if (m.type === "image") {    
      mediaItem = `<img src="${getThumb(m.content)}" data-full="${m.content}" data-kind="image" class="clickable-media rounded-xl w-full max-h-64 object-cover cursor-pointer">`;    
    } else if (m.type === "video") {    
      const vThumb = getThumb(m.content).replace(/\.[^/.]+$/, ".jpg");    
      mediaItem = `    
        <div class="relative cursor-pointer clickable-media" data-full="${m.content}" data-kind="video">    
          <div class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl"><span class="text-white text-3xl">▶</span></div>    
          <img src="${vThumb}" class="rounded-xl w-full max-h-64 object-cover">    
        </div>`;    
    } else if (m.type === "audio") {    
      mediaItem = `<button class="clickable-media bg-[#D4AF37] text-black px-4 py-3 rounded-xl text-xs font-bold w-full" data-full="${m.content}" data-kind="audio">🎵 Play Audio</button>`;    
    }    
    
    let noteHtml = "";
    if (m.note) {
      const noteP = document.createElement("p");
      noteP.className = "mt-2 text-sm opacity-90 border-t border-white/10 pt-2";
      noteP.textContent = m.note;
      noteHtml = noteP.outerHTML;
    }
    contentHtml = `<div>${mediaItem}${noteHtml}</div>`;    
  }    
    
  let ticks = "";    
  if (isMe) {    
    if (m.status === "sent") ticks = "✔";    
    else if (m.status === "delivered") ticks = "✔✔";    
    else if (m.status === "seen") ticks = "✔✔";    
  }    
    
  const tickColor = (m.status === "seen") ? "text-blue-400" : "text-gray-400";    
  const dynamicBubbleBg = (m.type === "sticker" || m.type === "gif") 
    ? "bg-transparent shadow-none border-none" 
    : (isMe ? "msg-me" : "msg-them");
    
  const alignmentSide = isMe ? "justify-end" : "justify-start";

  const html = `    
    <div class="flex w-full ${alignmentSide} mb-2 px-2">
      <div class="msg-bubble message-item ${dynamicBubbleBg}" data-id="${messageId}">    
        ${contentHtml}    
        <div class="flex justify-end items-center gap-1 mt-1 opacity-80" style="font-size:9px">
          <span>${time}</span>    
          ${isMe ? `<span class="${tickColor}">${ticks}</span>` : ""}    
        </div>    
      </div>
    </div>`;    
    
  // Smart Scroll Protection Logic:
  // Check if the user is currently looking at the bottom of the chat list
  const isAtBottom = msgList.scrollHeight - msgList.scrollTop <= msgList.clientHeight + 150;

  msgList.insertAdjacentHTML("beforeend", dateHTML + html);    
  
  // Only force automatic scroll if they were already at the bottom
  if (isAtBottom) {
    msgList.scrollTop = msgList.scrollHeight; 
    if (typeof scrollToBottom === "function") {
      scrollToBottom();   
    }
  }
}

*/

/* ========== CLICK HANDLER ========== */
const msgListEl = document.getElementById('msg-list');
if (msgListEl) {
  msgListEl.addEventListener('click', (e) => {    
      const target = e.target.closest('.clickable-media');    
      if (target) {    
          e.stopPropagation(); 
          const url = target.getAttribute('data-full');    
          const type = target.getAttribute('data-kind');    
          if (window.viewFullMedia) window.viewFullMedia(url, type);    
      }    
  });
}




function updateContactAfterMessage(msg) {
  const otherUid = msg.sender === auth.currentUser.uid ? currentChatUser : msg.sender;
  const contact = CONTACTS.find(c => c.uid === otherUid);
  if (!contact) return;

  if (msg.type === "text") {
    contact.lastMessage = toPlainText(msg.content);
  } else if (msg.type === "sticker") {
    contact.lastMessage = "✨ Sticker";
  } else if (msg.type === "gif") {
    contact.lastMessage = "🎬 GIF";
  } else {
    contact.lastMessage = "📎 Attachment";
  }

  contact.lastTime = msg.time;
  renderContacts();
}


function loadChatMeta() {
  const myUid = auth.currentUser.uid;
  const metaRef = ref(rtdb, "chat_meta");

  onValue(metaRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.val();

    CONTACTS.forEach(c => {
      const chatId = getChatId(myUid, c.uid);
      const meta = data[chatId];
      if (!meta) return;

      c.lastMessage = meta.lastMessage || "";
      c.lastTime = meta.lastTime || 0;
      c.unread = meta.unread?.[myUid] || 0;
    });
    renderContacts();
  });
}




/* ========== RENDER MESSAGE ========== */




function scrollToBottom() {
  const msgList = document.getElementById("msg-list");
  if (!msgList) return;

  // Small delay to wait for DOM render
  setTimeout(() => {
    msgList.scrollTop = msgList.scrollHeight;
  }, 50);
}



//window.viewFullMedia = viewFullMedia;


/* ========== send capsule ======== */


async function sendCapsule() {

exploreChat();

    const message =
        document
        .getElementById("capsule-message")
        ?.value
        .trim();

    const date =
        document
        .getElementById("capsule-date")
        ?.value;

    const timeValue =
        document
        .getElementById("capsule-time")
        ?.value;

    if (!message) {
        alert("Please enter a message");
        return;
    }

    if (!date || !timeValue) {
        alert("Please select date and time");
        return;
    }

    if (!currentChatId) return;

    const unlockAt =
        new Date(
            `${date}T${timeValue}`
        ).getTime();

    const myUid =
        auth.currentUser.uid;

    const senderName =
        window.CURRENT_SESSION?.username ||
        "New Message";

    const msgRef =
        push(
            ref(
                rtdb,
                "messages/" + currentChatId
            )
        );

    await set(msgRef, {
        sender: myUid,

        type: "capsule",

        content: message,

        unlockDate: date,

        unlockTime: timeValue,

        unlockAt,

        time: Date.now(),

        status: "sent"
    });

    const chatMetaRef =
        ref(
            rtdb,
            "chat_meta/" + currentChatId
        );

    const metaSnap =
        await get(chatMetaRef);

    let unread =
        metaSnap.exists()
            ? (metaSnap.val().unread || {})
            : {};

    unread[currentChatUser] =
        (unread[currentChatUser] || 0) + 1;

    unread[myUid] = 0;

    await update(chatMetaRef, {
        lastMessage: "🔒 Time Capsule",
        lastTime: Date.now(),
        unread
    });

    await triggerPushNotification(
        currentChatUser,
        senderName,
        "🔒 Sent you a Time Capsule"
    );
}

window.sendCapsule = sendCapsule;

/* ========== SEND TEXT ========== */

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const raw = input.value.trim();
  const text = toPlainText(raw);
  if (!text || !currentChatId) return;

  // 🚀 FIXED: Clear the input and reset the layout IMMEDIATELY here!
  // This makes the UI feel lightning-fast while the server requests process in the background.
  input.value = "";
  input.style.height = "auto"; // Ensures the expanded textarea snaps back to row 1 instantly
  updateChatLayout(false);

  const myUid = auth.currentUser.uid;
  const time = Date.now();
  const senderName = window.CURRENT_SESSION?.username || "New Message";
  
  /* ================= CREATE CHAT IF NOT EXISTS ================= */
  const chatRef = ref(rtdb, "chats/" + currentChatId);
  const chatSnap = await get(chatRef);

  if (!chatSnap.exists()) {
    await createChatIfNotExists(currentChatUser);
  }
  
  // 1. Push Message
  const msgRef = push(ref(rtdb, "messages/" + currentChatId));
  await set(msgRef, {
    sender: myUid,
    type: "text",
    content: text,
    time,
    status: "sent" // NEW
  });

  // 2. Update Meta (WhatsApp Logic)
  const chatMetaRef = ref(rtdb, "chat_meta/" + currentChatId);
  const metaSnap = await get(chatMetaRef);
  let unread = metaSnap.exists() ? (metaSnap.val().unread || {}) : {};

  // Increment receiver's count only if they aren't looking at this chat
  unread[currentChatUser] = (unread[currentChatUser] || 0) + 1;
  unread[myUid] = 0;

  await update(chatMetaRef, {
    lastMessage: toPlainText(text),
    lastTime: time,
    unread
  });

  await triggerPushNotification(currentChatUser, senderName, text);
}

window.sendMessage = sendMessage;

/* ========== FILE PICKER ========== */

function openFilePicker(type) {
  const picker = document.getElementById("file-picker");
  if (!picker) return;
  if (type === "image") picker.accept = "image/*";
  else if (type === "video") picker.accept = "video/*";
  else if (type === "audio") picker.accept = "audio/*";
  else picker.accept = "*/*";
  picker.click();
}

window.openFilePicker = openFilePicker;

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;
  if (typeof showPreview === 'function') {
      showPreview(file);
  }
}

window.handleFileSelect = handleFileSelect;

/* ========== SEND ATTACHMENT ========== */

async function sendAttachment() {
  if (!selectedFile || !currentChatId) return;

  const note = document.getElementById("attach-note")?.value || "";
  const senderName = window.CURRENT_SESSION?.username || "New Message";
  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);


/* ================= CREATE CHAT IF NOT EXISTS ================= */

  const chatRef = ref(rtdb, "chats/" + currentChatId);
  const chatSnap = await get(chatRef);

  if (!chatSnap.exists()) {

    await createChatIfNotExists(currentChatUser);

  }
  
 
  try {
  
  
  /* ================= PRE-UPLOAD OPTIMIZATION ================= */

    // Compress images
    selectedFile = await compressImageBeforeUpload(selectedFile);

    // Optimize videos
    selectedFile = await optimizeVideoBeforeUpload(selectedFile);

    /* ============================================================ */
    // 1. Upload to Cloudinary
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
        method: "POST",
        body: formData
    });

    if (!res.ok) throw new Error("Cloudinary upload failed");

    const data = await res.json();
    const url = data.secure_url;

    // 🛑 VITAL CHECK: If url is missing, stop here to prevent Firebase 'undefined' error
    if (!url) {
        console.error("Upload succeeded but no URL returned.");
        return;
    }

    let type = "file";
    if (selectedFile.type.startsWith("image")) type = "image";
    else if (selectedFile.type.startsWith("video")) type = "video";
    else if (selectedFile.type.startsWith("audio")) type = "audio";

    const time = Date.now();
    const myUid = auth.currentUser.uid;

    // 2. Save to Firebase only if we have a valid URL
    const msgRef = push(ref(rtdb, "messages/" + currentChatId));
    await set(msgRef, {
        sender: myUid,
        type: type,
        content: url, 
        fileName: selectedFile.name,
        note: note,
        time: time
    });

    // 3. Update Chat Meta (Sync unread counts)
    const chatMetaRef = ref(rtdb, "chat_meta/" + currentChatId);
    const metaSnap = await get(chatMetaRef);
    let unread = metaSnap.exists() ? (metaSnap.val().unread || {}) : {};
    
    unread[currentChatUser] = (unread[currentChatUser] || 0) + 1;
    unread[myUid] = 0;

    await update(chatMetaRef, {
        lastMessage: "📎 Attachment",
        lastTime: time,
        unread
    });

    if (typeof closeAttachment === 'function') closeAttachment();
    
    const pushBody = note ? `Sent an ${type}: ${note}` : `Sent an ${type}`;
    triggerPushNotification(currentChatUser, senderName, pushBody);

    if (typeof closeAttachment === 'function') closeAttachment();
    selectedFile = null;
  } catch (err) {
      console.error(" push notification failed");
      console.error("Critical Upload Error:", err);
      alert("Failed to send attachment. Please check your connection.");
  }
}



window.sendAttachment = sendAttachment;







async function markMessagesSeen() {

  if (!currentChatId) return;

  const myUid = auth.currentUser.uid;
  const msgRef = ref(rtdb, "messages/" + currentChatId);

  const snap = await get(msgRef);
  if (!snap.exists()) return;

  snap.forEach(child => {

    const msg = child.val();

    if (msg.sender !== myUid && msg.status !== "seen") {

      update(
        ref(rtdb, `messages/${currentChatId}/${child.key}`),
        { status: "seen" }
      );

    }

  });
}



function redrawMessages() {

  const msgList = document.getElementById("msg-list");
  if (!msgList) return;

  msgList.innerHTML = "";
  lastRenderedDate = null;

  Object.values(MESSAGE_CACHE)
    .sort((a, b) => a.time - b.time)
    .forEach(msg => {
      renderMessageUI(msg);
    });

}


function formatChatDate(timestamp) {

  const d = new Date(timestamp);
  const now = new Date();

  // Remove time
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffDays = Math.floor((today - msgDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

/* ========== INIT ========== */

window.loadUsers = loadUsers;



function renderContacts() {
  const container = document.getElementById("contacts-container");
  if (!container) return;

  container.innerHTML = "";

  CONTACTS.sort((a, b) => (b.lastTime || 0) - (a.lastTime || 0)).forEach(c => {
    let preview = truncateText(c.lastMessage, 25) || "Tap to chat";
    let timeText = c.lastTime ? new Date(c.lastTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    const unreadCount = c.unread || 0;

    const contactHtml = `
      <div
        id="contact-${c.uid}"
        onmousedown="startLongPress(event, '${c.uid}')" 
        onmouseup="cancelLongPress()" 
        ontouchstart="startLongPress(event, '${c.uid}')" 
        ontouchend="cancelLongPress()"
        onclick="selectChat('${c.uid}')"
        class="contact-item flex items-center gap-4 p-5 mb-3 rounded-[2.5rem] cursor-pointer transition-all
       bg-[rgba(255,255,255,0.03)] backdrop-blur-[40px]
       border border-[rgba(255,255,255,0.08)]
       shadow-[0_8px_32px_rgba(0,0,0,0.25)]
       ${activeId === c.uid ? 'bg-[rgba(212,175,55,0.08)] border border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.15)]' : 'hover:bg-[rgba(255,255,255,0.05)]'}"
       
        style="background: rgba(255,255,255,0.02); backdrop-filter: blur(35px) saturate(180%); -webkit-backdrop-filter: blur(35px) saturate(180%);border: 1px solid rgba(255,255,255,0.08);
">

        <div class="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-center font-bold text-gray-500 shrink-0 overflow-hidden">
          ${c.profile_pic 
            ? `<img src="${c.profile_pic.replace('/upload/','/upload/w_120,c_fill,q_auto,f_auto/')}" class="w-full h-full object-cover">` 
            : getInitials(c.username)}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-start mb-0.5">
            <h4 class="font-bold text-sm truncate pr-2 text-white flex items-center">
              ${c.username}
              ${c.verified ? `
<span class="verified-badge">
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#FFD700">
<path d="M12 2l2.4 2.6 3.5-.5.5 3.5L22 10l-1.6 2.4.5 3.5-3.5.5L12 22l-2.4-2.6-3.5.5-.5-3.5L2 12l1.6-2.4-.5-3.5 3.5-.5L12 2z"/>
<path d="M10 13.2l-1.8-1.8-1.2 1.2L10 15.6l6-6-1.2-1.2z" fill="#000"/>
</svg>
</span>
` : ""}
            </h4>
            <span class="text-[11px] text-gray-300 font-bold shrink-0">${timeText}</span>
          </div>
          <div class="flex justify-between items-center">
            <p class="text-xs text-gray-400 truncate italic flex-1 mr-2">${preview}</p>
            ${unreadCount > 0 ? `<div class="bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">${unreadCount}</div>` : ""}
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", contactHtml);
  });
}




function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

window.renderContacts = renderContacts;

/* ===============================
   🚀 READY
================================ */

async function initAppAfterLogin(user) {
  currentUser = user;
  window.IS_CHAT_OPEN = null;
  updateUserPresence(user.uid);
  initNotifications(user.uid);
  loadUsers();
  loadChatMeta();
  showExplore();
  initProfileSystem();
  window.loadEntertainmentFeed();

  // 1. Reference the 'chat_meta' node
  const metaRef = ref(window.rtdb, "chat_meta");
  
  // 2. Fetch all chat metadata once to check if user has history
  const snap = await get(metaRef);
  let hasHistory = false;

  if (snap.exists()) {
    const allChats = snap.val();
    // 3. Check if any chatId contains the current user's UID
    hasHistory = Object.keys(allChats).some(chatId => chatId.includes(user.uid));
  }

  setTimeout(() => {
    // 4. Only show welcome chats if the database shows NO previous history
    if (!hasHistory && CONTACTS.length === 0) {
      console.log("Verified: New user with no history. Showing welcome...");
      showWelcomeChats();
    } else {
      renderContacts();
    }
  }, 1000); 
}




function closeChat() {
  window.IS_CHAT_OPEN = null;
  activeId = null;
  
  renderContacts();
}

window.closeChat = closeChat;




function updateUserPresence(uid) {
  const myStatusRef = ref(window.rtdb, `status/${uid}`);
  const connectedRef = ref(window.rtdb, ".info/connected");

  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      set(myStatusRef, {
        state: "online",
        last_changed: serverTimestamp()
      });

      onDisconnect(myStatusRef).set({
        state: "offline",
        last_changed: serverTimestamp()
      });
    }
  });
}


function formatStatus(statusObj) {
  if (!statusObj) return "Offline";
  if (statusObj.state === "online") return "Online";
  
  const lastSeen = statusObj.last_changed;
  if (!lastSeen) return "Offline";

  const date = new Date(lastSeen);
  const now = new Date();
  const diffInSecs = Math.floor((now - date) / 1000);

  if (diffInSecs < 60) return "Just now";
  if (diffInSecs < 3600) return `${Math.floor(diffInSecs / 60)}m ago`;
  
  const isYesterday = now.getDate() !== date.getDate();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isYesterday) return `Yesterday, ${timeStr}`;
  return `Today, ${timeStr}`;
}








/* ================= IMAGE COMPRESSION ================= */

async function compressImageBeforeUpload(file) {

  return new Promise((resolve, reject) => {

    if (!file.type.startsWith("image/")) {
      resolve(file); // Not image → skip
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.src = url;

    img.onload = () => {

      const canvas = document.createElement("canvas");

      // Max width/height (like WhatsApp)
      const MAX = 1280;

      let w = img.width;
      let h = img.height;

      if (w > h && w > MAX) {
        h *= MAX / w;
        w = MAX;
      } else if (h > MAX) {
        w *= MAX / h;
        h = MAX;
      }

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {

          URL.revokeObjectURL(url);

          if (!blob) {
            resolve(file);
            return;
          }

          const compressed = new File(
            [blob],
            file.name.replace(/\.\w+$/, ".jpg"),
            { type: "image/jpeg" }
          );

          resolve(compressed);

        },
        "image/jpeg",
        0.75 // Quality (0–1)
      );
    };

    img.onerror = () => {
      resolve(file);
    };

  });

}





/* ================= VIDEO OPTIMIZATION ================= */

async function optimizeVideoBeforeUpload(file) {

  if (!file.type.startsWith("video/")) return file;

  // For now: just limit big videos
  const MAX_MB = 25;

  if (file.size / 1024 / 1024 > MAX_MB) {
    alert("Video too large. Please select under 25MB.");
    throw new Error("Video too big");
  }

  return file;
}




// 1. Global setting to toggle the feature
window.allowCustomUI = true; 

/**
 * Safely renders user content.
 * @param {string} rawHTML - The message sent by the user.
 * @returns {string} - Sanitized HTML or plain text.
 */
function getSafeMessageHTML(rawHTML) {
    // If the user turned off custom UI, return as plain text
    if (!window.allowCustomUI) {
        const temp = document.createElement('div');
        temp.textContent = rawHTML;
        return temp.innerHTML;
    }

    // 2. Professional Sanitization
    // This allows tags like <div>, <b>, <span> and Tailwind classes (attributes)
    // but COMPLETELY strips <script>, onclick, and other JS triggers.
    const cleanHTML = DOMPurify.sanitize(rawHTML, {
        ALLOWED_TAGS: ['div', 'span', 'b', 'i', 'p', 'h1', 'h2', 'h3', 'img', 'br', 'ul', 'li'],
        ALLOWED_ATTR: ['class', 'style', 'src', 'alt']
    });

    // 3. Containment (CSS Isolation)
    // We wrap the user HTML in a div with 'overflow-hidden' and 'max-w-full'
    // to ensure their UI doesn't break your chat bubble layout.
    return `<div class="user-custom-ui-wrapper overflow-hidden break-words max-w-full">
                ${cleanHTML}
            </div>`;
}

// Function for your settings toggle
window.toggleHTMLRendering = function(isEnabled) {
    window.allowCustomUI = isEnabled;
    console.log("HTML Rendering is now:", window.allowCustomUI ? "ON" : "OFF");
    // Optionally: re-render the current chat list here to apply changes immediately
};






/* ===============================
   XSS Protection System
================================ */

/* ===+++++++++++++++++++++++++++-
   MAXIMUM SECURITY MODE
   (Plain Text Only)
-++++++++++++++++++++++++++++++=== */

function toPlainText(input) {
    if (!input) return "";

    const div = document.createElement("div");
    div.textContent = input;

    return div.innerText;
}


function truncateText(input, limit = 16) {
    if (!input) return "";

    // 1. Clean the text first (prevents code leaks)
    const tempDiv = document.createElement("div");
    tempDiv.textContent = input; 
    let cleanText = tempDiv.innerText;

    // 2. Trim and add dots if it exceeds the limit
    if (cleanText.length > limit) {
        return cleanText.substring(0, limit).trim() + "...";
    }

    return cleanText;
}




/* ===== Message Action System ===== */










/* ===============================
   🔔 PHANTOM NOTIFICATION SYSTEM
================================ */
// 1. Tracks which chat window the user is currently looking at
window.IS_CHAT_OPEN = null; 

// 2. Holds the current user's UID for easy access
window.CURRENT_USER_ID = null;

// 3. Optional: Tracks if the app tab itself is active/focused
window.IS_TAB_FOCUSED = true;

const VAPID_KEY = "BMCZdkBAVeN6IW67X3uofsSmc0vyVQDJJMFFJV53MC29Jr6Te3C0rTEHSWc-aye6zHzY4yGVqVS1IfusA2N4PRk";
const BACKEND_URL = "https://phantom-messaging-backend--ventacorporatio.replit.app"; // <--- CHANGE TO YOUR ACTUAL REPLIT URL

// 1. Setup & Permission
async function initNotifications(uid) {
  if (!("serviceWorker" in navigator)) return;

  try {
    // Register the modern service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      // Store token in RTDB so others can find this user
      await set(ref(window.rtdb, `fcm_tokens/${uid}`), token);
      console.log("Phantom Hub: Push system active");
    }
  } catch (err) {
    console.error("FCM Setup Error:", err);
  }
}

// 2. Foreground Listener (When the app is open)
onMessage(messaging, (payload) => {
  const senderId = payload.data?.senderId;

  // Don't show a popup if the user is already in the chat
  if (window.IS_CHAT_OPEN === senderId) return;

  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon.png"
  });
});

// 3. Trigger (Call this inside your sendMessage function)
async function triggerPushNotification(targetUid, senderName, messageText) {
  // Logic: Only send push if receiver isn't currently looking at the sender's chat
  if (window.IS_CHAT_OPEN === targetUid) return; 

  const statusSnap = await get(ref(window.rtdb, `status/${targetUid}`));
  const status = statusSnap.val();

  // Send push only if user is offline or away
  if (status?.state !== "online") {
    const tokenSnap = await get(ref(window.rtdb, `fcm_tokens/${targetUid}`));
    const token = tokenSnap.val();

    if (token) {
      // FIX: Added "/send" to the URL
      await fetch(`${BACKEND_URL}/send`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          title: senderName,
          body: messageText,
          // Extra data to help your foreground listener
          data: { senderId: window.CURRENT_USER_ID } 
        })
      });
    }
  }
}














/*// Register the Service Worker and get the FCM Token
async function requestNotificationPermission(uid) {
  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging, {
      vapidKey: "YOUR_PUBLIC_VAPID_KEY", // Get this from Firebase Console > Project Settings > Cloud Messaging
      serviceWorkerRegistration: registration
    });

    if (token) {
      // Save token to RTDB under the user's UID
      await set(ref(window.rtdb, `fcm_tokens/${uid}`), token);
      console.log("Notification system active for user:", uid);
    }
  } catch (err) {
    console.error("Notification registration failed:", err);
  }
}


async function sendMessage(text) {
  const recipientUid = window.IS_CHAT_OPEN;
  // ... code to push message to RTDB ...
  
  // After saving:
  await triggerPushNotification(recipientUid, "Your Name", text);
}
*/



///delete system 

let pressTimer;
let selectedChatForAction = null;

function startLongPress(e, uid) {
  // Prevent ghost clicks
  selectedChatForAction = uid;
  pressTimer = window.setTimeout(() => {
    showActionFab(uid);
  }, 800); // 800ms for long press
}

function cancelLongPress() {
  clearTimeout(pressTimer);
}

function showActionFab(uid) {
  if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback

  let panel = document.getElementById("action-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "action-panel";
    panel.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md px-6";
    document.body.appendChild(panel);
  }

  panel.innerHTML = `
    <div class="w-full max-w-xs bg-black/40 border border-[#D4AF37]/30 p-6 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl animate-in">
      <h3 class="text-white font-bold text-center mb-2">Manage Chat</h3>
      <p class="text-[10px] text-gray-400 text-center mb-6">Choose how you want to remove this conversation.</p>
      
      <div class="flex flex-col gap-3">
        <button onclick="deleteChatData('${uid}')" 
          class="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          Delete for Me
        </button>

        <button onclick="deleteChatDataFromBothSide('${uid}')" 
          class="w-full py-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6l3 0"></path><path d="M14 11v6m-4-6v6"></path></svg>
          Delete for Everyone
        </button>
        
        <button onclick="closeActionPanel()" class="w-full mt-2 py-3 text-gray-500 text-sm font-medium active:opacity-50">
          Cancel
        </button>
      </div>
    </div>
  `;
  panel.style.display = "flex";
}


function closeActionPanel() {
  const panel = document.getElementById("action-panel");
  if (panel) panel.style.display = "none";
  selectedChatForAction = null;
}

// --- OPTION 1: DELETE FOR ME (1 Confirmation) ---
async function deleteChatData(otherUid) {
  if (!confirm("Remove this chat from your list? The other person will still have the history.")) return;

  const myUid = auth.currentUser.uid;
  const chatId = getChatId(myUid, otherUid);

  try {
    await update(ref(window.rtdb, `chat_meta/${chatId}/clearedBy/${myUid}`), {
        timestamp: Date.now(),
        hidden: true
    });

    // Immediate UI Update
    CONTACTS = CONTACTS.filter(c => c.uid !== otherUid);
    renderContacts();
    if (activeId === otherUid) closeChat(); 
    closeActionPanel();
  } catch (err) {
    console.error("Delete for me failed:", err);
  }
}

// --- OPTION 2: DELETE FROM BOTH SIDES (2 Confirmations) ---
async function deleteChatDataFromBothSide(otherUid) {
  // First Confirmation
  if (!confirm("WARNING: This will permanently delete messages for BOTH users. Continue?")) return;
  
  // Second Confirmation (The "Are you sure" layer)
  if (!confirm("This action cannot be undone. Are you absolutely sure?")) return;

  const myUid = auth.currentUser.uid;
  const chatId = getChatId(myUid, otherUid);

  try {
    // 1. Wipe all messages in this thread
    await remove(ref(window.rtdb, `messages/${chatId}`));

    // 2. Wipe the metadata (Removes it from everyone's sidebar)
    await remove(ref(window.rtdb, `chat_meta/${chatId}`));

    // 3. Update local state
    CONTACTS = CONTACTS.filter(c => c.uid !== otherUid);
    renderContacts();
    if (activeId === otherUid) {
        document.getElementById("msg-list").innerHTML = "";
        document.getElementById("h-name").innerText = "Select a chat";
        activeId = null;
    }

    closeActionPanel();
    alert("Conversation wiped for both sides.");
  } catch (error) {
    console.error("Nuclear delete failed:", error);
    alert("Error: Could not reach the database.");
  }
}




window.deleteChatDataFromBothSide = deleteChatDataFromBothSide;
window.startLongPress = startLongPress;

window.deleteChatData = deleteChatData;
window.cancelLongPress = cancelLongPress;

window.closeActionPanel = closeActionPanel;

//==================================================
//   Unified Attachment & Media Panel Engine Pipeline
//==================================================

// 1. Open Panel Routine - Renders the UI structures dynamically
window.openPanel = function(panelId) {
    if (panelId !== 'attachments') return;
    
    const body = document.getElementById("panel-body") || document.querySelector(".panel-body");
    if (!body) return;

    body.innerHTML = `
        <h3 class="text-[#D4AF37] text-xl font-bold mb-4 tracking-tight">Send Media</h3>
        
        <!-- Tab Swapper Control Header Components -->
        <div class="flex gap-4 mb-4 border-b border-white/10 pb-2">
            <button onclick="switchAttachmentTab('stickers')" id="btn-tab-stickers" class="text-xs font-bold uppercase tracking-wider pb-1 border-b-2 border-[#D4AF37] text-[#D4AF37]">Stickers</button>
            <button onclick="switchAttachmentTab('gifs')" id="btn-tab-gifs" class="text-xs font-bold uppercase tracking-wider pb-1 text-gray-400">GIFs</button>
        </div>

        <!-- Tab 1: Stickers Content Target Body Grid -->
        <div id="tab-stickers" class="grid grid-cols-4 gap-3 max-h-[40vh] overflow-y-auto pr-1">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f606/512.webp" class="cursor-pointer hover:scale-110 transition-transform w-full h-auto" onclick="sendCustomMedia('https://fonts.gstatic.com/s/e/notoemoji/latest/1f606/512.webp', 'sticker')">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.webp" class="cursor-pointer hover:scale-110 transition-transform w-full h-auto" onclick="sendCustomMedia('https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.webp', 'sticker')">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp" class="cursor-pointer hover:scale-110 transition-transform w-full h-auto" onclick="sendCustomMedia('https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp', 'sticker')">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp" class="cursor-pointer hover:scale-110 transition-transform w-full h-auto" onclick="sendCustomMedia('https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp', 'sticker')">
        </div>

        <!-- Tab 2: GIF Engine Content Search Container Wrapper -->
        <div id="tab-gifs" class="hidden space-y-3">
            <input type="text" id="gif-search" placeholder="Search GIFs & hit Enter..." class="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]" onkeyup="searchGifs(event)">
            <div id="gif-results" class="grid grid-cols-2 gap-2 max-h-[35vh] overflow-y-auto"></div>
        </div>
    `;
};

// 2. Tab Switcher Routine - Controls visibility states & button styles layout configuration (with Fallback Engine)
window.switchAttachmentTab = function(tabName) {
    // Scan DOM for primary IDs or older variations
    const tabStickers = document.getElementById('tab-stickers') || document.getElementById('stickers');
    const tabGifs = document.getElementById('tab-gifs') || document.getElementById('gifs');
    const btnStickers = document.getElementById('btn-tab-stickers') || document.getElementById('btn-stickers') || document.getElementById('btnStickers');
    const btnGifs = document.getElementById('btn-tab-gifs') || document.getElementById('btn-gifs') || document.getElementById('btnGifs');
    
    // Safety exit block guard
    if (!tabStickers || !tabGifs) {
        console.warn("Tab view elements are missing from the DOM. Make sure openPanel('attachments') has rendered first.");
        return;
    }

    if (tabName === 'stickers') {
        tabStickers.classList.remove('hidden');
        tabGifs.classList.add('hidden');
        
        if (btnStickers) btnStickers.className = "text-xs font-bold uppercase tracking-wider pb-1 border-b-2 border-[#D4AF37] text-[#D4AF37]";
        if (btnGifs) btnGifs.className = "text-xs font-bold uppercase tracking-wider pb-1 text-gray-400";
    } else {
        tabStickers.classList.add('hidden');
        tabGifs.classList.remove('hidden');
        
        if (btnStickers) btnStickers.className = "text-xs font-bold uppercase tracking-wider pb-1 text-gray-400";
        if (btnGifs) btnGifs.className = "text-xs font-bold uppercase tracking-wider pb-1 border-b-2 border-[#D4AF37] text-[#D4AF37]";
    }
};

// 3. GIF Database Query Mockup Engine Parsing routine
window.searchGifs = async function(e) {
    if (e && e.key !== 'Enter') return;
    const query = e && e.target ? e.target.value.trim() : '';

    const resultsContainer = document.getElementById('gif-results');
    if (!resultsContainer) return;
    
    // Define the full set of 60 standard GIFs
    const mockGifs = [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/mdJ6Bf3QdAjm/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/l3q2zVr6cu95nF6O4/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/26vUxJ9qbxmSSwZiw/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/cuw650f900W88/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/BC36vO7V19O80/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/XreQmk7ETC7TT/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/11sBLVxNs7v6WA/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/yr7n0u3qzO9nG/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/8vQSQ3cNXuCHu/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/13CoXDiaCcC9k4/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/EBybN5uP18unm/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/3o72F7YT6s0EHFIabK/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/SreAp5hwegg92/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/Ju7l5y9osyymQ/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/7kn27lnYSAE9O/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/G96fMCOvNscb6/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/VexAmVJJCg3qE/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/3o6Zt481isntCYZ3Ik/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/oGO1MPAbQBj3y/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/K3RxMSrERT8iI/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/l0HlUUBlGEshWB4Vq/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/QMHoU66sBXqqLqYvGO/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/l41YtZOb9EUwXvNfO/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/13GKP7xvoMGieA/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/HteV6g0QTNqsM/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/10UUe8ZsLnaqwo/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/pa3MhE07lsAsE/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/ICOgUNjpvO0PC/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/wjBMdDqiDxZ6w/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/g9582DNuQppxC/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/26AHAw0aMmWw74LcI/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/jUwpNzg9IcyrK/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/XgXyfLgsf08yA/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/13HgwGsXF0aiGY/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/14uQ3cOFteAILK/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/eovgulTFlAZ9K/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/B2vBunhgt9Pc4/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/VwzT9MQLctAhO/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/5fHy7kLCHfKLm/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/f31DK1KpG73I4/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/9FrCkvvO700co/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/L7NODns3TCFAY/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/K8l0bIAt3ZGy4/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/h55EUEsYY927m/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/3o7TKoWXm3okO1kgHC/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/d27IAKEWUKv2a7ms/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/uY0zZnffVZkwM/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/NRW2yP1aoY57W/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/N1XPoPIltfBEA/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/yrKKAgFvevEWs/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/l4KhQo2MESJkc6g8w/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/xTiN0IuPQxOCf5OfXa/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/gZuxOq7ZCzMQg/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/xT9IgzoKnwFNmISR8I/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/pS9mmNJvNzwS4/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/l2JhORT5IFv6FdbeE/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/Lp41xve9G19O0G5n4R/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/7YitKw87u6Fm6n7M6b/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/HwzH8Z3FosNkA/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B5am15Ynd5YWx2amM1amN1eW11b3Z0dzB2ZzB2ZzB2ZzB2ZzB2ZzB2/w6v8ZNuCJC7v2/giphy.gif"
    ];
    
    // Filter down array if query string exists
    const filteredGifs = query ? mockGifs.filter(url => url.toLowerCase().includes(query.toLowerCase())) : mockGifs;
    
    if (query) {
        resultsContainer.innerHTML = `<div class="text-[10px] text-[#D4AF37] col-span-2 animate-pulse text-center py-4">Querying Database Contexts...</div>`;
    }
    
    try {
        if (filteredGifs.length === 0) {
            resultsContainer.innerHTML = `<div class="text-[10px] text-gray-500 col-span-2 text-center py-4">No matching GIFs found.</div>`;
            return;
        }
        resultsContainer.innerHTML = filteredGifs.map(url => `
            <img src="${url}" class="w-full h-24 object-cover rounded-xl cursor-pointer hover:scale-[1.02] transition-transform" onclick="sendCustomMedia('${url}', 'gif')">
        `).join('');
    } catch (err) {
        resultsContainer.innerHTML = `<div class="text-[10px] text-red-500 col-span-2 text-center py-4">Search operation anomaly detected.</div>`;
    }
};

// 4. Realtime Database Message Transmission Routine
window.sendCustomMedia = async function(url, mediaType) {
    if (!url || !currentChatId) return;

    const myUid = auth.currentUser.uid;
    const time = Date.now();
    const senderName = window.CURRENT_SESSION?.username || "New Message";

    try {
        const chatRef = ref(rtdb, "chats/" + currentChatId);
        const chatSnap = await get(chatRef);

        if (!chatSnap.exists()) {
            await createChatIfNotExists(currentChatUser);
        }

        const msgRef = push(ref(rtdb, "messages/" + currentChatId));
        await set(msgRef, {
            sender: myUid,
            type: mediaType, 
            content: url, 
            time, 
            status: "sent" 
        });

        const chatMetaRef = ref(rtdb, "chat_meta/" + currentChatId);
        const metaSnap = await get(chatMetaRef);
        let unread = metaSnap.exists() ? (metaSnap.val().unread || {}) : {};

        unread[currentChatUser] = (unread[currentChatUser] || 0) + 1;
        unread[myUid] = 0;

        await update(chatMetaRef, {
            lastMessage: mediaType === "sticker" ? "✨ Sticker" : "🎬 GIF",
            lastTime: time,
            unread
        });

        await triggerPushNotification(currentChatUser, senderName, `Sent a ${mediaType}`);

        if (typeof closePanel === 'function') {
            closePanel(); 
        } else if (typeof closeActionPanel === 'function') {
            closeActionPanel(); 
        } else {
            const panel = document.getElementById("action-panel") || document.getElementById("attachment-panel");
            if (panel) panel.style.display = "none";
        }

    } catch (err) {
        console.error("Failed to execute database push sequence operation:", err);
    }
};


















