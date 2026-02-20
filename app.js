const CONVEX_URL = "https://usable-tortoise-739.eu-west-1.convex.cloud";

const client = new convex.ConvexClient(CONVEX_URL);

// ── STATE ─────────────────────────────────────────
let myAlias = localStorage.getItem("chatAlias") || null;
let lastRenderedDate = null;

// ── DOM ───────────────────────────────────────────
const aliasScreen = document.getElementById("aliasScreen");
const chatScreen  = document.getElementById("chatScreen");
const aliasInput  = document.getElementById("aliasInput");
const enterBtn    = document.getElementById("enterBtn");
const msgInput    = document.getElementById("msgInput");
const sendBtn     = document.getElementById("sendBtn");
const messageList = document.getElementById("messageList");
const onlineCount = document.getElementById("onlineCount");
const logoutBtn   = document.getElementById("logoutBtn");

// ── INIT ─────────────────────────────────────────
if (myAlias) {
  showChat();
}

// ── ENTER CHAT ────────────────────────────────────
function showChat() {
  aliasScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  msgInput.focus();

  client.onUpdate("tasks:getMessages", {}, (messages) => {
    renderMessages(messages || []);
  });

  client.onUpdate("tasks:getOnlineCount", {}, (count) => {
    onlineCount.textContent = count ?? 1;
  });

  pingPresence();
  setInterval(pingPresence, 30000);
}

async function pingPresence() {
  if (!myAlias) return;
  await client.mutation("tasks:ping", { alias: myAlias });
}

// ── RENDER MESSAGES ───────────────────────────────
function renderMessages(messages) {
  lastRenderedDate = null;
  const wasAtBottom =
    messageList.scrollHeight - messageList.scrollTop <= messageList.clientHeight + 60;

  messageList.innerHTML = "";

  messages.forEach((msg) => {
    const dateStr = new Date(msg.createdAt).toLocaleDateString("es", {
      weekday: "long", day: "numeric", month: "long",
    });
    if (dateStr !== lastRenderedDate) {
      const sep = document.createElement("div");
      sep.className = "date-sep";
      sep.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
      messageList.appendChild(sep);
      lastRenderedDate = dateStr;
    }

    const isMine = msg.alias === myAlias;
    const row = document.createElement("div");
    row.className = `msg-row ${isMine ? "mine" : "theirs"}`;

    if (!isMine) {
      const aliasEl = document.createElement("div");
      aliasEl.className = "msg-alias";
      aliasEl.textContent = msg.alias;
      row.appendChild(aliasEl);
    }

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.textContent = msg.text;
    row.appendChild(bubble);

    const time = document.createElement("div");
    time.className = "msg-time";
    time.textContent = new Date(msg.createdAt).toLocaleTimeString("es", {
      hour: "2-digit", minute: "2-digit",
    });
    row.appendChild(time);

    messageList.appendChild(row);
  });

  if (wasAtBottom) {
    messageList.scrollTop = messageList.scrollHeight;
  }
}

// ── SEND ─────────────────────────────────────────
async function sendMessage() {
  const text = msgInput.value.trim();
  if (!text || !myAlias) return;
  sendBtn.disabled = true;
  try {
    await client.mutation("tasks:sendMessage", { alias: myAlias, text });
    msgInput.value = "";
    msgInput.focus();
  } catch (e) {
    alert("Error: " + e.message);
  } finally {
    sendBtn.disabled = false;
  }
}

// ── EVENTS ────────────────────────────────────────
enterBtn.addEventListener("click", () => {
  const alias = aliasInput.value.trim();
  if (!alias) { aliasInput.focus(); return; }
  myAlias = alias;
  localStorage.setItem("chatAlias", alias);
  showChat();
});

aliasInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") enterBtn.click();
});

sendBtn.addEventListener("click", sendMessage);

msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) sendMessage();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("chatAlias");
  location.reload();
});
