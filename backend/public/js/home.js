// ─── Current User ───────────────────────────────────────────
const currentUser = JSON.parse(localStorage.getItem('user')) || {};
const token = localStorage.getItem('token');
const API = 'http://localhost:3001';

const socket = io(API, { auth: { token } });

// ─── DOM ────────────────────────────────────────────────────
const postFeed              = document.getElementById('post-feed');
const uploadModal           = document.getElementById('uploadModal');
const editPostModal         = document.getElementById('editPostModal');
const openUploadBtn         = document.getElementById('open-upload-modal');
const uploadInput           = document.getElementById('uploadImage');
const editImageInput        = document.getElementById('editImage');
const dropzone              = document.getElementById('uploadDropzone');
const editDropzone          = document.getElementById('editDropzone');
const postBtn               = document.getElementById('postBtn');
const saveEditPostBtn       = document.getElementById('saveEditPostBtn');

// ─── Auth headers ───────────────────────────────────────────
function authHeaders(json = false) {
    const h = { 'Authorization': `Bearer ${token}` };
    if (json) h['Content-Type'] = 'application/json';
    return h;
}

// ═══════════════════════════════════════════════════════════
//  SOCKET LISTENERS
// ═══════════════════════════════════════════════════════════
socket.on('postUpdated', (post) => {
    updatePostLikeUI(post._id, post.likes);
});

socket.on('postDeleted', (postId) => {
    document.getElementById(`post-${postId}`)?.remove();
});

socket.on('newComment', (comment) => {
    const postId = comment.post?.toString() || comment.post;
    const commenterId = (comment.user?._id || comment.user)?.toString();

    if (commenterId === currentUser.id?.toString()) {
        refreshInlinePreview(postId);
        return;
    }

    const section = document.getElementById(`comments-section-${postId}`);
    if (section && section.dataset.expanded === 'true') {
        appendCommentToSection(postId, comment);
    }
    refreshInlinePreview(postId);
});

socket.on('commentUpdated', (comment) => {
    const textEl = document.querySelector(`#comment-item-${comment._id} .comment-text`);
    if (textEl) textEl.textContent = comment.text;
});

socket.on('commentDeleted', (commentId) => {
    document.getElementById(`comment-item-${commentId}`)?.remove();
});

socket.on('commentLiked', (comment) => {
    updateCommentLikeUI(comment);
});

socket.on('replyAdded', (comment) => {
    const repliesContainer = document.getElementById(`replies-${comment._id}`);
    if (repliesContainer) {
        repliesContainer.innerHTML = '';
        comment.replies.forEach(r => {
            repliesContainer.appendChild(buildReplyEl(comment._id, r));
        });
    }
});

socket.on('notification', () => {
    const badge = document.getElementById('notif-badge');
    if (badge) {
        const cur = parseInt(badge.textContent) || 0;
        badge.textContent = cur + 1;
        badge.style.display = 'inline';
    }
});

// ═══════════════════════════════════════════════════════════
//  FETCH & RENDER POSTS
// ═══════════════════════════════════════════════════════════
async function fetchPosts() {
    try {
        const res = await fetch(`${API}/post`, { headers: authHeaders() });
        if (!res.ok) throw new Error();
        const posts = await res.json();
        postFeed.innerHTML = '';
        posts.forEach(post => renderPost(post));
    } catch {
        postFeed.innerHTML = '<p class="text-center text-muted mt-4">Could not load posts.</p>';
    }
}

function renderPost(post) {
    if (!post.user) return;

    const isMyPost = post.user._id?.toString() === currentUser.id?.toString();
    const liked = post.likes?.includes(currentUser.id);

    const card = document.createElement('div');
    card.className = 'post-card';
    card.id = `post-${post._id}`;
    card.innerHTML = `
        <div class="post-header">
            <div class="user-info">
                <img src="${post.user.profilePic ? API + '/uploads/' + post.user.profilePic : 'https://via.placeholder.com/40'}" class="user-avatar" onerror="this.onerror=null; this.src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRadJ-YmNxJTg6v9iO22fzR_65KenYJHFB5zg&s';">
                <span class="fw-bold">${post.user.username || ''}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
                ${!isMyPost ? `<button class="btn btn-sm fw-bold text-primary p-0" onclick="handleFollow('${post.user._id}', this)">Follow</button>` : ''}
                ${isMyPost ? `
                <div class="dropdown">
                    <i class="bi bi-three-dots dropdown-toggle" data-bs-toggle="dropdown" style="cursor:pointer"></i>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><button class="dropdown-item" onclick="openEditPost('${post._id}', \`${(post.description||'').replace(/`/g,"'")}\`, '${post.hashtag||''}')">Edit</button></li>
                        <li><button class="dropdown-item text-danger" onclick="deletePost('${post._id}')">Delete</button></li>
                    </ul>
                </div>` : ''}
            </div>
        </div>

        <img src="${API}/uploads/${post.image}" class="post-img" ondblclick="likeAction('${post._id}')" onerror="this.onerror=null; this.src='https://i.sstatic.net/y9DpT.jpg';">

        <div class="post-actions-bar">
            <i class="bi ${liked ? 'bi-heart-fill text-danger' : 'bi-heart'} like-btn" onclick="likeAction('${post._id}')"></i>
            <i class="bi bi-chat comment-icon" onclick="toggleComments('${post._id}')"></i>
        </div>

        <div class="post-details">
            <p class="mb-1 fw-bold likes-count">${post.likes?.length || 0} likes</p>
            <p class="mb-1"><strong>${post.user.username || ''}</strong> ${post.description || ''}</p>
            <p class="text-primary small mb-1">${post.hashtag || ''}</p>

            <div class="inline-comments-preview" id="inline-preview-${post._id}"></div>

            <div class="comments-section" id="comments-section-${post._id}" data-expanded="false" style="display:none;">
                <div class="comments-list" id="comments-list-${post._id}"></div>
                <div class="comment-input-row">
                    <input
                        type="text"
                        class="comment-input"
                        id="comment-input-${post._id}"
                        placeholder="Add a comment..."
                        onkeydown="if(event.key==='Enter') submitComment('${post._id}')"
                    />
                    <button class="comment-post-btn" id="comment-btn-${post._id}" onclick="submitComment('${post._id}')" disabled>Post</button>
                </div>
            </div>
        </div>
    `;
    postFeed.appendChild(card);

    const input = card.querySelector(`#comment-input-${post._id}`);
    const btn = card.querySelector(`#comment-btn-${post._id}`);
    input.addEventListener('input', () => {
        btn.disabled = input.value.trim() === '';
    });

    loadInlinePreview(post._id);
}

// ═══════════════════════════════════════════════════════════
//  TOGGLE COMMENTS
// ═══════════════════════════════════════════════════════════
async function toggleComments(postId) {
    const section = document.getElementById(`comments-section-${postId}`);
    const isExpanded = section.dataset.expanded === 'true';

    if (isExpanded) {
        section.style.display = 'none';
        section.dataset.expanded = 'false';
        return;
    }

    section.style.display = 'block';
    section.dataset.expanded = 'true';

    const list = document.getElementById(`comments-list-${postId}`);
    list.innerHTML = '<p class="text-muted small px-2">Loading...</p>';

    try {
        const res = await fetch(`${API}/comment/${postId}`, { headers: authHeaders() });
        if (!res.ok) throw new Error();
        const comments = await res.json();

        list.innerHTML = '';

        if (comments.length === 0) {
            list.innerHTML = '<p class="text-muted small px-2 py-1">No comments yet. Be the first!</p>';
            return;
        }

        const toShow = comments.slice(0, 3);
        toShow.forEach(c => appendCommentToSection(postId, c));

        if (comments.length > 3) {
            const viewAll = document.createElement('button');
            viewAll.className = 'view-all-comments-btn';
            viewAll.textContent = `View all ${comments.length} comments`;
            viewAll.onclick = () => {
                list.innerHTML = '';
                comments.forEach(c => appendCommentToSection(postId, c));
            };
            list.appendChild(viewAll);
        }

    } catch {
        list.innerHTML = '<p class="text-muted small px-2">Could not load comments.</p>';
    }
}

// ═══════════════════════════════════════════════════════════
//  BUILD COMMENT ELEMENT
// ═══════════════════════════════════════════════════════════
function buildCommentEl(postId, c) {
    const isOwner = (c.user?._id || c.user)?.toString() === currentUser.id?.toString();
    const liked = c.likes?.map(id => id.toString()).includes(currentUser.id?.toString());
    const username = c.user?.username || currentUser.username || '';
    const profilePic = c.user?.profilePic
        ? `${API}/uploads/${c.user.profilePic}`
        : (isOwner && currentUser.profilePic ? `${API}/uploads/${currentUser.profilePic}` : 'https://via.placeholder.com/28');

    const div = document.createElement('div');
    div.className = 'comment-item';
    div.id = `comment-item-${c._id}`;
    div.innerHTML = `
        <img src="${profilePic}" class="comment-avatar">
        <div class="comment-body">
            <div class="comment-main-row">
                <span class="comment-username">${username}</span>
                <span class="comment-text">${c.text}</span>
            </div>

            <!-- Action buttons row -->
            <div class="comment-actions-row">
                <button class="comment-action-btn" onclick="toggleReplyInput('${c._id}')">Reply</button>
                ${isOwner ? `
                <button class="comment-action-btn" onclick="startEditComment('${c._id}', '${postId}')">Edit</button>
                <button class="comment-action-btn danger" onclick="deleteComment('${c._id}', '${postId}')">Delete</button>
                ` : ''}
            </div>

            <!-- Inline edit input — hidden by default -->
            <div class="edit-input-row" id="edit-row-${c._id}" style="display:none;">
                <input type="text" class="edit-input" id="edit-input-${c._id}" value="${c.text}" />
                <button class="comment-post-btn" onclick="submitEditComment('${c._id}', '${postId}')">Save</button>
                <button class="comment-action-btn" onclick="cancelEditComment('${c._id}', '${escapeAttr(c.text)}')">Cancel</button>
            </div>

            <!-- Reply input — hidden by default -->
            <div class="reply-input-row" id="reply-input-row-${c._id}" style="display:none;">
                <input type="text" class="edit-input" id="reply-input-${c._id}" placeholder="Write a reply..." />
                <button class="comment-post-btn" id="reply-btn-${c._id}" onclick="submitReply('${c._id}')" disabled>Reply</button>
            </div>

            <!-- Replies list -->
            <div class="replies-list" id="replies-${c._id}"></div>
        </div>

        <button class="comment-like-btn" onclick="likeComment('${c._id}', this)">
            <i class="bi ${liked ? 'bi-heart-fill text-danger' : 'bi-heart'}"></i>
            <span>${c.likeCount || 0}</span>
        </button>
    `;

    // Reply input listener
    const replyInput = div.querySelector(`#reply-input-${c._id}`);
    const replyBtn = div.querySelector(`#reply-btn-${c._id}`);
    replyInput.addEventListener('input', () => {
        replyBtn.disabled = replyInput.value.trim() === '';
    });

    // Render existing replies
    if (c.replies?.length) {
        const repliesContainer = div.querySelector(`#replies-${c._id}`);
        c.replies.forEach(r => repliesContainer.appendChild(buildReplyEl(c._id, r)));
    }

    return div;
}

// ═══════════════════════════════════════════════════════════
//  APPEND COMMENT
// ═══════════════════════════════════════════════════════════
function appendCommentToSection(postId, c) {
    const list = document.getElementById(`comments-list-${postId}`);
    if (!list) return;

    // Duplicate check
    if (document.getElementById(`comment-item-${c._id}`)) return;

    const el = buildCommentEl(postId, c);
    const viewAllBtn = list.querySelector('.view-all-comments-btn');
    if (viewAllBtn) {
        list.insertBefore(el, viewAllBtn);
    } else {
        list.appendChild(el);
    }
}

// ═══════════════════════════════════════════════════════════
//  EDIT COMMENT — Inline
// ═══════════════════════════════════════════════════════════
function startEditComment(commentId, postId) {
    // Hide comment text, show edit input
    const mainRow = document.querySelector(`#comment-item-${commentId} .comment-main-row`);
    const editRow = document.getElementById(`edit-row-${commentId}`);
    if (mainRow) mainRow.style.display = 'none';
    if (editRow) editRow.style.display = 'flex';

    // Focus input
    const input = document.getElementById(`edit-input-${commentId}`);
    if (input) { input.focus(); input.select(); }
}

function cancelEditComment(commentId, originalText) {
    const mainRow = document.querySelector(`#comment-item-${commentId} .comment-main-row`);
    const editRow = document.getElementById(`edit-row-${commentId}`);
    if (mainRow) mainRow.style.display = '';
    if (editRow) editRow.style.display = 'none';

    // Restore original text in input
    const input = document.getElementById(`edit-input-${commentId}`);
    if (input) input.value = originalText;
}

async function submitEditComment(commentId, postId) {
    const input = document.getElementById(`edit-input-${commentId}`);
    const text = input?.value.trim();
    if (!text) return;

    try {
        const res = await fetch(`${API}/comment/${commentId}`, {
            method: 'PUT',
            headers: authHeaders(true),
            body: JSON.stringify({ text })
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();

        // Update displayed text
        const textEl = document.querySelector(`#comment-item-${commentId} .comment-text`);
        if (textEl) textEl.textContent = updated.text;

        // Update edit input value too
        if (input) input.value = updated.text;

        // Hide edit row, show main row
        cancelEditComment(commentId, updated.text);

        // Refresh inline preview
        refreshInlinePreview(postId);

    } catch {
        alert('Could not edit comment. Try again.');
    }
}

// ═══════════════════════════════════════════════════════════
//  REPLY — Inline
// ═══════════════════════════════════════════════════════════
function toggleReplyInput(commentId) {
    const row = document.getElementById(`reply-input-row-${commentId}`);
    if (!row) return;
    const isVisible = row.style.display !== 'none';
    row.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
        document.getElementById(`reply-input-${commentId}`)?.focus();
    }
}

async function submitReply(commentId) {
    const input = document.getElementById(`reply-input-${commentId}`);
    const btn = document.getElementById(`reply-btn-${commentId}`);
    const text = input?.value.trim();
    if (!text) return;

    btn.disabled = true;
    btn.textContent = 'Posting...';

    try {
        const res = await fetch(`${API}/comment/${commentId}/reply`, {
            method: 'POST',
            headers: authHeaders(true),
            body: JSON.stringify({ text })
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();

        // Render replies
        const repliesContainer = document.getElementById(`replies-${commentId}`);
        if (repliesContainer) {
            repliesContainer.innerHTML = '';
            updated.replies.forEach(r => repliesContainer.appendChild(buildReplyEl(commentId, r)));
        }

        input.value = '';
        btn.disabled = true;
        btn.textContent = 'Reply';

        // Hide reply input
        document.getElementById(`reply-input-row-${commentId}`).style.display = 'none';

    } catch {
        btn.disabled = false;
        btn.textContent = 'Reply';
        alert('Could not post reply. Try again.');
    }
}

// ═══════════════════════════════════════════════════════════
//  BUILD REPLY ELEMENT
// ═══════════════════════════════════════════════════════════
function buildReplyEl(commentId, r) {
    const isOwner = (r.user?._id || r.user)?.toString() === currentUser.id?.toString();
    const liked = r.likes?.map(id => id.toString()).includes(currentUser.id?.toString());
    const username = r.user?.username || '';
    const profilePic = r.user?.profilePic
        ? `${API}/uploads/${r.user.profilePic}`
        : 'https://via.placeholder.com/24';

    const div = document.createElement('div');
    div.className = 'reply-item';
    div.id = `reply-item-${r._id}`;
    div.innerHTML = `
        <img src="${profilePic}" class="reply-avatar">
        <div class="comment-body">
            <div class="comment-main-row">
                <span class="comment-username">${username}</span>
                <span class="comment-text">${r.text}</span>
            </div>
            ${isOwner ? `
            <div class="comment-actions-row">
                <button class="comment-action-btn" onclick="startEditReply('${commentId}', '${r._id}')">Edit</button>
                <button class="comment-action-btn danger" onclick="deleteReply('${commentId}', '${r._id}')">Delete</button>
            </div>
            <div class="edit-input-row" id="edit-reply-row-${r._id}" style="display:none;">
                <input type="text" class="edit-input" id="edit-reply-input-${r._id}" value="${r.text}" />
                <button class="comment-post-btn" onclick="submitEditReply('${commentId}', '${r._id}')">Save</button>
                <button class="comment-action-btn" onclick="cancelEditReply('${r._id}', '${escapeAttr(r.text)}')">Cancel</button>
            </div>
            ` : ''}
        </div>
        <button class="comment-like-btn" onclick="likeReply('${commentId}', '${r._id}', this)">
            <i class="bi ${liked ? 'bi-heart-fill text-danger' : 'bi-heart'}"></i>
            <span>${r.likeCount || 0}</span>
        </button>
    `;
    return div;
}

// ═══════════════════════════════════════════════════════════
//  EDIT REPLY — Inline
// ═══════════════════════════════════════════════════════════
function startEditReply(commentId, replyId) {
    const mainRow = document.querySelector(`#reply-item-${replyId} .comment-main-row`);
    const editRow = document.getElementById(`edit-reply-row-${replyId}`);
    if (mainRow) mainRow.style.display = 'none';
    if (editRow) editRow.style.display = 'flex';
    document.getElementById(`edit-reply-input-${replyId}`)?.focus();
}

function cancelEditReply(replyId, originalText) {
    const mainRow = document.querySelector(`#reply-item-${replyId} .comment-main-row`);
    const editRow = document.getElementById(`edit-reply-row-${replyId}`);
    if (mainRow) mainRow.style.display = '';
    if (editRow) editRow.style.display = 'none';
    const input = document.getElementById(`edit-reply-input-${replyId}`);
    if (input) input.value = originalText;
}

async function submitEditReply(commentId, replyId) {
    const input = document.getElementById(`edit-reply-input-${replyId}`);
    const text = input?.value.trim();
    if (!text) return;

    try {
        const res = await fetch(`${API}/comment/${commentId}/reply/${replyId}`, {
            method: 'PUT',
            headers: authHeaders(true),
            body: JSON.stringify({ text })
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        const reply = updated.replies.find(r => r._id?.toString() === replyId);

        const textEl = document.querySelector(`#reply-item-${replyId} .comment-text`);
        if (textEl && reply) textEl.textContent = reply.text;

        cancelEditReply(replyId, reply?.text || text);

    } catch {
        alert('Could not edit reply. Try again.');
    }
}

// ═══════════════════════════════════════════════════════════
//  DELETE REPLY
// ═══════════════════════════════════════════════════════════
async function deleteReply(commentId, replyId) {
    if (!confirm('Delete this reply?')) return;
    try {
        const res = await fetch(`${API}/comment/${commentId}/reply/${replyId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (res.ok) document.getElementById(`reply-item-${replyId}`)?.remove();
    } catch {}
}

// ═══════════════════════════════════════════════════════════
//  LIKE REPLY
// ═══════════════════════════════════════════════════════════
async function likeReply(commentId, replyId, btn) {
    try {
        const res = await fetch(`${API}/comment/${commentId}/reply/${replyId}/like`, {
            method: 'POST',
            headers: authHeaders()
        });
        if (!res.ok) return;
        const updated = await res.json();
        const reply = updated.replies.find(r => r._id?.toString() === replyId);
        if (reply && btn) {
            const liked = reply.likes?.map(id => id.toString()).includes(currentUser.id?.toString());
            btn.innerHTML = `<i class="bi ${liked ? 'bi-heart-fill text-danger' : 'bi-heart'}"></i> <span>${reply.likeCount || 0}</span>`;
        }
    } catch {}
}

// ═══════════════════════════════════════════════════════════
//  SUBMIT COMMENT
// ═══════════════════════════════════════════════════════════
async function submitComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const btn = document.getElementById(`comment-btn-${postId}`);
    const text = input?.value.trim();
    if (!text) return;

    btn.disabled = true;
    btn.textContent = 'Posting...';

    try {
        const res = await fetch(`${API}/comment/${postId}`, {
            method: 'POST',
            headers: authHeaders(true),
            body: JSON.stringify({ post: postId, text })
        });

        if (!res.ok) throw new Error();
        const comment = await res.json();

        // Inject user if not populated
        if (!comment.user?.username) {
            comment.user = {
                _id: currentUser.id,
                username: currentUser.username,
                profilePic: currentUser.profilePic
            };
        }

        const section = document.getElementById(`comments-section-${postId}`);
        if (section.dataset.expanded === 'true') {
            const viewAllBtn = section.querySelector('.view-all-comments-btn');
            if (viewAllBtn) viewAllBtn.remove();
            appendCommentToSection(postId, comment);
        }

        refreshInlinePreview(postId);
        input.value = '';
        btn.disabled = true;
        btn.textContent = 'Post';

    } catch {
        btn.disabled = false;
        btn.textContent = 'Post';
    }
}

// ═══════════════════════════════════════════════════════════
//  INLINE PREVIEW
// ═══════════════════════════════════════════════════════════
async function loadInlinePreview(postId) {
    try {
        const res = await fetch(`${API}/comment/${postId}`, { headers: authHeaders() });
        if (!res.ok) return;
        const comments = await res.json();
        renderInlinePreview(postId, comments);
    } catch {}
}

function renderInlinePreview(postId, comments) {
    const container = document.getElementById(`inline-preview-${postId}`);
    if (!container) return;
    container.innerHTML = '';
    comments.slice(0, 2).forEach(c => {
        const p = document.createElement('p');
        p.className = 'inline-comment-line';
        p.innerHTML = `<strong>${c.user?.username || ''}</strong> <span>${c.text}</span>`;
        container.appendChild(p);
    });
}

async function refreshInlinePreview(postId) {
    try {
        const res = await fetch(`${API}/comment/${postId}`, { headers: authHeaders() });
        if (!res.ok) return;
        const comments = await res.json();
        renderInlinePreview(postId, comments);
    } catch {}
}

// ═══════════════════════════════════════════════════════════
//  LIKE POST
// ═══════════════════════════════════════════════════════════
function updatePostLikeUI(postId, likes) {
    const card = document.getElementById(`post-${postId}`);
    if (!card) return;
    const icon = card.querySelector('.like-btn');
    const count = card.querySelector('.likes-count');
    if (icon) {
        const liked = likes.map(id => id.toString()).includes(currentUser.id?.toString());
        icon.className = `bi ${liked ? 'bi-heart-fill text-danger' : 'bi-heart'} like-btn`;
    }
    if (count) count.textContent = `${likes.length} likes`;
}

async function likeAction(postId) {
    try {
        const res = await fetch(`${API}/post/like/${postId}`, { method: 'PUT', headers: authHeaders() });
        if (!res.ok) return;
        const post = await res.json();
        updatePostLikeUI(postId, post.likes);
    } catch {}
}

// ═══════════════════════════════════════════════════════════
//  LIKE COMMENT
// ═══════════════════════════════════════════════════════════
async function likeComment(commentId, btn) {
    try {
        const res = await fetch(`${API}/comment/${commentId}/like`, {
            method: 'POST',
            headers: authHeaders()
        });
        if (!res.ok) return;
        const updated = await res.json();
        updateCommentLikeUI(updated);
    } catch {}
}

function updateCommentLikeUI(comment) {
    const btn = document.querySelector(`#comment-item-${comment._id} .comment-like-btn`);
    if (!btn) return;
    const liked = comment.likes?.map(id => id.toString()).includes(currentUser.id?.toString());
    btn.innerHTML = `<i class="bi ${liked ? 'bi-heart-fill text-danger' : 'bi-heart'}"></i> <span>${comment.likeCount || 0}</span>`;
}

// ═══════════════════════════════════════════════════════════
//  DELETE COMMENT
// ═══════════════════════════════════════════════════════════
async function deleteComment(commentId, postId) {
    if (!confirm('Delete this comment?')) return;
    try {
        const res = await fetch(`${API}/comment/${commentId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (res.ok) {
            document.getElementById(`comment-item-${commentId}`)?.remove();
            refreshInlinePreview(postId);
        }
    } catch {}
}

// ═══════════════════════════════════════════════════════════
//  DELETE POST
// ═══════════════════════════════════════════════════════════
async function deletePost(postId) {
    if (!confirm('Delete this post?')) return;
    try {
        const res = await fetch(`${API}/post/delete/${postId}`, { method: 'DELETE', headers: authHeaders() });
        if (res.ok) document.getElementById(`post-${postId}`)?.remove();
    } catch {}
}

// ═══════════════════════════════════════════════════════════
//  EDIT POST
// ═══════════════════════════════════════════════════════════
function openEditPost(postId, description, hashtag) {
    document.getElementById('editPostId').value = postId;
    document.getElementById('editPostDescription').value = description;
    document.getElementById('editPostHashtag').value = hashtag;
    document.getElementById('editImagePreview').innerHTML = '';
    editPostModal.style.display = 'flex';
}

document.getElementById('closeEditPostModal').onclick = () => {
    editPostModal.style.display = 'none';
};

editDropzone.onclick = () => editImageInput.click();
editImageInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        document.getElementById('editImagePreview').innerHTML = `<img src="${ev.target.result}" style="width:100%;border-radius:8px;">`;
    };
    reader.readAsDataURL(file);
};

saveEditPostBtn.onclick = async () => {
    const postId = document.getElementById('editPostId').value;
    const formData = new FormData();
    formData.append('description', document.getElementById('editPostDescription').value);
    formData.append('hashtag', document.getElementById('editPostHashtag').value);
    const file = editImageInput.files[0];
    if (file) formData.append('image', file);

    try {
        saveEditPostBtn.disabled = true;
        saveEditPostBtn.textContent = 'Saving...';
        const res = await fetch(`${API}/post/edit/${postId}`, {
            method: 'PUT',
            body: formData,
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            editPostModal.style.display = 'none';
            fetchPosts();
        }
    } catch {}
    finally {
        saveEditPostBtn.disabled = false;
        saveEditPostBtn.textContent = 'Save Changes';
    }
};

// ═══════════════════════════════════════════════════════════
//  UPLOAD POST MODAL
// ═══════════════════════════════════════════════════════════
openUploadBtn.onclick = () => uploadModal.style.display = 'flex';
document.getElementById('closeUploadModal').onclick = () => {
    uploadModal.style.display = 'none';
    resetUploadModal();
};
dropzone.onclick = () => uploadInput.click();

uploadInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        document.getElementById('imagePreview').innerHTML = `<img src="${ev.target.result}" style="width:100%;border-radius:8px;">`;
        dropzone.querySelector('i').style.display = 'none';
    };
    reader.readAsDataURL(file);
};

postBtn.onclick = async () => {
    const file = uploadInput.files[0];
    if (!file) return alert('Select an image first!');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('description', document.getElementById('postDescription').value);
    formData.append('hashtag', document.getElementById('postHashtags').value);
    try {
        postBtn.disabled = true;
        postBtn.textContent = 'Posting...';
        const res = await fetch(`${API}/post`, {
            method: 'POST',
            body: formData,
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            uploadModal.style.display = 'none';
            resetUploadModal();
            fetchPosts();
        }
    } catch {}
    finally {
        postBtn.disabled = false;
        postBtn.textContent = 'Share Post';
    }
};

function resetUploadModal() {
    uploadInput.value = '';
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('postDescription').value = '';
    document.getElementById('postHashtags').value = '';
    dropzone.querySelector('i').style.display = 'block';
}

// ═══════════════════════════════════════════════════════════
//  FOLLOW
// ═══════════════════════════════════════════════════════════
async function handleFollow(userId, btn) {
    try {
        const res = await fetch(`${API}/user/follow/${userId}`, {
            method: 'POST',
            headers: authHeaders()
        });
        if (res.ok) btn.textContent = btn.textContent === 'Follow' ? 'Following' : 'Follow';
    } catch {}
}

// ═══════════════════════════════════════════════════════════
//  HELPER
// ═══════════════════════════════════════════════════════════
function escapeAttr(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ─── Init ────────────────────────────────────────────────────
fetchPosts();