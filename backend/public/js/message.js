// ============================================================
//  message.js — Complete Frontend Logic
//  Features: Search, Send, Receive (real-time), Seen,
//            Unread dot, Message Requests (accept/decline),
//            Load conversation on chat open
// ============================================================

const API_URL = "http://localhost:3001";
const token = localStorage.getItem("token");

// ✅ Token check — agar null hai to login page pe bhejo
if (!token) {
    alert("Session expired. Please login again.");
    window.location.href = "login.html";
}

// ✅ Apna user ID string mein store karo
const currentUserId = localStorage.getItem("userId")?.toString();

// ✅ Shared axios config — token har request mein automatically jayega
const authHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

// ✅ Socket connect karo with JWT token
const socket = io(API_URL, { auth: { token } });

// Currently open chat ka receiverId
let currentReceiverId = null;

// ============================================================
// 1. PAGE LOAD — Recent conversations + pending requests load
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
    loadRecentChats();
    loadPendingRequests();
});

// ============================================================
// 2. LOAD RECENT CHATS — ✅ FIXED: Ab API call hogi
// ============================================================
async function loadRecentChats() {
    const container = document.getElementById("chats-tab");
    container.innerHTML = `<p class="loading-text">Loading chats...</p>`;

    try {
        const res = await axios.get(`${API_URL}/messages/conversations`, authHeaders());
        const chats = res.data;

        container.innerHTML = "";

        if (!chats || chats.length === 0) {
            container.innerHTML = `<p class="no-results">Search for a user to start chatting 👆</p>`;
            return;
        }

        chats.forEach(chat => {
            const other = chat.otherUser;
            const div = document.createElement("div");
            div.className = "user-item";
            div.dataset.userId = other._id.toString();
            div.innerHTML = `
                <div class="avatar-gradient">
                    <div class="avatar-inner">${other.username.charAt(0).toUpperCase()}</div>
                </div>
                <div class="user-info">
                    <p style="font-weight:600;">${other.username}</p>
                    <p class="last-msg-preview" style="font-size:12px;color:gray;">
                        ${chat.lastMessage || "Tap to open chat"}
                    </p>
                </div>
                ${chat.unreadCount > 0 ? '<div class="unread-dot"></div>' : ''}
            `;
            div.onclick = () => openChat(other._id.toString(), other.username);

            // ✅ Agar yahi chat abhi open hai to highlight karo
            if (other._id.toString() === currentReceiverId) {
                div.classList.add("active-chat-item");
            }

            container.appendChild(div);
        });

    } catch (err) {
        console.error("Load chats error:", err);
        container.innerHTML = `<p class="no-results">Could not load chats.</p>`;
    }
}

// ============================================================
// 3. LOAD PENDING REQUESTS (General Tab)
// ============================================================
async function loadPendingRequests() {
    const container = document.getElementById("requests-tab");
    const badge = document.getElementById("req-count");

    try {
        const res = await axios.get(`${API_URL}/messages/requests/pending`, authHeaders());
        const requests = res.data;

        if (requests.length > 0) {
            badge.textContent = requests.length;
            badge.style.display = "inline";
        } else {
            badge.style.display = "none";
        }

        container.innerHTML = "";

        if (requests.length === 0) {
            container.innerHTML = `<p class="no-results">No pending requests</p>`;
            return;
        }

        requests.forEach(req => {
            const card = document.createElement("div");
            card.className = "request-card";
            card.id = `req-card-${req._id}`;
            card.innerHTML = `
                <div class="avatar-gradient">
                    <div class="avatar-inner">${req.sender.username.charAt(0).toUpperCase()}</div>
                </div>
                <div class="user-info">
                    <p style="font-weight:600;">${req.sender.username}</p>
                    <p style="font-size:12px; color:gray;">Wants to message you</p>
                </div>
                <div class="req-actions">
                    <button class="btn-accept" onclick="respondToRequest('${req._id}', 'accept', this)">Accept</button>
                    <button class="btn-decline" onclick="respondToRequest('${req._id}', 'decline', this)">Decline</button>
                </div>`;
            container.appendChild(card);
        });

    } catch (err) {
        container.innerHTML = `<p class="no-results">Could not load requests.</p>`;
    }
}

// ============================================================
// 4. RESPOND TO REQUEST (Accept / Decline)
// ============================================================
async function respondToRequest(requestId, action, btnEl) {
    try {
        await axios.post(`${API_URL}/messages/requests/respond`,
            { requestId, action },
            authHeaders()
        );

        const card = document.getElementById(`req-card-${requestId}`);
        if (card) card.remove();

        const badge = document.getElementById("req-count");
        const remaining = document.querySelectorAll(".request-card").length;
        if (remaining === 0) {
            badge.style.display = "none";
            document.getElementById("requests-tab").innerHTML =
                `<p class="no-results">No pending requests</p>`;
        } else {
            badge.textContent = remaining;
        }

        // ✅ Accept ke baad recent chats reload karo
        if (action === "accept") {
            loadRecentChats();
        }

    } catch (err) {
        alert(err.response?.data?.error || "Something went wrong");
    }
}

// ============================================================
// 5. TAB SWITCHING (Primary / Requests)
// ============================================================
function showTab(tab) {
    const chatsTab = document.getElementById("chats-tab");
    const requestsTab = document.getElementById("requests-tab");
    const chatsBtn = document.getElementById("chats-btn");
    const reqBtn = document.getElementById("req-btn");

    if (tab === "chats") {
        chatsTab.style.display = "block";
        requestsTab.style.display = "none";
        chatsBtn.classList.add("active");
        reqBtn.classList.remove("active");
    } else {
        chatsTab.style.display = "none";
        requestsTab.style.display = "block";
        reqBtn.classList.add("active");
        chatsBtn.classList.remove("active");
    }
}

// ============================================================
// 6. SEARCH USERS
// ============================================================
document.getElementById("user-search").addEventListener("input", async (e) => {
    const query = e.target.value.trim();
    const container = document.getElementById("chats-tab");

    showTab("chats");

    if (!query) {
        // ✅ Search clear hone par recent chats wapas dikhao
        loadRecentChats();
        return;
    }

    try {
        const res = await axios.get(`${API_URL}/user/search?q=${query}`, authHeaders());

        container.innerHTML = "";

        if (res.data.length === 0) {
            container.innerHTML = `<p class="no-results">No user found</p>`;
            return;
        }

        res.data.forEach(user => {
            const div = document.createElement("div");
            div.className = "user-item";
            div.dataset.userId = user._id.toString();
            div.innerHTML = `
                <div class="avatar-gradient">
                    <div class="avatar-inner">${user.username.charAt(0).toUpperCase()}</div>
                </div>
                <div class="user-info">
                    <p style="font-weight:600;">${user.username}</p>
                    <p style="font-size:12px; color:gray;">${user.isPrivate ? "🔒 Private" : "🌐 Public"}</p>
                </div>`;
            div.onclick = () => openChat(user._id.toString(), user.username);
            container.appendChild(div);
        });

    } catch (err) {
        console.error("Search error:", err);
    }
});

// ============================================================
// 7. OPEN CHAT — Load messages + mark as seen
// ============================================================
async function openChat(userId, username) {
    currentReceiverId = userId.toString();

    console.log("=== OPEN CHAT DEBUG ===");
    console.log("currentUserId:", currentUserId);
    console.log("currentReceiverId:", currentReceiverId);

    // UI switch
    document.getElementById("no-chat-selected").style.display = "none";
    document.getElementById("active-chat").style.display = "flex";
    document.getElementById("current-user-name").innerText = username;
    document.getElementById("chat-avatar").innerText = username.charAt(0).toUpperCase();
    document.getElementById("chat-messages").innerHTML = "";

    // Active item highlight
    document.querySelectorAll(".user-item").forEach(el => el.classList.remove("active-chat-item"));
    const activeItem = document.querySelector(`.user-item[data-user-id="${currentReceiverId}"]`);
    if (activeItem) activeItem.classList.add("active-chat-item");

    // Remove unread dot for this chat
    removeUnreadDot(userId);

    // ✅ Search bar clear karo aur recent chats wapas dikhao
    const searchInput = document.getElementById("user-search");
    if (searchInput.value.trim() !== "") {
        searchInput.value = "";
        loadRecentChats();
    }

    try {
        const res = await axios.get(`${API_URL}/messages/conversation/${userId}`, authHeaders());

        const messages = res.data;
        messages.forEach(msg => {
            const senderId = (msg.sender?._id || msg.sender)?.toString();
            const type = senderId === currentUserId ? "sent" : "received";
            appendMessage(msg.text, type, msg._id, msg.isRead);
        });

        scrollToBottom();

        // Mark as read
        await axios.put(`${API_URL}/messages/read/${userId}`, {}, authHeaders());

    } catch (err) {
        console.error("Open chat error:", err);
    }
}

// ============================================================
// 8. SEND MESSAGE
// ============================================================
document.getElementById("send-btn").onclick = sendMessage;
document.getElementById("msg-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
    const input = document.getElementById("msg-input");
    const text = input.value.trim();
    if (!text || !currentReceiverId) return;

    try {
        const res = await axios.post(`${API_URL}/messages`,
            { receiverId: currentReceiverId, text },
            authHeaders()
        );

        appendMessage(text, "sent", res.data._id, false);
        input.value = "";
        scrollToBottom();

        // ✅ FIXED: Send ke baad recent chats reload karo
        // Taake sender ki list mein bhi recipient upar aa jaye
        loadRecentChats();

    } catch (err) {
        const errorMsg = err.response?.data?.error || "";

        if (errorMsg.includes("request sent")) {
            showAlert("🔒 Private account. Message request sent! Wait for approval.");
        } else if (errorMsg.includes("pending")) {
            showAlert("⏳ Your request is still pending approval.");
        } else {
            showAlert(errorMsg || "Error sending message");
        }
    }
}

// ============================================================
// 9. APPEND MESSAGE TO UI
// ============================================================
function appendMessage(text, type, msgId = null, isRead = false) {
    const container = document.getElementById("chat-messages");

    const oldSeenLabel = container.querySelector(".seen-label");
    if (oldSeenLabel) oldSeenLabel.remove();

    const div = document.createElement("div");
    div.className = `msg ${type}`;
    div.innerText = text;
    if (msgId) div.dataset.msgId = msgId.toString();

    container.appendChild(div);

    if (type === "sent" && isRead) {
        addSeenLabel(container);
    }
}

function addSeenLabel(container) {
    const label = document.createElement("div");
    label.className = "seen-label";
    label.innerHTML = `<i class="bi bi-check2-all" style="color: var(--ig-blue);"></i> Seen`;
    container.appendChild(label);
}

// ============================================================
// 10. SOCKET EVENTS
// ============================================================

// ✅ New message receive hona (real-time)
socket.on("newMessage", (message) => {
    const incomingSenderId = (message.sender?._id || message.sender)?.toString();

    if (incomingSenderId === currentReceiverId) {
        // ✅ Active chat mein message append karo
        appendMessage(message.text, "received", message._id, false);
        scrollToBottom();

        // Auto mark as read
        axios.put(`${API_URL}/messages/read/${currentReceiverId}`, {}, authHeaders())
            .catch(err => console.error("Mark read error:", err));
    } else {
        // ✅ Doosri chat ka message — unread dot dikhao
        showUnreadDot(incomingSenderId);
    }

    // ✅ FIXED: Dono cases mein recent chats list reload karo
    // Taake receiver ki list mein sender auto-appear ho
    loadRecentChats();
});

// ✅ Seen event — sender ko pata chalega ke message dekha gaya
socket.on("messagesSeen", ({ by }) => {
    if (by?.toString() === currentReceiverId?.toString()) {
        const container = document.getElementById("chat-messages");

        const oldSeenLabel = container.querySelector(".seen-label");
        if (oldSeenLabel) oldSeenLabel.remove();

        const allMsgs = container.querySelectorAll(".msg.sent");
        if (allMsgs.length > 0) {
            addSeenLabel(container);
            scrollToBottom();
        }
    }
});

// ============================================================
// 11. UNREAD DOT — show/remove on chat list items
// ============================================================
function showUnreadDot(senderId) {
    const userItem = document.querySelector(`.user-item[data-user-id="${senderId}"]`);
    if (userItem && !userItem.querySelector(".unread-dot")) {
        const dot = document.createElement("div");
        dot.className = "unread-dot";
        userItem.appendChild(dot);
    }

    const preview = userItem?.querySelector(".last-msg-preview");
    if (preview) preview.classList.add("unread-preview");
}

function removeUnreadDot(userId) {
    const userItem = document.querySelector(`.user-item[data-user-id="${userId?.toString()}"]`);
    if (userItem) {
        const dot = userItem.querySelector(".unread-dot");
        if (dot) dot.remove();

        const preview = userItem.querySelector(".last-msg-preview");
        if (preview) preview.classList.remove("unread-preview");
    }
}

// ============================================================
// 12. HELPER FUNCTIONS
// ============================================================
function scrollToBottom() {
    const container = document.getElementById("chat-messages");
    container.scrollTop = container.scrollHeight;
}

function showAlert(msg) {
    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
        background: #262626; color: #fff; padding: 12px 24px;
        border-radius: 10px; font-size: 14px; z-index: 9999;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}