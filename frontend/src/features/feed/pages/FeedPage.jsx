import { useState, useEffect, useContext } from "react";
import Navbar from "../components/Navbar";
import UploadModal from "../components/UploadModal";
import PostCard from "../components/PostCard";
import StoriesBar from "../../story/components/StoriesBar";
import { getPosts } from "../services/postService";
import { useSocket } from "../../../context/SocketContext";
import { AuthContext } from "../../auth/context/AuthContext";
import "../styles/feed.css";

const FeedPage = () => {
  const socket = useSocket();
  const { user: currentUser } = useContext(AuthContext);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("postUpdated", (updatedPost) => {
      setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
    });

    socket.on("postDeleted", (postId) => {
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    });

    socket.on("newPost", (newPost) => {
      setPosts((prev) => [newPost, ...prev]);
    });

    return () => {
      socket.off("postUpdated");
      socket.off("postDeleted");
      socket.off("newPost");
    };
  }, [socket]);

  const handleUploadSuccess = () => {
    console.log("Post uploaded successfully!");
    fetchPosts();
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  return (
    <div className="feed-layout">
      <Navbar onUploadClick={() => setIsUploadModalOpen(true)} />
      <main className="feed-content">
        <StoriesBar currentUser={currentUser} />
        <header className="feed-header">
          <h1>Public Hub</h1>
        </header>
        {loading ? (
          <div className="flex-center" style={{height: '50vh'}}>
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="posts-container">
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  onPostDelete={handlePostDelete} 
                  onPostUpdate={handlePostUpdate}
                />
              ))
            ) : (
              <div className="no-posts glass">
                <p>No posts yet. Be the first to share!</p>
              </div>
            )}
          </div>
        )}
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default FeedPage;
