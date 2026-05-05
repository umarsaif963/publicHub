import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../auth/context/AuthContext";
import { getProfile, getUserPosts, editProfile } from "../../auth/services/userService";
import ProfileHeader from "../components/ProfileHeader";
import ProfileInfo from "../components/ProfileInfo";
import ProfilePosts from "../components/ProfilePosts";
// import PostPopup from "../components/PostPopup";
import "../../feed/styles/feed.css";
import "../styles/profile.css";

const ProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);

  const baseUrl = "http://localhost:3001";
  const defaultAvatar = "https://e7.pngegg.com/pngimages/954/550/png-clipart-silhouette-silhouette-animals-head.png";

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const profileData = await getProfile(userId);
      setProfile(profileData);
      setEditName(profileData.username);

      const postsData = await getUserPosts(userId);
      setPosts(postsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (isOwnProfile) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);
    
    try {
      const updatedUser = await editProfile(formData);
      setProfile(prev => ({ ...prev, profilePic: updatedUser.profilePic }));
      login({ ...currentUser, profilePic: updatedUser.profilePic }, localStorage.getItem("token"));
    } catch (err) {
      alert("Failed to update avatar");
    }
  };

  const handleUpdateUsername = async () => {
    if (!editName.trim()) return;
    const formData = new FormData();
    formData.append("username", editName);

    try {
      const updatedUser = await editProfile(formData);
      setProfile(prev => ({ ...prev, username: updatedUser.username }));
      login({ ...currentUser, username: updatedUser.username }, localStorage.getItem("token"));
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update username");
    }
  };

  if (loading) return <div className="flex-center" style={{height: '100vh'}}><div className="loading-spinner"></div></div>;
  if (!profile) return <div className="flex-center">User not found</div>;

  return (
    <div className="profile-container glass">
      <ProfileHeader onBackClick={() => navigate("/feed")} />

      <ProfileInfo 
        profile={profile}
        isOwnProfile={isOwnProfile}
        isEditing={isEditing}
        editName={editName}
        setEditName={setEditName}
        setIsEditing={setIsEditing}
        handleUpdateUsername={handleUpdateUsername}
        handleAvatarClick={handleAvatarClick}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
        baseUrl={baseUrl}
        defaultAvatar={defaultAvatar}
      />

      <ProfilePosts 
        posts={posts} 
        onPostClick={setSelectedPost} 
        baseUrl={baseUrl} 
      />

      {selectedPost && (
        <PostPopup 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
          baseUrl={baseUrl}
        />
      )}
    </div>
  );
};

export default ProfilePage;

