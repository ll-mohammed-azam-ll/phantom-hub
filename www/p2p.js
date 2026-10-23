// p2p.js - The Decentralized Tunneling Engine
import { ref, set, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// WebRTC Configuration using Google's free STUN server
const iceConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
let pc = new RTCPeerConnection(iceConfig);
let dataChannel;

// UI Elements
const p2pStatus = document.querySelector('#p2p-interface span.text-white');
const p2pInput = document.getElementById('p2p-input');
const p2pMessages = document.getElementById('p2p-messages');
const remoteNodeInput = document.querySelector('input[placeholder="ENTER P2P ADDRESS..."]');

/**
 * 1. INITIALIZE DATA CHANNEL (The actual direct pipe)
 */
const setupDataChannel = (channel) => {
    dataChannel = channel;
    dataChannel.onopen = () => {
        updateUIConnected();
        console.log("P2P: Direct Tunnel Established.");
    };
    dataChannel.onmessage = (e) => renderP2PMessage(e.data, 'them');
};

/**
 * 2. CREATE TUNNEL (Host Mode)
 */
window.createP2PTunnel = async () => {
    const roomId = remoteNodeInput.value;
    if (!roomId) return alert("Please enter a Node Alias (Room ID)");

    setupDataChannel(pc.createDataChannel("phantom-chat"));

    // Gather network candidates (ICE)
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            update(ref(window.rtdb, `p2p_rooms/${roomId}/hostCandidates`), {
                [Date.now()]: JSON.stringify(event.candidate)
            });
        }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Save offer to Firebase for the peer to find
    await set(ref(window.rtdb, `p2p_rooms/${roomId}/offer`), {
        sdp: offer.sdp,
        type: offer.type
    });

    // Listen for Peer's Answer
    onValue(ref(window.rtdb, `p2p_rooms/${roomId}/answer`), async (snapshot) => {
        if (snapshot.exists() && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(snapshot.val()));
        }
    });

    p2pStatus.innerText = "WAITING...";
    
    
    // Add this inside both create and join functions in p2p.js
onValue(ref(window.rtdb, `p2p_rooms/${roomId}/${isHost ? 'peerCandidates' : 'hostCandidates'}`), (snapshot) => {
    if (snapshot.exists()) {
        const candidates = snapshot.val();
        Object.values(candidates).forEach(candidateStr => {
            const candidate = JSON.parse(candidateStr);
            pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("ICE Error", e));
        });
    }
});

};

/**
 * 3. JOIN TUNNEL (Peer Mode)
 */
window.joinP2PTunnel = async () => {
    const roomId = remoteNodeInput.value;
    const roomRef = ref(window.rtdb, `p2p_rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) return alert("Node Alias not found.");

    pc.ondatachannel = (event) => setupDataChannel(event.channel);

    const roomData = snapshot.val();
    await pc.setRemoteDescription(new RTCSessionDescription(roomData.offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await update(roomRef, { answer: { sdp: answer.sdp, type: answer.type } });

    p2pStatus.innerText = "HANDSHAKING...";
    
    // Add this inside both create and join functions in p2p.js
onValue(ref(window.rtdb, `p2p_rooms/${roomId}/${isHost ? 'peerCandidates' : 'hostCandidates'}`), (snapshot) => {
    if (snapshot.exists()) {
        const candidates = snapshot.val();
        Object.values(candidates).forEach(candidateStr => {
            const candidate = JSON.parse(candidateStr);
            pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("ICE Error", e));
        });
    }
});

};

/**
 * 4. P2P MESSAGING & UI
 */
window.sendP2PMessage = () => {
    const msg = p2pInput.value;
    if (msg && dataChannel && dataChannel.readyState === "open") {
        dataChannel.send(msg);
        renderP2PMessage(msg, 'me');
        p2pInput.value = '';
    }
};

function renderP2PMessage(content, side) {
    const msgHTML = `
        <div class="flex ${side === 'me' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2">
            <div class="max-w-[80%] p-4 rounded-3xl text-xs font-medium ${side === 'me' ? 'bg-[#D4AF37] text-black' : 'bg-white/5 border border-white/10 text-white'}">
                ${content}
            </div>
        </div>`;
    p2pMessages.insertAdjacentHTML('beforeend', msgHTML);
    p2pMessages.scrollTop = p2pMessages.scrollHeight;
}

function updateUIConnected() {
    p2pStatus.innerText = "TUNNEL ACTIVE";
    p2pStatus.parentElement.querySelector('span').classList.replace('bg-red-500', 'bg-green-500');
}

// Bind the Launch button to the logic
window.openP2PChat = () => {
    document.getElementById('p2p-chat-panel').classList.remove('hidden');
    window.closeP2PPanel();
};
