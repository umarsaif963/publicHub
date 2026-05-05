// ============================================================
//  profile.js — Profile Page Logic
// ============================================================

const API_URL = "http://localhost:3001";
const token = localStorage.getItem("token");
const loggedInUserId = localStorage.getItem("userId"); // ✅ Apna ID hamesha yahan se

// ✅ FIX: URL se userId lo — doosre ka profile bhi open ho sake
// Agar URL mein ?userId=xxx hai toh woh lo, warna apna profile
const params = new URLSearchParams(window.location.search);
const currentUserId = params.get("userId") || loggedInUserId;

// Token check
if (!token || !loggedInUserId) {
    window.location.href = "/login.html";
}

// ✅ Native fetch helper
const authFetch = async (url, method = "GET", body = null) => {
    const options = {
        method,
        headers: {
            "Authorization": `Bearer ${token}`
        }
    };

    // FormData ke liye Content-Type set mat karo — browser khud set karta hai
    if (body instanceof FormData) {
        options.body = body;
    } else if (body) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    const data = await res.json();

    if (!res.ok) {
        const err = new Error(data.error || "Request failed");
        err.data = data;
        throw err;
    }
    return data;
};

// Selected file for upload
let selectedFile = null;

// ============================================================
// 1. PAGE LOAD — Profile + Posts fetch karo
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
    loadProfile();
    loadUserPosts();
});

// ============================================================
// 2. LOAD PROFILE
// ============================================================
async function loadProfile() {
    try {
        const user = await authFetch(`${API_URL}/user/profile/${currentUserId}`);

        // Nav username
        document.getElementById("nav-username").textContent = user.username;

        // Profile pic
        const profilePicEl = document.getElementById("profile-pic");
        const picPreviewEl = document.getElementById("pic-preview");

        if (user.profilePic) {
            const picUrl = `${API_URL}/uploads/${user.profilePic}`;
            profilePicEl.src = picUrl;
            picPreviewEl.src = picUrl;
        }

        // Username
        document.getElementById("profile-username").textContent = user.username;
        document.getElementById("edit-username").value = user.username;

        // Stats
        document.getElementById("post-count").textContent = user.postCount || 0;
        document.getElementById("followers-count").textContent = user.followersCount || 0;
        document.getElementById("following-count").textContent = user.followingCount || 0;

        // Private badge
        if (user.isPrivate) {
            document.getElementById("private-badge").style.display = "inline";
        }

        // ✅ FIX: Apna profile hai ya doosre ka — buttons accordingly dikhaao
        const isOwnProfile = currentUserId === loggedInUserId;

        // Edit + Logout sirf apne profile pe
        const editBtn = document.getElementById("edit-btn");
        const logoutBtn = document.getElementById("logout-btn");
        // Follow button sirf doosre ke profile pe
        const followBtn = document.getElementById("follow-btn");

        if (editBtn) editBtn.style.display = isOwnProfile ? "block" : "none";
        if (logoutBtn) logoutBtn.style.display = isOwnProfile ? "block" : "none";
        if (followBtn) followBtn.style.display = isOwnProfile ? "none" : "block";

    } catch (err) {
        console.error("Profile load error:", err);
    }
}

// ============================================================
// 3. LOAD USER POSTS
// ============================================================
async function loadUserPosts() {
    const grid = document.getElementById("posts-grid");
    const noPosts = document.getElementById("no-posts");

    try {
        const posts = await authFetch(`${API_URL}/user/posts/${currentUserId}`);

        if (posts.length === 0) {
            noPosts.style.display = "block";
            return;
        }

        grid.innerHTML = "";

        posts.forEach(post => {
            const div = document.createElement("div");
            div.className = "post-thumb";

            if (post.image) {
                div.innerHTML = `
                    <img src="${API_URL}/uploads/${post.image}" alt="post" loading="lazy" onerror="this.onerror=null; this.src='https://i.sstatic.net/y9DpT.jpg';">
                    <div class="like-overlay">
                        <i class="bi bi-heart-fill"></i> ${post.likeCount || 0}
                    </div>`;
            } else {
                // Text only post
                div.innerHTML = `
                    <div class="no-img">
                        <p>${post.description || ""}</p>
                    </div>
                    <div class="like-overlay">
                        <i class="bi bi-heart-fill"></i> ${post.likeCount || 0}
                    </div>`;
            }

            grid.appendChild(div);
        });

        // Post count update
        document.getElementById("post-count").textContent = posts.length;

    } catch (err) {
        console.error("Posts load error:", err);
        noPosts.style.display = "block";
    }
}

// ============================================================
// 4. EDIT MODAL — Open / Close
// ============================================================
function openEditModal() {
    document.getElementById("edit-modal").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("edit-modal").style.display = "none";
    selectedFile = null;
}

// Close modal if overlay click
document.getElementById("edit-modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("edit-modal")) {
        closeEditModal();
    }
});

// ============================================================
// 5. PROFILE PIC PREVIEW
// ============================================================
function previewPic(event) {
    const file = event.target.files[0];
    if (!file) return;

    selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById("pic-preview").src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ============================================================
// 6. SAVE PROFILE
// ============================================================
async function saveProfile() {
    const username = document.getElementById("edit-username").value.trim();
    const saveBtn = document.querySelector(".save-btn");
    const saveBtnText = document.getElementById("save-btn-text");

    if (!username) {
        showToast("Username khali nahi ho sakta!");
        return;
    }

    // Loading state
    saveBtn.disabled = true;
    saveBtnText.textContent = "Saving...";

    try {
        // FormData use karo — image bhi bhejni ho sakti hai
        const formData = new FormData();
        formData.append("username", username);
        if (selectedFile) {
            formData.append("profilePic", selectedFile);
        }

        const updatedUser = await authFetch(`${API_URL}/user/edit`, "PUT", formData);

        // UI update
        document.getElementById("profile-username").textContent = updatedUser.username;
        document.getElementById("nav-username").textContent = updatedUser.username;

        if (updatedUser.profilePic) {
            const picUrl = `${API_URL}/uploads/${updatedUser.profilePic}`;
            document.getElementById("profile-pic").src = picUrl;
        }

        closeEditModal();
        showToast("✅ Profile updated successfully!");

    } catch (err) {
        showToast(err.data?.error || "Profile update failed");
    } finally {
        saveBtn.disabled = false;
        saveBtnText.textContent = "Save Changes";
    }
}

// ============================================================
// 7. LOGOUT
// ============================================================
function logout() {
    if (!confirm("Are you want to logout?")) return;
    localStorage.clear();
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "/login.html";
}

// ============================================================
// 8. TOAST NOTIFICATION
// ============================================================
function showToast(msg) {
    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
        background: #262626; color: #fff; padding: 12px 24px;
        border-radius: 10px; font-size: 14px; z-index: 9999;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        white-space: nowrap;
    `;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}