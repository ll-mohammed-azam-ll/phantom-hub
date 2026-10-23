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
  serverTimestamp,
  set,
  get,
  remove,
  off,
  update,
  onDisconnect
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

export const UPLOAD_PRESET = "YOUR_UNSIGNED_PRESET";


/* ===============================
   🔥 FIREBASE INIT
================================ */

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const messaging = getMessaging(app);
// MAKE DATABASE GLOBAL
window.rtdb = getDatabase(app);

let currentUser = null;
let panelOpen = false;


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
   🔐 AUTH
================================ */

document.addEventListener("DOMContentLoaded", () => {

  // Protect page
onAuthStateChanged(auth, (user) => {

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

  initAppAfterLogin(user);

});

});









const handleLogout = () => {
  signOut(auth)
    .then(() => {
      // Sign-out successful.
      console.log("User logged out");
      // Redirect to login page or refresh
      window.location.href = "ooooo.html"; 
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
      <div class="list-item flex items-center gap-3 p-3 bg-white/5 rounded-2xl">

        <div class="flex-1 text-sm font-bold flex items-center">
  <div class="flex items-center gap-3 flex-1">

  <div class="w-9 h-9 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center text-xs font-bold">
    ${
      user.profile_pic
      ? `<img src="${user.profile_pic}" class="w-full h-full object-cover">`
      : (user.username || "U")[0]
    }
  </div>

  <span>
    ${user.username || "Unknown"}
  </span>

</div>
    ${user.verified ? `
    <span class="verified-badge">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#3B82F6">
        <path d="M12 2l2.4 2.6 3.5-.5.5 3.5L22 10l-1.6 2.4.5 3.5-3.5.5L12 22l-2.4-2.6-3.5.5-.5-3.5L2 12l1.6-2.4-.5-3.5 3.5-.5L12 2z"/>
        <path d="M10 13.2l-1.8-1.8-1.2 1.2L10 15.6l6-6-1.2-1.2z" fill="white"/>
      </svg>
    </span>
  ` : ""}
</divv>
        <button
          onclick="toggleFollow('${uid}')"
          class="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold">

          ${following ? "Following" : "Follow"}

        </button>

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



//########___4to open a chat inbox of a specific non user_____#########async function openChat(uid) {
  window.IS_CHAT_OPEN = uid;
  if (!uid) return;

  currentChatUser = uid;

  const myUid = auth.currentUser.uid;
  currentChatId = getChatId(myUid, uid);

  // Fetch user profile
  const snap = await get(ref(rtdb, "global_users/" + uid));

  if (snap.exists()) {
    const user = snap.val();

    const pfp = user.profile_pic
      ? `<img src="${user.profile_pic}" class="w-7 h-7 rounded-full object-cover">`
      : `<div class="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-xs">${(user.username || "U")[0]}</div>`;

    document.getElementById("h-name").innerHTML = `
      <div class="flex items-center gap-2">
        ${pfp}
        <span>${user.username || "Unknown"}</span>

        ${user.verified ? `
          <span class="verified-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#3B82F6">
              <path d="M12 2l2.4 2.6 3.5-.5.5 3.5L22 10l-1.6 2.4.5 3.5-3.5.5L12 22l-2.4-2.6-3.5.5-.5-3.5L2 12l1.6-2.4-.5-3.5 3.5-.5L12 2z"/>
              <path d="M10 13.2l-1.8-1.8-1.2 1.2L10 15.6l6-6-1.2-1.2z" fill="white"/>
            </svg>
          </span>
        ` : ""}
      </div>
    `;
  }

  // Open chat window
  selectChat(uid);
}

window.openChat = openChat;nChat;

  
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

let currentChatId = null;
let currentChatUser = null;

let selectedFile = null;

let MESSAGE_CACHE = {};     // Stores messages for realtime updates
let lastRenderedDate = null; // Stores last date separator


/* ========== CHAT ID ========== */

function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}


/* ========== LOAD USERS ========== */

/* ========== LOAD USERS ========== */
function loadUsers() {
  const myUid = auth.currentUser.uid;
  const metaRef = ref(rtdb, "chat_meta");
  
  onValue(metaRef, async (snap) => {
    if (!snap.exists()) return;

    const chats = snap.val();
    const usersSnap = await get(ref(rtdb, "global_users"));
    const users = usersSnap.val() || {};

    let needsFullRender = CONTACTS.length === 0;

    for (const chatId in chats) {
      if (!chatId.includes(myUid)) continue;

      const [uid1, uid2] = chatId.split("_");
      const otherUid = uid1 === myUid ? uid2 : uid1;
      const meta = chats[chatId];
      const user = users[otherUid];

      if (!user) continue;

      // --- ADDED THIS LINE HERE ---
      // Check if the other user is currently typing
      const isTyping = meta.typing && meta.typing[otherUid] === true;

      let contact = CONTACTS.find(c => c.uid === otherUid);

      if (contact) {
        // Update data if lastTime, unread, OR typing status changed
        if (contact.lastTime !== meta.lastTime || 
            contact.unread !== (meta.unread?.[myUid] || 0) || 
            contact.isTyping !== isTyping) {
          
          contact.lastMessage = meta.lastMessage || "";
          contact.lastTime = meta.lastTime || 0;
          contact.unread = meta.unread?.[myUid] || 0;
          contact.isTyping = isTyping; // Save state
          
          updateSingleContactUI(otherUid); 
        }
      } else {
        CONTACTS.push({
          uid: otherUid,
          ...user,
          unread: meta.unread?.[myUid] || 0,
          lastMessage: meta.lastMessage || "",
          lastTime: meta.lastTime || 0,
          isTyping: isTyping // Save state
        });
        needsFullRender = true;
      }
    }

    if (needsFullRender) {
      renderContacts();
    }
  });
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
  return  ck";
  
  
  activeId = uid;
  currentChatUser = uid;
  const myUid = auth.currentUser.uid;
  currentChatId = getChatId(myUid, uid);
  
  
  // ✅ TARGET THE HEAD  const contact = CONTACTS.find(c => c.uid === uid);
  if (contact) {
    // Update the Username
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
`;`;

  }

    
    // Listen for the OTHER user's live status
    onValue(ref(window.rtdb, `status/${uid}`), (snap) => {
      const status = snap.val();
      // Target the <p> tag right after h-name
      const statusElement = document.querySelector("#h-name").nextElementSibling;
      
      
      
      if (statusElement) {
        statusElement.innerText = formatStatus(status);
        // Change color based on state
        statusElement.style.color = (status?.state === "online") ? "#4ADE80" : "#D4AF37";
      }
    });
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

  loadMessagesFromFirebase();
  markMessagesSeen();
  

// Mark again when screen gains focus
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
const typingRef = ref(window.rtdb, `chat_meta/${currentChatId}/typing/${uid}`);
onValue(typingRef, (snapshot) => {
    const isTyping = snapshot.val() === true;
    const container = document.getElementById("msg-list");
    let indicator = document.getElementById("typing-indicator");

    if (isTyping) {
        if (!indicator) {
            indicator = document.createElement("div");
            indicator.id = "typing-indicator";
            indicator.className = "flex mb-4";
            indicator.innerHTML = `
                <div class="msg-them typing-dots">
                    <span></span><span></span><span></span>
                </div>`;
            container.appendChild(indicator);
            container.scrollTop = container.scrollHeight;
        }
    } else if (indicator) {
        indicator.remove();
    }
});

  
  
  
  renderContacts();
}


window.selectChat = selectChat;
window.renderContacts = renderContacts;



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

  `";  
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

  `; ";
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

  const msgRef = ref(rtdb, "messages/" + currentChatId);

  // Remove old listeners to prevent memory leaks and "zombie" UI updates
  off(msgRef);

  const myUid = auth.currentUser.uid;
  const msgList = document.getElementById("msg-list");

  // Reset UI + cache
  if (msgList) msgList.innerHTML = "";
  lastRenderedDate = null;
  MESSAGE_CACHE = {};

  /* ================= NEW MESSAGE ================= */
  onChildAdded(msgRef, async (snap) => {
    const msg = snap.val();
    const key = snap.key;

    // 🛑 BUG FIX 1: Prevent duplicates
    if (MESSAGE_CACHE[key]) return;

    // 🛑 BUG FIX 2: CONTEXT GUARD (Prevents Data Leaks & Blinking)
    // Verify this message belongs to the chat currently open on the screen
    const expectedChatId = getChatId(myUid, (msg.sender === myUid ? currentChatUser : msg.sender));
    if (expectedChatId !== currentChatId) return;

    // Save in cache with ID
    MESSAGE_CACHE[key] = { ...msg, id: key };

    // ✅ Mark delivered / seen (LIVE FIX)
    if (msg.sender !== myUid && msg.status === "sent") {
      if (window.IS_CHAT_OPEN === currentChatUser) {
        await update(
          ref(rtdb, `messages/${currentChatId}/${key}`),
          { status: "seen" }
        );
      } else {
        await update(
          ref(rtdb, `messages/${currentChatId}/${key}`),
          { status: "delivered" }
        );
      }
    }

    // Render the message only if it passed the Context Guard
    renderMessageUI(MESSAGE_CACHE[key]);
    updateContactAfterMessage(msg);

    // ✅ Reset unread if open
    if (window.IS_CHAT_OPEN === (msg.sender === myUid ? currentChatUser : msg.sender)) {
      const chatMetaRef = ref(rtdb, "chat_meta/" + currentChatId);
      const metaSnap = await get(chatMetaRef);
      let unread = metaSnap.val()?.unread || {};
      if (unread[myUid] !== 0) {
          unread[myUid] = 0;
          await update(chatMetaRef, { unread });
      }
    }
  });

  /* ================= STATUS / EDIT UPDATE ================= */
  onChildChanged(msgRef, (snap) => {
    const msg = snap.val();
    const key = snap.key;

    // Only update if the message exists in the current window's cache
    if (!MESSAGE_CACHE[key]) return;

    // 🛑 BUG FIX 3: Anti-Flicker check
    if (MESSAGE_CACHE[key].status === msg.status) return;

    // Update cache
    MESSAGE_CACHE[key] = { ...msg, id: key };

    // Repaint chat
    redrawMessages();
  });
}









/* ========== RENDER MESSAGE UI (IMPROVED) ========== */
function renderMessageUI(m) {    
  const msgList = document.getElementById("msg-list");    
  if (!msgList || !m.content) return;    
  
  // 🛑 BUG FIX 3: Check DOM to ensure this ID doesn't already exist on screen
  const messageId = m.id || m.time;
  if (document.querySelector(`[data-id="${messageId}"]`)) return;
    
  const isMe = m.sender === auth.currentUser.uid;    
  const time = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });    

  /* ========== ✅ DATE SEPARATOR ========== */
  const dateLabel = formatChatDate(m.time);
  let dateHTML = "";

  if (dateLabel !== lastRenderedDate) {
    lastRenderedDate = dateLabel;
    dateHTML = `
      <div class="text-center my-4 text-xs text-gray-400 font-bold tracking-wide">
        ──────── ${dateLabel} ────────
      </div>
    `;
  }
    
  const getThumb = (url) => (url && url.includes("cloudinary"))     
    ? url.replace("/upload/", "/upload/w_300,c_scale,q_auto,f_auto/")     
    : url;    
    
  let contentHtml = "";    
    
  if (m.type === "text") {    
    const safeP = document.createElement("p");
    safeP.className = "whitespace-pre-wrap break-words text-sm";
    safeP.textContent = m.content;
    contentHtml = safeP.outerHTML;
  } else {    
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
    
  const tickColor = (m.status === "seen") ? "text-black-900" : "text-gray-700";    
    
  const html = `    
    <div class="msg-bubble message-item ${isMe ? "msg-me" : "msg-them"}"
     data-id="${messageId}" flex flex-col mb-0">    
      ${contentHtml}    
      <div class="flex justify-end items-center gap-1 mt-1 text-9px opacity-60">
        <span>${time}</span>    
        ${isMe ? `<span class="${tickColor}">${ticks}</span>` : ""}    
      </div>    
    </div>`;    
    
  msgList.insertAdjacentHTML("beforeend", dateHTML + html);    
  msgList.scrollTop = msgList.scrollHeight; 
   scrollToBottom();   
}   

/* ========== CLICK HANDLER ========== */
document.getElementById('msg-list').addEventListener('click', (e) => {    
    const target = e.target.closest('.clickable-media');    
    if (target) {    
        e.stopPropagation(); 
        const url = target.getAttribute('data-full');    
        const type = target.getAttribute('data-kind');    
        if (window.viewFullMedia) window.viewFullMedia(url, type);    
    }    
});





function updateContactAfterMessage(msg) {
  const otherUid = msg.sender === auth.currentUser.uid ? currentChatUser : msg.sender;
  const contact = CONTACTS.find(c => c.uid === otherUid);
  if (!contact) return;

  if (msg.type === "text") {
    contact.lastMessage = toPlainText(msg.content);
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




/* ========== SEND TEXT ========== */

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const raw = input.value.trim();
  const text = toPlainText(raw);
  if (!text || !currentChatId) return;

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
  // We check the recipient's presence on the database or simple increment (standard logic)
  // To be exactly like WhatsApp, we increment and the recipient's local 'selectChat' or 'loadMessages' will reset it.
  unread[currentChatUser] = (unread[currentChatUser] || 0) + 1;
  unread[myUid] = 0;

  await update(chatMetaRef, {
  lastMessage: toPlainText(text),
  lastTime: time,
  unread
});


  await triggerPushNotification(currentChatUser, senderName, text);
  
  input.value = "";
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
    let timeText = "";
    if (c.lastTime) {
      timeText = new Date(c.lastTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
      });
    }

    const unreadCount = c.unread || 0;

    container.innerHTML += `
      <div
        onclick="selectChat('${c.uid}')"
        class="flex items-center gap-4 p-5 rounded-[2.5rem]
               cursor-pointer transition-all
               ${activeId === c.uid
                 ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20'
                 : 'hover:bg-white/5 border border-transparent'}">

<div
  class="w-12 h-12 rounded-2xl bg-neutral-900
         border border-white/5 flex
         items-center justify-center
         font-bold text-gray-500 shrink-0 overflow-hidden">

  ${
    c.profile_pic
      ? `<img src="${c.profile_pic}" class="w-full h-full object-cover">`
      : getInitials(c.username)
  }

</div>}

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
            <span class="text-[10px] text-gray-300 font-bold shrink-0 whitespace-nowrap">
              ${timeText}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <p class="text-xs text-gray-400 truncate italic flex-1 mr-2">
              ${preview}
            </p>
            ${
              unreadCount > 0
                ? `<div class="unread-badge shrink-0 bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">${unreadCount}</div>`
                : `<div class="w-4 h-4"></div>`
            }
          </div>
        </div>
      </div>
    `;
  });
}




function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

window.renderContacts = renderContacts;

/* ===============================
   🚀 READY
================================ async function initAppAfterLogin(user) {
  currentUser = user;
  window.IS_CHAT_OPEN = null;
  updateUserPresence(user.uid);
  initNotifications(user.uid)
  loadUsers();
  loadChatMeta(
  renderContacts();  );
  showExplore();
  initProfileSyste0); 
}   
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








