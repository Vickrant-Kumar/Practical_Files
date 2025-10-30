/**
 * server.js
 * Single-file Blog Platform with users, posts, comments, JWT auth.
 *
 * Usage:
 * 1. Save as server.js
 * 2. npm init -y
 * 3. npm install express mongoose bcryptjs jsonwebtoken cors
 * 4. Start MongoDB locally or set MONGODB_URI env to Atlas URI
 * 5. node server.js
 * 6. Open http://localhost:4000
 *
 * Notes:
 * - JWT_SECRET: change in production, can set via environment variable.
 * - This example uses polling (every 4s) in frontend to simulate real-time updates.
 */

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

// === CONFIG ===
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret_jwt_key_change_me";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/blog_platform_demo";

// === MONGOOSE MODELS ===
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  displayName: String,
  bio: String,
});

const CommentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User" },
  text: String,
  createdAt: { type: Date, default: Date.now },
});

const PostSchema = new Schema({
  title: String,
  content: String,
  author: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  comments: [CommentSchema],
});

const User = mongoose.model("User", UserSchema);
const Post = mongoose.model("Post", PostSchema);

// === HELPERS ===
function generateToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
    expiresIn: "6h",
  });
}

async function authMiddleware(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ message: "Missing Authorization" });
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res.status(401).json({ message: "Bad Authorization format" });

  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    const user = await User.findById(payload.id).select("-passwordHash");
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// === AUTH ROUTES ===

// Signup
app.post("/api/signup", async (req, res) => {
  const { username, password, displayName = "", bio = "" } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "username and password required" });
  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ message: "username taken" });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = new User({ username, passwordHash: hash, displayName, bio });
    await user.save();
    const token = generateToken(user);
    res.json({ message: "signup successful", token, user: { id: user._id, username, displayName, bio } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "username and password required" });
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "invalid credentials" });
    const token = generateToken(user);
    res.json({ message: "login successful", token, user: { id: user._id, username: user.username, displayName: user.displayName, bio: user.bio } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});

// Get current user profile
app.get("/api/me", authMiddleware, (req, res) => {
  const { _id, username, displayName, bio } = req.user;
  res.json({ id: _id, username, displayName, bio });
});

// === POSTS & COMMENTS ROUTES ===

// Create post (protected)
app.post("/api/posts", authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ message: "title and content required" });
  const post = new Post({ title, content, author: req.user._id });
  await post.save();
  await post.populate("author", "username displayName");
  res.json(post);
});

// List posts (public) - newest first, populate author and comments' authors
app.get("/api/posts", async (req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate("author", "username displayName")
    .populate("comments.author", "username displayName");
  res.json(posts);
});

// Get single post
app.get("/api/posts/:id", async (req, res) => {
  const p = await Post.findById(req.params.id)
    .populate("author", "username displayName")
    .populate("comments.author", "username displayName");
  if (!p) return res.status(404).json({ message: "post not found" });
  res.json(p);
});

// Update post (protected + ownership)
app.put("/api/posts/:id", authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "post not found" });
  if (!post.author.equals(req.user._id)) return res.status(403).json({ message: "not your post" });
  post.title = title || post.title;
  post.content = content || post.content;
  post.updatedAt = new Date();
  await post.save();
  await post.populate("author", "username displayName");
  res.json(post);
});

// Delete post (protected + ownership)
app.delete("/api/posts/:id", authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "post not found" });
  if (!post.author.equals(req.user._id)) return res.status(403).json({ message: "not your post" });
  await post.remove();
  res.json({ message: "post deleted" });
});

// Add comment to post (protected)
app.post("/api/posts/:id/comments", authMiddleware, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "text required" });
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "post not found" });
  const comment = { author: req.user._id, text };
  post.comments.push(comment);
  await post.save();
  await post.populate("comments.author", "username displayName");
  res.json(post);
});

// Delete comment (protected, allowed for comment owner or post owner)
app.delete("/api/posts/:postId/comments/:commentId", authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.postId).populate("author");
  if (!post) return res.status(404).json({ message: "post not found" });
  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ message: "comment not found" });
  const isCommentAuthor = comment.author.equals(req.user._id);
  const isPostOwner = post.author._id.equals(req.user._id);
  if (!isCommentAuthor && !isPostOwner) return res.status(403).json({ message: "not allowed" });
  comment.remove();
  await post.save();
  res.json({ message: "comment deleted" });
});

// === SIMPLE FRONTEND (served from root) ===
app.get("/", (req, res) => {
  res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Mini Blog Platform</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 24px auto; padding: 0 16px; }
    header { display:flex; justify-content:space-between; align-items:center; }
    .card { background:#fff; padding:12px; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.08); margin-bottom:12px; }
    input, textarea, select { width:100%; padding:8px; margin:6px 0; }
    button { padding:8px 12px; cursor:pointer; }
    .muted { color:#666; font-size:0.9em; }
    .post-title { font-weight:700; font-size:1.1em; }
    .comments { margin-top:8px; border-top:1px dashed #eee; padding-top:8px; }
    small { color:#888; }
    .right { float:right; }
  </style>
</head>
<body>
  <header>
    <h1>Mini Blog Platform</h1>
    <div id="authArea">
      <button onclick="showSignup()">Sign Up</button>
      <button onclick="showLogin()">Login</button>
      <span id="who" class="muted"></span>
      <button id="logoutBtn" style="display:none" onclick="logout()">Logout</button>
    </div>
  </header>

  <section id="forms" style="margin-top:12px;"></section>

  <section class="card" id="createPostCard" style="display:none">
    <h3>Create Post</h3>
    <input id="postTitle" placeholder="Title"/>
    <textarea id="postContent" rows="6" placeholder="Write something..."></textarea>
    <button onclick="createPost()">Create Post</button>
  </section>

  <h2>Posts</h2>
  <div id="posts"></div>

  <script>
    // Basic client-side state
    let token = localStorage.getItem("token") || "";
    let currentUser = null;

    if (token) {
      // try to load profile
      fetch('/api/me', { headers: { Authorization: 'Bearer ' + token }})
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(u => { currentUser = u; onLogin(); })
        .catch(() => { token=''; localStorage.removeItem('token'); });
    }

    // UI helpers
    function showSignup() {
      document.getElementById('forms').innerHTML = \`
      <div class="card">
        <h3>Sign Up</h3>
        <input id="suUser" placeholder="username"/>
        <input id="suDisplay" placeholder="display name (optional)"/>
        <input id="suPass" type="password" placeholder="password"/>
        <button onclick="signup()">Sign Up</button>
      </div>\`;
    }
    function showLogin() {
      document.getElementById('forms').innerHTML = \`
      <div class="card">
        <h3>Login</h3>
        <input id="liUser" placeholder="username"/>
        <input id="liPass" type="password" placeholder="password"/>
        <button onclick="login()">Login</button>
      </div>\`;
    }

    async function signup() {
      const username = document.getElementById('suUser').value.trim();
      const password = document.getElementById('suPass').value;
      const displayName = document.getElementById('suDisplay').value.trim();
      if (!username || !password) return alert('username & password required');
      const res = await fetch('/api/signup', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password, displayName })
      });
      const data = await res.json();
      if (res.ok) {
        token = data.token; localStorage.setItem('token', token); currentUser = data.user; onLogin();
      } else alert(data.message || 'signup failed');
    }

    async function login() {
      const username = document.getElementById('liUser').value.trim();
      const password = document.getElementById('liPass').value;
      const res = await fetch('/api/login', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        token = data.token; localStorage.setItem('token', token); currentUser = data.user; onLogin();
      } else alert(data.message || 'login failed');
    }

    function logout() {
      token = ''; currentUser = null; localStorage.removeItem('token');
      document.getElementById('who').textContent = ''; document.getElementById('logoutBtn').style.display = 'none';
      document.getElementById('createPostCard').style.display = 'none';
      document.getElementById('forms').innerHTML = '';
    }

    function onLogin() {
      document.getElementById('forms').innerHTML = '';
      document.getElementById('who').textContent = currentUser ? ('Logged in as ' + currentUser.username) : '';
      document.getElementById('logoutBtn').style.display = 'inline-block';
      document.getElementById('createPostCard').style.display = 'block';
      fetchPosts();
    }

    // POSTS
    async function createPost() {
      const title = document.getElementById('postTitle').value.trim();
      const content = document.getElementById('postContent').value.trim();
      if (!title || !content) return alert('title & content required');
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ title, content })
      });
      if (res.ok) {
        document.getElementById('postTitle').value=''; document.getElementById('postContent').value='';
        fetchPosts();
      } else {
        const d = await res.json(); alert(d.message || 'error creating post');
      }
    }

    async function fetchPosts() {
      const res = await fetch('/api/posts');
      const posts = await res.json();
      const container = document.getElementById('posts');
      container.innerHTML = '';
      posts.forEach(p => {
        const el = document.createElement('div');
        el.className = 'card';
        const author = p.author ? (p.author.displayName || p.author.username) : 'Unknown';
        el.innerHTML = \`
          <div>
            <span class="post-title">\${escapeHtml(p.title)}</span>
            <small style="margin-left:8px">by \${escapeHtml(author)}</small>
            <div class="right"><small>\${new Date(p.createdAt).toLocaleString()}</small></div>
          </div>
          <p>\${escapeHtml(p.content)}</p>
          <div>
            \${p.author && currentUser && p.author._id === currentUser.id ? '<button onclick="showEdit(\\'\'+p._id+'\\',\\''+escapeForJs(p.title)+'\\',\\''+escapeForJs(p.content)+'\\')">Edit</button> <button onclick="deletePost(\\'\'+p._id+'\\')">Delete</button>' : ''}
            <button onclick="toggleComments('\\'\'+p._id+'\\')">Comments (\${p.comments.length})</button>
          </div>
          <div id="comments-\${p._id}" class="comments" style="display:none"></div>
        \`;
        container.appendChild(el);
      });
    }

    function escapeHtml(s='') {
      return (''+s).replace(/[&<>"']/g, (m)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[m]));
    }
    function escapeForJs(s='') { return (''+s).replace(/'/g, "\\\\'").replace(/\\n/g, '\\\\n'); }

    async function showEdit(id, title, content) {
      const formHtml = \`
        <div class="card">
          <h3>Edit Post</h3>
          <input id="editTitle" value="\${title}"/>
          <textarea id="editContent" rows="6">\${content}</textarea>
          <button onclick="saveEdit('\${id}')">Save</button>
          <button onclick="fetchPosts()">Cancel</button>
        </div>\`;
      document.getElementById('forms').innerHTML = formHtml;
      window.scrollTo(0,0);
    }

    async function saveEdit(id) {
      const title = document.getElementById('editTitle').value.trim();
      const content = document.getElementById('editContent').value.trim();
      if (!title || !content) return alert('title & content required');
      const res = await fetch('/api/posts/' + id, {
        method:'PUT',
        headers: { 'Content-Type':'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ title, content })
      });
      if (res.ok) { document.getElementById('forms').innerHTML=''; fetchPosts(); } else {
        const d = await res.json(); alert(d.message || 'error updating');
      }
    }

    async function deletePost(id) {
      if (!confirm('Delete this post?')) return;
      const res = await fetch('/api/posts/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token }});
      const d = await res.json();
      if (res.ok) fetchPosts(); else alert(d.message || 'error deleting');
    }

    // COMMENTS
    function toggleComments(postId) {
      const el = document.getElementById('comments-' + postId);
      if (el.style.display === 'none') { loadComments(postId); el.style.display='block'; } else { el.style.display='none'; }
    }

    async function loadComments(postId) {
      const res = await fetch('/api/posts/' + postId);
      if (!res.ok) return;
      const p = await res.json();
      const container = document.getElementById('comments-' + postId);
      container.innerHTML = '';
      // Add comment input if logged in
      if (token) {
        const input = document.createElement('div');
        input.innerHTML = '<input id="cinput-'+postId+'" placeholder=\"Write a comment...\"/><button onclick=\"addComment(\\\"'+postId+'\\\")\">Add</button>';
        container.appendChild(input);
      } else {
        container.appendChild(document.createElement('div')).textContent = 'Login to comment';
      }
      p.comments.forEach(c => {
        const d = document.createElement('div');
        d.style.marginTop='8px';
        const author = c.author ? (c.author.displayName || c.author.username) : 'Unknown';
        d.innerHTML = '<strong>' + escapeHtml(author) + '</strong> <small class=\"muted\">' + new Date(c.createdAt).toLocaleString() + '</small><p>' + escapeHtml(c.text) + '</p>';
        if (token && ( (c.author && c.author._id === (currentUser && currentUser.id)) || (p.author && currentUser && p.author._id === currentUser.id) )) {
          d.innerHTML += '<button onclick=\"deleteComment(\\\"' + postId + '\\\",\\\"' + c._id + '\\\")\">Delete</button>';
        }
        container.appendChild(d);
      });
    }

    async function addComment(postId) {
      const text = document.getElementById('cinput-' + postId).value.trim();
      if (!text) return alert('comment empty');
      const res = await fetch('/api/posts/' + postId + '/comments', {
        method: 'POST', headers: { 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ text })
      });
      if (res.ok) loadComments(postId); else { const d=await res.json(); alert(d.message||'error'); }
    }

    async function deleteComment(postId, commentId) {
      if (!confirm('Delete comment?')) return;
      const res = await fetch('/api/posts/' + postId + '/comments/' + commentId, {
        method: 'DELETE', headers: { Authorization: 'Bearer ' + token }
      });
      const d = await res.json();
      if (res.ok) loadComments(postId); else alert(d.message || 'error');
    }

    // basic polling to refresh posts (simulate real-time)
    setInterval(fetchPosts, 4000);

    // initial fetch
    fetchPosts();

  </script>
</body>
</html>`);
});

// Start server
app.listen(PORT, () => console.log(\`🚀 Server running at http://localhost:\${PORT}\`));
