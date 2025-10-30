/**
 * social-app.js
 *
 * Single-file Social Media App (demo)
 * - Run: npm init -y
 * - Install: npm install express mongoose bcryptjs jsonwebtoken cors
 * - Start MongoDB locally or set MONGODB_URI env to Atlas
 * - Run: node social-app.js
 *
 * Notes:
 *  - JWT_SECRET should be provided via env var in production
 *  - This demo uses text-only posts (no image upload). Images can be added later using S3.
 *  - Frontend uses simple JS + fetch to interact with API.
 */

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "change_this_jwt_secret";
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/social_demo";

// ---------- Mongoose models ----------
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => { console.error("MongoDB error:", err); process.exit(1); });

const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, unique: true, required: true },
  displayName: String,
  passwordHash: String,
  bio: String,
}, { timestamps: true });

const CommentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User" },
  text: String,
  createdAt: { type: Date, default: Date.now },
});

const PostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User" },
  text: String,
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  comments: [CommentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

const User = mongoose.model("User", UserSchema);
const Post = mongoose.model("Post", PostSchema);

// ---------- Helpers ----------
function signToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "8h" });
}

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing Authorization" });
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) return res.status(401).json({ message: "Bad auth format" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select("-passwordHash");
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// ---------- Auth Routes ----------
app.post("/api/register", async (req, res) => {
  const { username, password, displayName = "", bio = "" } = req.body;
  if (!username || !password) return res.status(400).json({ message: "username & password required" });
  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ message: "username taken" });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = new User({ username, passwordHash: hash, displayName, bio });
    await user.save();
    const token = signToken(user);
    res.json({ message: "registered", token, user: { id: user._id, username: user.username, displayName, bio } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "username & password required" });
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: "invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "invalid credentials" });
  const token = signToken(user);
  res.json({ message: "ok", token, user: { id: user._id, username: user.username, displayName: user.displayName, bio: user.bio } });
});

app.get("/api/me", authMiddleware, (req, res) => {
  const u = req.user;
  res.json({ id: u._id, username: u.username, displayName: u.displayName, bio: u.bio });
});

// ---------- Posts CRUD ----------
app.post("/api/posts", authMiddleware, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "text required" });
  const post = new Post({ author: req.user._id, text });
  await post.save();
  await post.populate("author", "username displayName");
  res.json(post);
});

app.get("/api/posts", async (req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("author", "username displayName")
    .populate("comments.author", "username displayName");
  res.json(posts);
});

app.put("/api/posts/:id", authMiddleware, async (req, res) => {
  const { text } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "post not found" });
  if (!post.author.equals(req.user._id)) return res.status(403).json({ message: "not your post" });
  post.text = text || post.text;
  post.updatedAt = new Date();
  await post.save();
  await post.populate("author", "username displayName");
  res.json(post);
});

app.delete("/api/posts/:id", authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "post not found" });
  if (!post.author.equals(req.user._id)) return res.status(403).json({ message: "not your post" });
  await post.remove();
  res.json({ message: "deleted" });
});

// ---------- Likes ----------
app.post("/api/posts/:id/like", authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "post not found" });
  const already = post.likes.find((id) => id.equals(req.user._id));
  if (already) {
    // unlike
    post.likes = post.likes.filter((id) => !id.equals(req.user._id));
  } else {
    post.likes.push(req.user._id);
  }
  await post.save();
  res.json({ likes: post.likes.length });
});

// ---------- Comments ----------
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

// ---------- Serve Frontend ----------
app.get("/", (req, res) => {
  res.send(`<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Mini Social App</title>
<style>
  body{font-family:Arial;max-width:900px;margin:20px auto;padding:0 12px;background:#f7f7f7}
  header{display:flex;justify-content:space-between;align-items:center}
  .card{background:#fff;padding:12px;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,.08);margin-bottom:12px}
  input,textarea,select{width:100%;padding:8px;margin:6px 0}
  button{padding:8px 10px;margin:4px;cursor:pointer}
  .muted{color:#666;font-size:0.9em}
  .post{margin-bottom:10px}
  .small{font-size:0.9em;color:#555}
  .right{float:right}
</style>
</head>
<body>
<header>
  <h1>Mini Social App</h1>
  <div id="authArea"><button onclick="showLogin()">Login</button><button onclick="showRegister()">Register</button><span id="who" class="muted"></span><button id="logoutBtn" style="display:none" onclick="logout()">Logout</button></div>
</header>

<section id="forms"></section>

<section id="createPost" class="card" style="display:none">
  <h3>Create Post</h3>
  <textarea id="postText" rows="4" placeholder="What's happening?"></textarea>
  <button onclick="createPost()">Post</button>
</section>

<h2>Feed</h2>
<div id="feed"></div>

<script>
let token = localStorage.getItem('token') || '';
let me = null;

if (token) {
  fetch('/api/me', { headers: { Authorization: 'Bearer ' + token }})
    .then(r => r.ok ? r.json() : Promise.reject()).then(u => { me = u; onLogin(); }).catch(() => { token=''; localStorage.removeItem('token'); });
}

function showRegister(){
  document.getElementById('forms').innerHTML = \`
  <div class="card"><h3>Register</h3>
  <input id="rUser" placeholder="username"/>
  <input id="rName" placeholder="display name (optional)"/>
  <input id="rPass" type="password" placeholder="password"/>
  <button onclick="register()">Create Account</button></div>\`;
}
function showLogin(){
  document.getElementById('forms').innerHTML = \`
  <div class="card"><h3>Login</h3>
  <input id="lUser" placeholder="username"/>
  <input id="lPass" type="password" placeholder="password"/>
  <button onclick="login()">Login</button></div>\`;
}

async function register(){
  const username = document.getElementById('rUser').value.trim();
  const displayName = document.getElementById('rName').value.trim();
  const password = document.getElementById('rPass').value;
  if(!username||!password) return alert('username & password required');
  const res = await fetch('/api/register', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username, password, displayName})});
  const data = await res.json();
  if (res.ok) { token = data.token; localStorage.setItem('token', token); me = data.user; onLogin(); } else alert(data.message||'error');
}

async function login(){
  const username = document.getElementById('lUser').value.trim();
  const password = document.getElementById('lPass').value;
  const res = await fetch('/api/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username, password})});
  const data = await res.json();
  if (res.ok) { token = data.token; localStorage.setItem('token', token); me = data.user; onLogin(); } else alert(data.message||'error');
}

function logout(){ token=''; me=null; localStorage.removeItem('token'); document.getElementById('who').textContent=''; document.getElementById('logoutBtn').style.display='none'; document.getElementById('createPost').style.display='none'; document.getElementById('forms').innerHTML=''; }

function onLogin(){ document.getElementById('forms').innerHTML=''; document.getElementById('who').textContent = me ? ('Logged in as ' + me.username) : ''; document.getElementById('logoutBtn').style.display = 'inline-block'; document.getElementById('createPost').style.display = 'block'; fetchFeed(); }

async function createPost(){
  const text = document.getElementById('postText').value.trim();
  if (!text) return alert('Write something');
  const res = await fetch('/api/posts', { method:'POST', headers: { 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ text })});
  if (res.ok) { document.getElementById('postText').value=''; fetchFeed(); } else { const d=await res.json(); alert(d.message||'error'); }
}

async function fetchFeed(){
  const res = await fetch('/api/posts');
  const posts = await res.json();
  const out = document.getElementById('feed');
  out.innerHTML = '';
  posts.forEach(p => {
    const el = document.createElement('div');
    el.className = 'card post';
    const author = p.author ? (p.author.displayName || p.author.username) : 'unknown';
    const isMine = me && p.author && (p.author._id === me.id);
    el.innerHTML = \`
      <div><strong>\${escapeHtml(author)}</strong> <span class="muted">· \${new Date(p.createdAt).toLocaleString()}</span><span class="right small">Likes: \${p.likes.length}</span></div>
      <p>\${escapeHtml(p.text)}</p>
      <div>\${me?'<button onclick="toggleLike(\\'\'+p._id+'\\')">Like/Unlike</button>':''} \${isMine?'<button onclick="showEdit(\\'\'+p._id+'\\',\\''+escapeForJs(p.text)+'\\')">Edit</button> <button onclick="deletePost(\\'\'+p._id+'\\')">Delete</button>':''} <button onclick="toggleComments(\\'\'+p._id+'\\')">Comments (\${p.comments.length})</button></div>
      <div id="comments-\${p._id}" style="display:none" class="comments"></div>
    \`;
    out.appendChild(el);
  });
}

function escapeHtml(s=''){ return (''+s).replace(/[&<>"']/g, (m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[m])); }
function escapeForJs(s=''){ return (''+s).replace(/'/g, \"\\\\'\").replace(/\\n/g,'\\\\n'); }

async function toggleLike(postId){
  const res = await fetch('/api/posts/' + postId + '/like', { method:'POST', headers: { Authorization: 'Bearer ' + token }});
  if (!res.ok){ const d=await res.json(); alert(d.message||'error'); } else fetchFeed();
}

function showEdit(id, text){
  document.getElementById('forms').innerHTML = \`
    <div class="card"><h3>Edit Post</h3>
    <textarea id="editText" rows="4">\${escapeHtml(text)}</textarea>
    <button onclick="saveEdit('\${id}')">Save</button>
    <button onclick="document.getElementById('forms').innerHTML=''">Cancel</button></div>\`;
  window.scrollTo(0,0);
}

async function saveEdit(id){
  const text = document.getElementById('editText').value.trim();
  if (!text) return alert('text required');
  const res = await fetch('/api/posts/' + id, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ text })});
  if (res.ok) { document.getElementById('forms').innerHTML=''; fetchFeed(); } else { const d=await res.json(); alert(d.message||'error'); }
}

async function deletePost(id){
  if (!confirm('Delete post?')) return;
  const res = await fetch('/api/posts/' + id, { method:'DELETE', headers: { Authorization: 'Bearer ' + token }});
  if (res.ok) fetchFeed(); else { const d=await res.json(); alert(d.message||'error'); }
}

function toggleComments(postId){
  const el = document.getElementById('comments-' + postId);
  if (el.style.display === 'none'){ loadComments(postId); el.style.display='block'; } else { el.style.display='none'; }
}

async function loadComments(postId){
  const res = await fetch('/api/posts');
  const posts = await res.json();
  const post = posts.find(p=>p._id===postId);
  const container = document.getElementById('comments-' + postId);
  container.innerHTML = '';
  if (me) {
    const input = document.createElement('div');
    input.innerHTML = '<input id=\"cinput-'+postId+'\" placeholder=\"Write a comment...\"/> <button onclick=\"addComment(\\\"'+postId+'\\\")\">Add</button>';
    container.appendChild(input);
  } else {
    container.appendChild(document.createElement('div')).textContent = 'Login to comment';
  }
  post.comments.forEach(c => {
    const d = document.createElement('div');
    const author = c.author ? (c.author.displayName || c.author.username) : 'unknown';
    d.innerHTML = '<strong>' + escapeHtml(author) + '</strong> <small class=\"muted\">' + new Date(c.createdAt).toLocaleString() + '</small><p>' + escapeHtml(c.text) + '</p>';
    if (me && ( (c.author && c.author._id === me.id) || (post.author && me.id === post.author._id) )) {
      d.innerHTML += '<button onclick=\"deleteComment(\\\"'+postId+'\\\",\\\"'+c._id+'\\')\">Delete</button>';
    }
    container.appendChild(d);
  });
}

async function addComment(postId){
  const text = document.getElementById('cinput-'+postId).value.trim();
  if (!text) return alert('comment empty');
  const res = await fetch('/api/posts/' + postId + '/comments', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ text })});
  if (res.ok) loadComments(postId); else { const d=await res.json(); alert(d.message||'error'); }
}

async function deleteComment(postId, commentId){
  if (!confirm('Delete comment?')) return;
  const res = await fetch('/api/posts/' + postId + '/comments/' + commentId, { method:'DELETE', headers: { Authorization: 'Bearer ' + token }});
  if (res.ok) loadComments(postId); else { const d=await res.json(); alert(d.message||'error'); }
}

// Poll the feed every 5 seconds to simulate live feed
setInterval(fetchFeed, 5000);
fetchFeed();
</script>
</body>
</html>`);
});

// ---------- Start server ----------
app.listen(PORT, () => console.log(\`🚀 Social app running at http://localhost:\${PORT}\`));
