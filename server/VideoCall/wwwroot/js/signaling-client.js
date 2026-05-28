let connection = null;
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let currentTargetConnectionId = null;
let currentTargetUserId = null;
let myUserId = null;
let isVideoEnabled = true;
let isAudioEnabled = true;
let iceCandidateQueue = [];

// DOM Elements
const appContainer = document.getElementById("appContainer");
const friendListEl = document.getElementById("friendList");
const welcomeScreen = document.getElementById("welcomeScreen");
const chatInterface = document.getElementById("chatInterface");
const chatNameEl = document.getElementById("chatName");
const chatAvatarEl = document.getElementById("chatAvatar");
const chatStatusText = document.getElementById("chatStatusText");
const chatStatusDot = document.getElementById("chatStatusDot");
const btnStartVideoCall = document.getElementById("btnStartVideoCall");
const btnStartVoiceCall = document.getElementById("btnStartVoiceCall");
const messagesBox = document.querySelector(".messages-box");
const msgInput = document.querySelector(".input-area input");
const sendBtn = document.querySelector(".input-area button");
const backToFriendsBtn = document.getElementById("backToFriendsBtn");

// Modal & Controls
const callModal = document.getElementById("callModal");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const hangupBtn = document.getElementById("hangupBtn");
const toggleVideoBtn = document.getElementById("toggleVideoBtn");
const toggleMuteBtn = document.getElementById("toggleMuteBtn");
const shareScreenBtn = document.getElementById("shareScreenBtn");

// Cấu hình WebRTC
const iceServers = {
    iceServers: [
        {
            urls: "stun:stun.relay.metered.ca:80",
        },
        {
            urls: "turn:global.relay.metered.ca:80",
            username: "b0f9e65ea7bd51cba7566fd5",
            credential: "gA9dO40qYeKAZxAU",
        },
        {
            urls: "turn:global.relay.metered.ca:80?transport=tcp",
            username: "b0f9e65ea7bd51cba7566fd5",
            credential: "gA9dO40qYeKAZxAU",
        },
        {
            urls: "turn:global.relay.metered.ca:443",
            username: "b0f9e65ea7bd51cba7566fd5",
            credential: "gA9dO40qYeKAZxAU",
        },
        {
            urls: "turns:global.relay.metered.ca:443?transport=tcp",
            username: "b0f9e65ea7bd51cba7566fd5",
            credential: "gA9dO40qYeKAZxAU",
        },
    ],
};

// --- MOBILE NAVIGATION ---
if (backToFriendsBtn) {
    backToFriendsBtn.addEventListener("click", () => {
        appContainer.classList.remove("mobile-chat-active");
        currentTargetUserId = null;
        chatInterface.style.display = "none";
        welcomeScreen.style.display = "flex";
    });
}

// --- SIGNALR ---
async function startSignalR() {
    const token = localStorage.getItem("authToken");
    if (!token) { window.location.href = "/login.html"; return; }
    try { myUserId = atob(token); } catch (e) { }

    connection = new signalR.HubConnectionBuilder()
        .withUrl(`/hubs?token=${token}`)
        .withAutomaticReconnect()
        .build();

    connection.on("LoadFriends", renderFriends);
    connection.on("UserStatusChanged", updateFriendStatus);
    connection.on("ReceiveMessage", (senderId, content) => {
        if (currentTargetUserId === senderId || senderId === myUserId) {
            appendMessage(content, senderId === myUserId);
        }
    });
    connection.on("LoadChatHistory", (history) => {
        messagesBox.innerHTML = "";
        history.forEach(msg => appendMessage(msg.content, msg.senderId === myUserId));
        scrollToBottom();
    });

    // --- CALL EVENTS ---
    connection.on("IncomingCall", async (callerConnectionId, callerName) => {
        if (peerConnection) { await connection.invoke("RejectCall", callerConnectionId); return; }
        const accept = confirm(`📞 ${callerName} đang gọi...\nChấp nhận?`);
        if (accept) {
            currentTargetConnectionId = callerConnectionId;
            showCallModal();
            await connection.invoke("AcceptCall", callerConnectionId);
            await startCall(callerConnectionId, false);
        } else { await connection.invoke("RejectCall", callerConnectionId); }
    });

    connection.on("CallAccepted", async () => await startCall(currentTargetConnectionId, true));

    // Xử lý khi đối phương cúp máy (ĐỒNG BỘ TẮT)
    connection.on("CallEnded", () => {
        alert("Cuộc gọi đã kết thúc.");
        hideCallModal();
    });

    connection.on("CallRejected", () => { alert("Người dùng bận."); hideCallModal(); });

    // WebRTC Signaling
    connection.on("ReceiveOffer", async (callerId, sdp) => {
        if (!peerConnection) createPeerConnection(callerId);
        await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: sdp }));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await connection.invoke("SendAnswer", callerId, answer.sdp);
        processIceQueue();
    });

    connection.on("ReceiveAnswer", async (sdp) => {
        if (!peerConnection) return;
        await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: sdp }));
        processIceQueue();
    });

    connection.on("ReceiveIce", async (candidate) => {
        if (peerConnection && peerConnection.remoteDescription) {
            try { await peerConnection.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) { }
        } else { iceCandidateQueue.push(candidate); }
    });

    try { await connection.start(); console.log("Connected"); } catch (err) { console.error(err); }
}

// --- UI HELPERS ---
function renderFriends(friends) {
    friendListEl.innerHTML = "";
    friends.forEach(f => {
        const li = document.createElement("li");
        li.className = "friend-item";
        li.setAttribute("data-id", f.id);
        li.setAttribute("data-connection-id", f.connectionId || "");
        li.setAttribute("data-online", f.isOnline);

        const statusClass = f.isOnline ? 'online' : 'offline';
        const statusText = f.isOnline ? 'Online' : 'Offline';

        li.innerHTML = `
            <div class="avatar-wrapper">
                <div class="avatar">${f.name.charAt(0).toUpperCase()}</div>
                <div class="status-dot ${statusClass}"></div>
            </div>
            <div class="friend-info">
                <h4>${f.name}</h4>
                <p class="status-text">${statusText}</p>
            </div>`;

        li.addEventListener("click", () => selectFriend(f, li));
        friendListEl.appendChild(li);
    });
}

function updateFriendStatus(userId, isOnline, newConnectionId) {
    const li = document.querySelector(`li[data-id='${userId}']`);
    if (li) {
        li.setAttribute("data-connection-id", newConnectionId || "");
        li.setAttribute("data-online", isOnline);
        li.querySelector(".status-dot").className = `status-dot ${isOnline ? 'online' : 'offline'}`;
        li.querySelector(".status-text").textContent = isOnline ? 'Online' : 'Offline';

        if (currentTargetUserId === userId) {
            updateHeaderStatus(isOnline);
            currentTargetConnectionId = isOnline ? newConnectionId : null;
        }
    }
}

function selectFriend(friend, li) {
    document.querySelectorAll('.friend-item').forEach(i => i.classList.remove('active'));
    li.classList.add('active');

    currentTargetUserId = friend.id;
    const connId = li.getAttribute("data-connection-id");
    const isOnline = li.getAttribute("data-online") === "true";
    currentTargetConnectionId = isOnline ? connId : null;

    appContainer.classList.add("mobile-chat-active");
    welcomeScreen.style.display = "none";
    chatInterface.style.display = "flex";
    chatNameEl.textContent = friend.name;
    chatAvatarEl.textContent = friend.name.charAt(0).toUpperCase();
    updateHeaderStatus(isOnline);
    connection.invoke("GetChatHistory", friend.id);
}

function updateHeaderStatus(isOnline) {
    if (isOnline) {
        chatStatusText.textContent = "Đang hoạt động";
        chatStatusText.style.color = "var(--green-online)";
        chatStatusDot.className = "status-dot online";
    } else {
        chatStatusText.textContent = "Ngoại tuyến";
        chatStatusText.style.color = "#888";
        chatStatusDot.className = "status-dot offline";
    }
}

// --- CHAT ---
sendBtn.onclick = sendMessage;
msgInput.onkeypress = (e) => { if (e.key === "Enter") sendMessage(); };
async function sendMessage() {
    const text = msgInput.value.trim();
    if (!text || !currentTargetUserId) return;
    await connection.invoke("SendMessage", currentTargetUserId, text);
    msgInput.value = "";
}
function appendMessage(content, isMyMessage) {
    const div = document.createElement("div");
    div.className = isMyMessage ? "message my-message" : "message other-message";
    div.textContent = content;
    messagesBox.appendChild(div);
    if (isMyMessage) {
        const span = document.createElement("span");
        span.className = "msg-status";
        span.textContent = "Đã gửi";
        messagesBox.appendChild(span);
    }
    scrollToBottom();
}
function scrollToBottom() { messagesBox.scrollTop = messagesBox.scrollHeight; }

// --- WEBRTC & CALL ---
function checkCall(isVideo) {
    if (!currentTargetConnectionId) return alert("Người dùng Offline.");
    isVideoEnabled = isVideo;
    initiateCall(currentTargetConnectionId);
}
btnStartVideoCall.onclick = () => checkCall(true);
btnStartVoiceCall.onclick = () => checkCall(false);

async function initiateCall(targetId) {
    showCallModal();
    await connection.invoke("CallFriend", targetId);
}

// Tạo Peer Connection
function createPeerConnection(targetId) {
    peerConnection = new RTCPeerConnection(iceServers);
    iceCandidateQueue = [];

    // Add Track an toàn
    if (localStream) {
        localStream.getTracks().forEach(t => peerConnection.addTrack(t, localStream));
    }

    peerConnection.ontrack = e => {
        if (remoteVideo.srcObject !== e.streams[0]) {
            remoteVideo.srcObject = e.streams[0];
        }
    };
    peerConnection.onicecandidate = e => {
        if (e.candidate) connection.invoke("SendIce", targetId, e.candidate);
    };
}

function processIceQueue() {
    while (iceCandidateQueue.length > 0) {
        peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidateQueue.shift())).catch(console.error);
    }
}

async function startCall(targetId, isCaller) {
    try {
        await getLocalStream();

        // Nếu gọi thoại, tắt video track ngay
        if (!isVideoEnabled) {
            localStream.getVideoTracks()[0].enabled = false;
            toggleVideoBtn.classList.add("off");
        } else {
            toggleVideoBtn.classList.remove("off");
        }

    } catch (e) { alert("Lỗi Cam/Mic"); hideCallModal(); return; }

    createPeerConnection(targetId);

    if (isCaller) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        await connection.invoke("SendOffer", targetId, offer.sdp);
    }
}

async function getLocalStream() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
}

function showCallModal() { callModal.classList.add("active"); }

// Hàm ngắt cuộc gọi cục bộ + Gửi tín hiệu ngắt cho đối phương
async function endCall() {
    if (currentTargetConnectionId) {
        await connection.invoke("EndCall", currentTargetConnectionId);
    }
    hideCallModal();
}

function hideCallModal() {
    callModal.classList.remove("active");
    if (peerConnection) { peerConnection.close(); peerConnection = null; }
    if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
    remoteVideo.srcObject = null;
}

// Nút Cúp máy
hangupBtn.onclick = endCall;

// Toggle Controls
toggleVideoBtn.onclick = () => {
    isVideoEnabled = !isVideoEnabled;
    if (localStream) localStream.getVideoTracks()[0].enabled = isVideoEnabled;
    toggleVideoBtn.classList.toggle("off", !isVideoEnabled);
};
toggleMuteBtn.onclick = () => {
    isAudioEnabled = !isAudioEnabled;
    if (localStream) localStream.getAudioTracks()[0].enabled = isAudioEnabled;
    toggleMuteBtn.classList.toggle("off", !isAudioEnabled);
};
shareScreenBtn.onclick = async () => {
    try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
        const track = screen.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        sender.replaceTrack(track);
        track.onended = () => sender.replaceTrack(localStream.getVideoTracks()[0]);
    } catch (e) { console.error(e); }
};

document.addEventListener("DOMContentLoaded", startSignalR);