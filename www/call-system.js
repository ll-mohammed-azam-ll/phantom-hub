// ========================================
// IMPORT CONFIG & DEPENDENCIES
// ========================================

// 1. Read initialized variables directly from the window context to break the circular import loop
const rtdb = window.rtdb || null;
const auth = window.auth || null;
let currentChatUser = window.currentChatUser || null;

let currentChatId = window.currentChatId || null;


// 2. Import the database functions from the Firebase CDN
import { ref, set, onValue, off, update, push, get, onChildAdded } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";


window.get = get;
window.ref = ref;
// =========================================================================
// 2. GLOBAL CALL SESSION VARIABLES
// =========================================================================
let activeCallId = null;
let activeCallType = null;
let peerConnection = null;
let localStream = null;
let remoteStream = null;
let iceCandidatesQueue = [];  
let callNodeListener = null;  
let globalIncomingRef = null; 

let callTimerInterval = null;
let callStartTimestamp = null;

let offerListener = null;
let answerListener = null;

let isMicMuted = false;
let isSpeakerEnabled = true;
let isCameraEnabled = true;
let currentFacingMode = "user";

let activeCallerName = "";
let activeCallerProfilePic = "";




// =========================================================================
// logic for sending call message in chat
// ========================================================================

function getChatId(uid1, uid2) {
    return [uid1, uid2].sort().join("_");
}


let activeOtherUser = null;

async function sendCallMessage(
    otherUid,
    callType,
    callStatus
) {


    try {

        const myUid = auth.currentUser.uid;
        const chatId = getChatId(myUid, otherUid);

        const time = Date.now();

        const msgRef = push(
            ref(rtdb, `messages/${chatId}`)
        );

        await set(msgRef, {
            sender: myUid,
            type: "call",
            callType: callType, // audio/video
            callStatus: callStatus, // ended/missed/rejected
            content: "Call",
            time: time,
            status: "sent"
        });

        const chatMetaRef = ref(
            rtdb,
            `chat_meta/${chatId}`
        );

        const metaSnap = await get(
            chatMetaRef
        );

        let unread = {};

        if (metaSnap.exists()) {
            unread =
                metaSnap.val().unread || {};
        }

        unread[otherUid] =
            (unread[otherUid] || 0) + 1;

        unread[myUid] = 0;

        let preview = "📞 Call";

        if (callType === "video") {
            preview = "📹 Video Call";
        }

        await update(chatMetaRef, {
            lastMessage: preview,
            lastTime: time,
            unread
        });

    } catch (err) {
        console.error(
            "Failed to save call message:",
            err
        );
    }
}

window.sendCallMessage = sendCallMessage;
// =========================================================================
// logic for call mute and unmute of Mike and camera
// ========================================================================
// =========================================================================
// Refactored logic for call mute, unmute, camera, and speaker
// ========================================================================
function toggleMute() {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    isMicMuted = !track.enabled;

    const btn = document.getElementById("mute-call-btn");
    const label = document.getElementById("mute-call-label");
    if (btn && label) {
        if (isMicMuted) {
            btn.classList.add("bg-red-500/20", "text-red-400", "border-red-500/30");
            btn.classList.remove("bg-white/10", "text-white", "border-white/10");
            label.textContent = "Unmute";
        } else {
            btn.classList.remove("bg-red-500/20", "text-red-400", "border-red-500/30");
            btn.classList.add("bg-white/10", "text-white", "border-white/10");
            label.textContent = "Mute";
        }
    }
}

// Run this function when a VOICE call starts
function setAudioCallUI() {
    const container = document.getElementById("camera-btn-container");
    const btn = document.getElementById("toggle-camera-btn");
    
    if (container && btn) {
        // Fades the item out slightly and removes click feedback effects
        container.classList.add("opacity-35", "pointer-events-none");
        btn.setAttribute("disabled", "true");
    }
}

// Run this function when a VIDEO call starts
function setVideoCallUI() {
    const container = document.getElementById("camera-btn-container");
    const btn = document.getElementById("toggle-camera-btn");
    
    if (container && btn) {
        // Restores full brightness and interactions
        container.classList.remove("opacity-35", "pointer-events-none");
        btn.removeAttribute("disabled");
    }
}

// Update your toggle camera function to respect the disabled status securely
function toggleCamera() {
    if (!localStream) return;
    
    // Safety check in case pointer-events are bypassed
    const btn = document.getElementById("toggle-camera-btn");
    if (btn && btn.hasAttribute("disabled")) return;

    const track = localStream.getVideoTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    isCameraEnabled = track.enabled;

    const label = document.getElementById("toggle-camera-label");
    if (btn && label) {
        if (!isCameraEnabled) {
            btn.classList.add("bg-red-500/20", "text-red-400", "border-red-500/30");
            btn.classList.remove("bg-white/10", "text-white", "border-white/10");
            label.textContent = "Turn On";
        } else {
            btn.classList.remove("bg-red-500/20", "text-red-400", "border-red-500/30");
            btn.classList.add("bg-white/10", "text-white", "border-white/10");
            label.textContent = "Video";
        }
    }
}


function toggleSpeaker() {
    isSpeakerEnabled = !isSpeakerEnabled;
    const btn = document.getElementById("speaker-call-btn");
    const label = document.getElementById("speaker-call-label");
    if (btn && label) {
        if (!isSpeakerEnabled) {
            btn.classList.add("bg-zinc-800/40", "text-gray-400");
            btn.classList.remove("bg-white/10", "text-white");
            label.textContent = "Speaker Off";
        } else {
            btn.classList.remove("bg-zinc-800/40", "text-gray-400");
            btn.classList.add("bg-white/10", "text-white");
            label.textContent = "Speaker";
        }
    }
}

async function switchCamera() {
    console.log("Camera switch feature will be connected next.");
}



// =========================================================================
// Expose call control functions to the global window scope
// =========================================================================
window.toggleMute = toggleMute;
window.toggleCamera = toggleCamera;
window.toggleSpeaker = toggleSpeaker;
window.toggleHold = toggleHold;
window.toggleRecord = toggleRecord;
window.toggleScreenShare = toggleScreenShare;
window.switchCamera = switchCamera;
window.setAudioCallUI = setAudioCallUI;
window.setVideoCallUI = setVideoCallUI;



// =========================================================================
// New Advanced Call Features (Placeholders)
// ========================================================================
let isCallOnHold = false;
let isRecording = false;
let isScreenSharing = false;

function toggleHold() {
    isCallOnHold = !isCallOnHold;
    const btn = document.getElementById("hold-call-btn");
    const label = document.getElementById("hold-call-label");
    
    if (btn && label) {
        if (isCallOnHold) {
            btn.classList.add("bg-amber-500/20", "text-amber-400", "border-amber-500/30");
            btn.classList.remove("bg-white/10", "text-white", "border-white/10");
            label.textContent = "Unhold";
            alert("Call placed on hold.");
        } else {
            btn.classList.remove("bg-amber-500/20", "text-amber-400", "border-amber-500/30");
            btn.classList.add("bg-white/10", "text-white", "border-white/10");
            label.textContent = "Hold";
            alert("Call resumed.");
        }
    }
}

function toggleRecord() {
    isRecording = !isRecording;
    const btn = document.getElementById("record-call-btn");
    const label = document.getElementById("record-call-label");
    
    if (btn && label) {
        if (isRecording) {
            btn.classList.add("bg-red-500/20", "text-red-500", "border-red-500/30");
            btn.classList.remove("bg-white/10", "text-white", "border-white/10");
            btn.querySelector('svg').classList.add("animate-pulse");
            label.textContent = "Stop Rec";
            alert("Recording started... (Feature coming soon)");
        } else {
            btn.classList.remove("bg-red-500/20", "text-red-500", "border-red-500/30");
            btn.classList.add("bg-white/10", "text-white", "border-white/10");
            btn.querySelector('svg').classList.remove("animate-pulse");
            label.textContent = "Record";
            alert("Recording saved.");
        }
    }
}

function toggleScreenShare() {
    alert("Screen sharing feature is coming soon!");
}


// =========================================================================
// logic for call ringtone and outgoing rings
// =========================================================================
function playIncomingRingtone() {
    if (navigator.vibrate) {
        navigator.vibrate([500, 500, 500]);
    }

    const ringtone = document.getElementById("incoming-call-ringtone");
    if (!ringtone) return;

    ringtone.currentTime = 0;
    ringtone.play().catch(err => {
        console.log("Ringtone autoplay blocked:", err);
    });
}

function stopIncomingRingtone() {
    if (navigator.vibrate) {
        navigator.vibrate(0);
    }

    const ringtone = document.getElementById("incoming-call-ringtone");
    if (!ringtone) return;

    ringtone.pause();
    ringtone.currentTime = 0;
}

function playOutgoingRingback() {
    const audio = document.getElementById("outgoing-ringback-tone");
    if (!audio) return;

    audio.currentTime = 0;
    audio.play().catch(err => {
        console.log("Ringback blocked:", err);
    });
}

function stopOutgoingRingback() {
    const audio = document.getElementById("outgoing-ringback-tone");
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
}

// =========================================================================
// logic for call timer
// =========================================================================
function startCallTimer() {
    if (callTimerInterval) {
        clearInterval(callTimerInterval);
    }

    callStartTimestamp = Date.now();

    callTimerInterval = setInterval(() => {
        const seconds = Math.floor((Date.now() - callStartTimestamp) / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        const formatted = String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
        const statusEl = document.getElementById("call-status");

        if (statusEl) {
            statusEl.textContent = formatted;
        }
    }, 1000);
}

// =========================================================================
// 3. INCOMING CALL GATEWAY LISTENER
// =========================================================================
export function listenForIncomingCalls() {
    const currentAuth = auth || window.auth;
    const currentRtdb = rtdb || window.rtdb;

    if (!currentRtdb) {
        console.error("Realtime Database not found");
        return;
    }

    // If a listener already exists, unsubscribe from it using the modular Firebase pattern
    if (globalIncomingRef && typeof globalIncomingRef === "function") {
        globalIncomingRef();
    }

    // Listen globally to the calls node
    globalIncomingRef = onValue(
        ref(currentRtdb, "calls"),
        (snap) => {
            // Read authentication state dynamic inside the callback to prevent initialization race conditions
            const myUid = currentAuth?.currentUser?.uid;
            if (!myUid || !snap.exists()) return;

            const calls = snap.val();

            Object.entries(calls).forEach(([callId, call]) => {
                if (
                    call.receiverId === myUid &&
                    call.status === "ringing" &&
                    activeCallId !== callId
                ) {
                    console.log("Incoming call detected:", callId);

                    activeCallId = callId;
                    activeCallType = call.type;

                    get(ref(currentRtdb, `global_users/${call.callerId}`)).then((userSnap) => {

    const userData = userSnap.val() || {};

    const name =
        userData.username ||
        "Incoming Call";
        
        call.profilePic =
    userData.profile_pic || "";
    

    console.log("Caller User Data:", userData);
    console.log("Caller Name:", name);

    showIncomingCallUI(call, name);

}).catch((err) => {

    console.error("Failed to load caller:", err);

    showIncomingCallUI(call, "Incoming Call");

});
                }


                if (activeCallId === callId && activeCallId !== null) {
                    if (
                        call.status === "rejected" ||
                        call.status === "ended" ||
                        call.status === "missed"
                    ) {
                        console.log(`Call terminated externally: ${call.status}`);
                        
                        cleanupWebRTC();
                        hideCallScreen();
                        activeCallId = null;
                    }
                }
            });
        },
        (error) => {
            console.error("Firebase incoming call listener error:", error);
        }
    );
}

// =========================================================================
// 4. START ACTIVE DIAL (CALLER)
// =========================================================================
async function startCall(type) {
    showCallToast(type === "video" ? "Video call has started" : "Voice call has started");
    
    const currentAuth = auth || window.auth;
    const currentRtdb = rtdb || window.rtdb;
    const activeChatUser = currentChatUser || window.currentChatUser;

    if (!currentAuth?.currentUser?.uid) {
        alert("You must be logged in to make a call.");
        return;
    }

    if (!activeChatUser) {
        alert("Please select a user to call first.");
        return;
    }

    const isAccessPermitted = await verifyMediaPermissions(type);
    if (!isAccessPermitted) {
        alert("Cannot execute call without necessary device hardware access permissions.");
        return;
    }

    const callId = "call_" + Date.now();
    activeCallId = callId;
    activeCallType = type;
    
    activeOtherUser = activeChatUser;

    // Fixed database assignments to strictly use evaluated local fallback scopes
    await set(ref(currentRtdb, `calls/${callId}`), {
        callerId: currentAuth.currentUser.uid,
        receiverId: activeChatUser,
        type: type,
        status: "ringing",
        createdAt: Date.now(),
        connectedAt: null,
        endedAt: null,
        duration: 0
    });

    let targetName = "Calling...";
    try {
        const snap = await get(ref(currentRtdb, `users/${activeChatUser}`));
        if (snap.exists()) targetName = snap.val().name || "Calling...";
    } catch (e) { 
        console.error(e); 
    }


    let profilePic = "";

try {

    const snap = await get(
        ref(
            currentRtdb,
            `global_users/${activeChatUser}`
        )
    );

    if (snap.exists()) {

        targetName =
            snap.val().username ||
            "Calling...";

        profilePic =
            snap.val().profile_pic || "";
    }

} catch (e) {
    console.error(e);
}

showCallScreen(
    type,
    targetName,
    profilePic
);

    playOutgoingRingback();
    
    setTimeout(async () => {
        try {
            const snap = await get(ref(currentRtdb, `calls/${callId}`));
            if (!snap.exists()) return;

            const call = snap.val();
            if (call.status === "ringing") {
                await update(ref(currentRtdb, `calls/${callId}`), {
                    status: "missed",
                    endedAt: Date.now(),
                    duration: 0
                });
                
                await window.sendCallMessage?.(
    activeChatUser,
    type,
    "missed"
);

                showCallToast(type === "video" ? "Video call not answered" : "Voice call not answered");
                cleanupWebRTC();
                hideCallScreen();

                if (activeCallId === callId) {
                    activeCallId = null;
                }
            }
        } catch (e) {
            console.error(e);
        }
    }, 30000);

    if (callNodeListener) {
        off(ref(currentRtdb, `calls/${callId}`));
    }
    
    callNodeListener = onValue(ref(currentRtdb, `calls/${callId}`), (snap) => {
        if (!snap.exists()) return;

        const call = snap.val();

        if (call.status === "accepted" && !peerConnection) {
            stopOutgoingRingback();
            console.log("Receiver picked up call. Initializing WebRTC configurations...");
            startCallerWebRTC();
        }

        if (
            call.status === "rejected" ||
            call.status === "ended" ||
            call.status === "missed"
        ) {
            stopOutgoingRingback();
            cleanupWebRTC();
            hideCallScreen();
            activeCallId = null;
            if (callNodeListener) {
                off(ref(currentRtdb, `calls/${callId}`));
                callNodeListener = null;
            }
        }
    });
}
window.startCall = startCall;

// =========================================================================
// 5. PICK UP / ANSWER SESSION (RECEIVER)
// =========================================================================
async function acceptCall() {
    const currentRtdb = rtdb || window.rtdb;

    if (!activeCallId || !currentRtdb) return;

    // Keep caller name & profile picture visible
    showCallScreen(
        activeCallType,
        activeCallerName,
        activeCallerProfilePic
    );

    // Show connecting status
    const statusEl = document.getElementById("call-status");
    if (statusEl) {
        statusEl.textContent = "Connecting...";
    }

    const accessValid = await verifyMediaPermissions(activeCallType);

    if (!accessValid) {
        alert("Hardware access failed. Rejecting incoming request...");
        rejectCall();
        return;
    }

    try {
        await update(
            ref(currentRtdb, `calls/${activeCallId}`),
            { status: "accepted" }
        );

        await startReceiverWebRTC();

        // Change only the status text
        if (statusEl) {
            statusEl.textContent = "Connected";
        }

    } catch (err) {
        console.error(
            "Critical error launching WebRTC:",
            err
        );

        cleanupWebRTC();
        hideCallScreen();
    }
}

window.acceptCall = acceptCall;

// =========================================================================
// 6. TERMINATION SIGNALLERS (REJECT & END)
// =========================================================================
async function rejectCall() {



    stopIncomingRingtone();
    if (!activeCallId) return;

    const currentRtdb = rtdb || window.rtdb;
    const sessionToKill = activeCallId;

    cleanupWebRTC();
    hideCallScreen();
    activeCallId = null;

    await update(ref(currentRtdb, `calls/${sessionToKill}`), {
        status: "rejected",
        endedAt: Date.now(),
        duration: 0
    });
}
window.rejectCall = rejectCall;

async function endCall() {
    if (!activeCallId) return;

    const currentRtdb = rtdb || window.rtdb;
    const sessionToKill = activeCallId;
    let duration = 0;

    try {
        const snap = await get(ref(currentRtdb, `calls/${sessionToKill}`));
        if (snap.exists()) {
            const call = snap.val();
            if (call.connectedAt) {
                duration = Math.floor((Date.now() - call.connectedAt) / 1000);
            }
        }
    } catch (e) {
        console.error(e);
    }
    
    
    await window.sendCallMessage?.(
    activeOtherUser,
    activeCallType,
    "rejected"
);

    cleanupWebRTC();
    hideCallScreen();
    activeCallId = null;
    

    await update(ref(currentRtdb, `calls/${sessionToKill}`), {
        status: "ended",
        endedAt: Date.now(),
        duration: duration
    });
}
window.endCall = endCall;

// =========================================================================
// 7. FULL-SCREEN USER INTERFACE CONTROLLERS
// =========================================================================
function showCallScreen(
    type,
    contactName,
    profilePic = ""
){
    startCallBackgroundVideo();

    const overlay = document.getElementById("call-overlay");
    const nameEl = document.getElementById("call-user-name");
    const statusEl = document.getElementById("call-status");
    const avatarEl = document.getElementById("call-avatar-placeholder");
    const videoContainer = document.getElementById("video-streams-container");
    const incomingActions = document.getElementById("incoming-actions");
    const outgoingActions = document.getElementById("outgoing-actions");
    const switchBtn = document.getElementById("switch-camera-btn");
    const cameraBtn = document.getElementById("toggle-camera-btn");

    if (!overlay) return;

    if (nameEl) nameEl.textContent = contactName;
    if (statusEl) statusEl.textContent = type === "video" ? "Video Call..." : "Voice Call...";
    const avatarImg =
    document.getElementById(
        "call-avatar-image"
    );

if (profilePic) {

    avatarImg.src = profilePic;

    avatarImg.classList.remove(
        "hidden"
    );

    avatarEl.classList.add(
        "hidden"
    );

} else {

    avatarImg.classList.add(
        "hidden"
    );

    avatarEl.classList.remove(
        "hidden"
    );

    avatarEl.textContent =
        contactName.charAt(0).toUpperCase();
}

    if (incomingActions) incomingActions.classList.add("hidden");
    if (outgoingActions) outgoingActions.classList.remove("hidden");

    if (type === "video") {
        if (videoContainer) videoContainer.classList.remove("hidden");
        if (switchBtn) switchBtn.classList.remove("hidden");
        if (cameraBtn) cameraBtn.classList.remove("hidden"); // explicitly visible
        
        // Trigger video state UI styling (Full brightness)
        setVideoCallUI();
    } else {
        if (videoContainer) videoContainer.classList.add("hidden");
        if (switchBtn) switchBtn.classList.add("hidden");
        
        // REMOVED: cameraBtn.classList.add("hidden") has been removed 
        // so it stays on screen to show the dimmed effect!
        if (cameraBtn) cameraBtn.classList.remove("hidden"); 
        
        // Trigger audio state UI styling (Shade/Dim effect)
        setAudioCallUI();
    }

    overlay.classList.remove("hidden");
    const endBtn = document.getElementById("end-call-btn");
    if (endBtn) endBtn.onclick = endCall;
}


function showIncomingCallUI(call, callerName) {

activeOtherUser = call.callerId;

activeCallerName = callerName;
activeCallerProfilePic = call.profilePic || "";

    playIncomingRingtone();
    startCallBackgroundVideo();
    
    const overlay = document.getElementById("call-overlay");
    const nameEl = document.getElementById("call-user-name");
    const statusEl = document.getElementById("call-status");
    const avatarEl = document.getElementById("call-avatar-placeholder");
    const videoContainer = document.getElementById("video-streams-container");
    const incomingActions = document.getElementById("incoming-actions");
    const outgoingActions = document.getElementById("outgoing-actions");

    if (!overlay) return;

    if (nameEl) nameEl.textContent = callerName;
    if (statusEl) statusEl.textContent = `Incoming ${call.type || 'audio'} Call...`;
    const avatarImg =
    document.getElementById(
        "call-avatar-image"
    );

if (call.profilePic) {

    avatarImg.src =
        call.profilePic;

    avatarImg.classList.remove(
        "hidden"
    );

    avatarEl.classList.add(
        "hidden"
    );

} else {

    avatarImg.classList.add(
        "hidden"
    );

    avatarEl.classList.remove(
        "hidden"
    );

    avatarEl.textContent =
        callerName.charAt(0).toUpperCase();
}

    if (incomingActions) incomingActions.classList.remove("hidden");
    if (outgoingActions) outgoingActions.classList.add("hidden");
    if (videoContainer) videoContainer.classList.add("hidden");

    overlay.classList.remove("hidden");

    const acceptBtn = document.getElementById("accept-call-btn");
    const rejectBtn = document.getElementById("reject-call-btn");
    if (acceptBtn) acceptBtn.onclick = acceptCall;
    if (rejectBtn) rejectBtn.onclick = rejectCall;
}

function hideCallScreen() {
    stopOutgoingRingback();
    stopIncomingRingtone();
    stopCallBackgroundVideo();

    const overlay = document.getElementById("call-overlay");
    const videoContainer = document.getElementById("video-streams-container");
    const remoteVideo = document.getElementById("remote-video");
    const localVideo = document.getElementById("local-video");
    const remoteAudio = document.getElementById("remote-audio");

    if (overlay) overlay.classList.add("hidden");
    if (videoContainer) videoContainer.classList.add("hidden");
    
    if (remoteVideo) remoteVideo.srcObject = null;
    if (localVideo) localVideo.srcObject = null;
    if (remoteAudio) remoteAudio.srcObject = null;
}

// =========================================================================
// 8. SECURITY UTILITIES & DEVICE HARDWARE ASSIGNMENTS
// =========================================================================
async function verifyMediaPermissions(type) {
    try {
        const checkConstraints = { audio: true, video: type === "video" };
        const testStream = await navigator.mediaDevices.getUserMedia(checkConstraints);
        testStream.getTracks().forEach(track => track.stop());
        return true;
    } catch (err) {
        console.error("System device initialization failure / Denied permission:", err);
        return false;
    }
}

// =========================================================================
// 9. WEBRTC ENGINE LAYER & PAIRING HANDSHAKE (PERSISTENT LISTENING)
// =========================================================================
const rtcConfig = {
    iceServers: [
        { urls: ["stun:stun.l.google.com:19302"] },
        {
            urls: ["turn:openrelay.metered.ca:80", "turns:openrelay.metered.ca:443?transport=tcp"],
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ]
};

let iceFirebaseListener = null;

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(rtcConfig);
    remoteStream = new MediaStream();

    let remoteAudio = document.getElementById("remote-audio");
    if (!remoteAudio) {
        remoteAudio = document.createElement("audio");
        remoteAudio.id = "remote-audio";
        remoteAudio.autoplay = true;
        remoteAudio.playsInline = true;
        document.body.appendChild(remoteAudio);
    }

    peerConnection.onconnectionstatechange = () => {
        console.log(`WebRTC Connection State Changed: ${peerConnection.connectionState}`);

        if (peerConnection.connectionState === "connected") {
            console.log("🚀 WebRTC successfully connected! Media flowing.");
            const statusEl = document.getElementById("call-status");
            if (statusEl) statusEl.textContent = "Connected";

            if (activeCallId) {
                const currentRtdb = rtdb || window.rtdb;
                update(ref(currentRtdb, `calls/${activeCallId}`), {
                    status: "connected",
                    connectedAt: Date.now()
                }).catch(console.error);
            }
            startCallTimer();
        }

        if (peerConnection.connectionState === "failed" || peerConnection.connectionState === "disconnected") {
            console.log("Connection dropped or failed. Attempting cleanup...");
            endCall();
        }
    };

    peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE State:", peerConnection.iceConnectionState);
    };

    listenForIceCandidates();

    peerConnection.ontrack = (event) => {
        console.log("Remote stream received!");
        const remoteVideo = document.getElementById("remote-video");

        if (remoteVideo && activeCallType === "video") {
            remoteVideo.srcObject = event.streams[0];
        }

        if (remoteAudio) {
            remoteAudio.srcObject = event.streams[0];
            remoteAudio.play().catch(err => {
                console.log("Audio autoplay blocked:", err);
            });
        }
    };

    peerConnection.onicecandidate = async (event) => {
        const currentRtdb = rtdb || window.rtdb;
        if (!event.candidate || !activeCallId || !currentRtdb) return;

        try {
            await push(ref(currentRtdb, `calls/${activeCallId}/candidates`), event.candidate.toJSON());
            console.log("Uploaded local ICE candidate to database.");
        } catch (e) {
            console.error("Failed to commit ICE candidate package:", e);
        }
    };
}

async function startLocalMedia(type) {
    try {
        const constraints = {
            audio: true,
            video: type === "video" ? { width: 1280, height: 720, facingMode: "user" } : false
        };

        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        const localVideo = document.getElementById("local-video");
        
        if (localVideo && type === "video") {
            localVideo.srcObject = localStream;
        }

        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    } catch (err) {
        console.error("Local hardware integration error:", err);
        throw err;
    }
}

async function startCallerWebRTC() {
    const currentRtdb = rtdb || window.rtdb;
    try {
        iceCandidatesQueue = []; 
        createPeerConnection();
        await startLocalMedia(activeCallType);

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        await update(ref(currentRtdb, `calls/${activeCallId}`), { offer: { type: offer.type, sdp: offer.sdp } });

        answerListener = onValue(ref(currentRtdb, `calls/${activeCallId}/answer`), async (snapshot) => {
            if (!snapshot.exists() || !peerConnection) return;
            const answer = snapshot.val();

            if (peerConnection.currentRemoteDescription) return;

            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log("Caller applied remote answer!");
            await flushIceCandidates();
        });
    } catch (err) {
        console.error("Failed setting up Caller WebRTC pipeline:", err);
        endCall();
    }
}

async function startReceiverWebRTC() {
    const currentRtdb = rtdb || window.rtdb;
    try {
        iceCandidatesQueue = [];
        createPeerConnection();
        await startLocalMedia(activeCallType);

        offerListener = onValue(ref(currentRtdb, `calls/${activeCallId}/offer`), async (snapshot) => {
            if (!snapshot.exists() || !peerConnection) return;
            const offer = snapshot.val();

            if (peerConnection.currentRemoteDescription) return;

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log("Receiver applied remote offer.");
            await flushIceCandidates();

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            await update(ref(currentRtdb, `calls/${activeCallId}`), {
                answer: { type: answer.type, sdp: answer.sdp }
            });
            console.log("Receiver pushed answer payload.");
        });
    } catch (err) {
        console.error("Failed setting up Receiver WebRTC pipeline:", err);
        endCall();
    }
}

function listenForIceCandidates() {
    const currentRtdb = rtdb || window.rtdb;
    if (!activeCallId || !currentRtdb) return;
    
    if (iceFirebaseListener) {
        off(ref(currentRtdb, `calls/${activeCallId}/candidates`), "child_added", iceFirebaseListener);
    }

    iceFirebaseListener = onChildAdded(ref(currentRtdb, `calls/${activeCallId}/candidates`), async (snapshot) => {
        if (!snapshot.exists() || !peerConnection) return;
        const candidateData = snapshot.val();
        const candidate = new RTCIceCandidate(candidateData);

        if (!peerConnection.remoteDescription) {
            console.log("Queuing early ICE candidate...");
            iceCandidatesQueue.push(candidate);
        } else {
            try {
                await peerConnection.addIceCandidate(candidate);
                console.log("Successfully processed a live ICE candidate pathway!");
            } catch (e) {
                console.error("Error adding live network ICE candidate:", e);
            }
        }
    });
}

async function flushIceCandidates() {
    console.log(`Flushing ${iceCandidatesQueue.length} queued ICE candidates...`);
    while (iceCandidatesQueue.length > 0) {
        const candidate = iceCandidatesQueue.shift();
        try {
            await peerConnection.addIceCandidate(candidate);
        } catch (e) {
            console.error("Error adding flushed ICE candidate:", e);
        }
    }
}

// =========================================================================
// 12. HARDWARE AND SESSION TERMINATION DISCONNECTS
// =========================================================================
function stopCallTimer() {
    if (callTimerInterval) {
        clearInterval(callTimerInterval);
        callTimerInterval = null;
    }
    callStartTimestamp = null;
}

function cleanupWebRTC() {
    stopCallTimer();
    const currentRtdb = rtdb || window.rtdb;
    console.log("Cleaning up WebRTC session and releasing hardware...");

    if (activeCallId && iceFirebaseListener && currentRtdb) {
        off(ref(currentRtdb, `calls/${activeCallId}/candidates`), "child_added", iceFirebaseListener);
        iceFirebaseListener = null;
    }

    if (activeCallId && offerListener && currentRtdb) {
        off(ref(currentRtdb, `calls/${activeCallId}/offer`), "value", offerListener);
        offerListener = null;
    }

    if (activeCallId && answerListener && currentRtdb) {
        off(ref(currentRtdb, `calls/${activeCallId}/answer`), "value", answerListener);
        answerListener = null;
    }

    iceCandidatesQueue = [];

    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }

    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
}

async function loadCallHistory() {
    const container = document.getElementById("call-history-list");
    if (!container) return;

    const currentAuth = auth || window.auth;
    const currentRtdb = rtdb || window.rtdb;
    const myUid = currentAuth?.currentUser?.uid;

    if (!myUid) {
        container.innerHTML = '<p class="text-red-500">Not logged in</p>';
        return;
    }

    try {
        const snap = await get(ref(currentRtdb, "calls"));
        if (!snap.exists()) {
            container.innerHTML = '<p class="text-gray-500">No call history</p>';
            return;
        }

        const calls = snap.val();
        const history = Object.entries(calls)
            .filter(([id, call]) => call.callerId === myUid || call.receiverId === myUid)
            .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));

        if (!history.length) {
            container.innerHTML = '<p class="text-gray-500">No call history</p>';
            return;
        }

        container.innerHTML = "";

        for (const [id, call] of history) {
            const outgoing = call.callerId === myUid;
            const otherUserUid = outgoing ? call.receiverId : call.callerId;
            const date = new Date(call.createdAt || Date.now());
            const time = date.toLocaleString();

            let statusText = "";
            let icon = "📞";

            if (call.type === "video") {
                icon = "📹";
            }

            if (call.status === "missed") {
                statusText = outgoing ? "Missed Outgoing Call" : "Missed Incoming Call";
            } else if (call.status === "rejected") {
                statusText = outgoing ? "Call Declined" : "Rejected Call";
            } else if (call.status === "ended") {
                const mins = Math.floor((call.duration || 0) / 60);
                const secs = (call.duration || 0) % 60;
                statusText = `${mins}m ${secs}s`;
            } else {
                statusText = call.status || "Unknown";
            }

            container.innerHTML += `
                <div class="list-item">
                    <div class="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-lg">
                        ${icon}
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-sm">${outgoing ? "Outgoing Call" : "Incoming Call"}</p>
                        <p class="text-[10px] text-gray-500">${statusText} • ${time}</p>
                    </div>
                    <button onclick="callFromHistory('${otherUserUid}', 'audio')" class="p-2 rounded-full hover:bg-white/10 transition">📞</button>
                    <button onclick="callFromHistory('${otherUserUid}', 'video')" class="p-2 rounded-full hover:bg-white/10 transition">📹</button>
                </div>
            `;
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="text-red-500">Failed to load history</p>';
    }
}
window.loadCallHistory = loadCallHistory;

window.callFromHistory = function(targetUid, type) {
    currentChatUser = targetUid;
    startCall(type);
};

function showCallToast(message) {
    const toast = document.createElement("div");
    toast.className = "fixed top-5 left-1/2 -translate-x-1/2 z-[999999] px-4 py-3 rounded-3xl bg-black/90 border border-[#D4AF37]/40 text-white text-sm shadow-lg";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "0.3s";
    }, 2500);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function startCallBackgroundVideo() {
    const bgVideo = document.getElementById('call-bg-video');
    if (!bgVideo) return;

    bgVideo.currentTime = 0;
    bgVideo.onended = () => {
        setTimeout(() => {
            bgVideo.currentTime = 0;
            bgVideo.play().catch(() => {});
        }, 1000);
    };
    bgVideo.play().catch(() => {});
}

function stopCallBackgroundVideo() {
    const bgVideo = document.getElementById('call-bg-video');
    if (!bgVideo) return;

    bgVideo.pause();
    bgVideo.currentTime = 0;
}
