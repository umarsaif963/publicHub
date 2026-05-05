const API = 'http://localhost:3001';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

const socket = io(API);

const feed = document.getElementById('notificationsFeed');
const loading = document.getElementById('notifLoading');

// ─── Notification type config ────────────────────────────────
const NOTIF_CONFIG = {
    like:         { icon: 'bi-heart-fill',        color: '#e0245e', action: 'liked your post' },
    comment:      { icon: 'bi-chat-fill',          color: '#1da1f2', action: 'commented on your post' },
    follow:       { icon: 'bi-person-check-fill',  color: '#28a745', action: 'started following you' },
    post:         { icon: 'bi-image-fill',          color: '#ff9800', action: 'uploaded a new post' },
    reply:        { icon: 'bi-reply-fill',          color: '#9c27b0', action: 'replied to your comment' },
    like_comment: { icon: 'bi-heart-fill',          color: '#e91e63', action: 'liked your comment' },
    like_reply:   { icon: 'bi-heart-fill',          color: '#e91e63', action: 'liked your reply' },
};

// ─── Render one notification ─────────────────────────────────
// ✅ FIX: ab yeh div return karta hai — prepend/append caller decide karta hai
function renderNotification(notif) {
    const cfg = NOTIF_CONFIG[notif.type] || { icon: 'bi-bell-fill', color: '#888', action: 'did something' };
    const username = notif.sender?.username || 'Someone';
    const avatar = notif.sender?.profilePic
        ? `${API}/uploads/${notif.sender.profilePic}`
        : 'https://via.placeholder.com/44';
    const time = formatTime(notif.createdAt);

    const div = document.createElement('div');
    div.className = 'notif-item' + (notif.isRead ? '' : ' unread');
    div.innerHTML = `
        <div class="notif-avatar-wrap">
            <img src="${avatar}" class="notif-avatar" alt="${username}" onerror="this.onerror=null; this.src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRadJ-YmNxJTg6v9iO22fzR_65KenYJHFB5zg&amp;s';">
            <span class="notif-type-dot" style="background:${cfg.color};">
                <i class="bi ${cfg.icon}"></i>
            </span>
        </div>
        <div class="notif-body">
            <p class="notif-text"><strong>${username}</strong> ${cfg.action}</p>
            <span class="notif-time">${time}</span>
        </div>
        ${notif.post?.image ? `<img src="${API}/uploads/${notif.post.image}" class="notif-post-thumb" alt="post" onerror="this.onerror=null; this.src='https://i.sstatic.net/y9DpT.jpg';">` : ''}
    `;
    return div;
}

// ─── Relative time ────────────────────────────────────────────
function formatTime(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

// ─── Fetch all notifications ──────────────────────────────────
async function loadNotifications() {
    try {
        const res = await fetch(`${API}/notification`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        loading?.remove();

        if (!data.length) {
            feed.innerHTML = '<div class="notif-empty"><i class="bi bi-bell-slash"></i><p>No notifications yet</p></div>';
            return;
        }

        // ✅ FIX: Backend latest-first bhejta hai (createdAt: -1)
        // appendChild se order sahi rahega — pehla = sabse naya upar
        data.forEach(notif => feed.appendChild(renderNotification(notif)));

    } catch {
        loading?.remove();
        feed.innerHTML = '<div class="notif-empty"><i class="bi bi-wifi-off"></i><p>Could not load notifications</p></div>';
    }
}

// ─── Realtime — naya notification sabse upar ─────────────────
// ✅ FIX: Real-time wala prepend rakho — yeh sach mein naya hai
socket.on('notification', (data) => {
    const div = renderNotification({ ...data, isRead: false });
    feed.prepend(div);
});

loadNotifications();