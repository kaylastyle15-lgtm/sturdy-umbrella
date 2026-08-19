/* ==========================================================================
   app.js — the WHOLE Study Buddy app, in one small file. No framework, no build.
   --------------------------------------------------------------------------
   It's a "single-page app": index.html is the only page, and this script draws
   one screen at a time into <main id="view"> and swaps them in place. That's
   what makes it feel like a real app — instant screens, a top bar and bottom
   tabs that stay put, and no full page reloads.

   The screens:
     1) ONBOARDING — a welcome screen, then one question per screen, then a
        short "finding your buddy" state. (Draws itself from questions.js.)
     2) MATCH       — "waiting for a buddy", or your match + why.
     3) CHAT        — the conversation with your buddy.
     4) ORGANIZER   — the whole pool + every match (for whoever runs the event).

   You almost never need to edit this file to customize the app:
     • change the SURVEY in questions.js
     • change the LOOK in theme.css
   ========================================================================== */

/* ============================  1. SMALL HELPERS  ========================== */

// Talk to our backend Functions (the files in /functions/api/*).
async function api(path, options) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong (" + res.status + ").");
  return data;
}

// Remember who is signed in on THIS phone/browser (simple, no passwords).
const store = {
  get profileId() { return localStorage.getItem("sb_profile_id"); },
  set profileId(v) { localStorage.setItem("sb_profile_id", v); },
  get name() { return localStorage.getItem("sb_name") || ""; },
  set name(v) { localStorage.setItem("sb_name", v); },
  clear() { localStorage.removeItem("sb_profile_id"); localStorage.removeItem("sb_name"); },
};

const $ = (sel, root) => (root || document).querySelector(sel);
const view = $("#view");

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const escapeAttr = escapeHtml;
function firstName(name) { return String(name || "").trim().split(/\s+/)[0] || ""; }
function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }
function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim()); }
function ageOk(v) { const n = Number(v); return Number.isFinite(n) && n >= 10 && n <= 120; }
function initial(name) { return (firstName(name)[0] || "?").toUpperCase(); }

function shortTime(ts) {
  try {
    return new Date(String(ts).replace(" ", "T") + "Z")
      .toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch { return ts; }
}

// Put HTML on screen, with a gentle enter animation (unless we're just
// refreshing the same screen and want to keep the scroll position).
function setView(html, animate = true) {
  view.innerHTML = html;
  if (animate) { view.classList.remove("view-enter"); void view.offsetWidth; view.classList.add("view-enter"); }
  if (animate) view.scrollTop = 0;
}

function pill(kind, text) { return `<span class="pill ${kind}">${escapeHtml(text)}</span>`; }

/* ============================  2. THE APP SHELL  ========================== */

// One repeating timer at a time (so screens can poll for updates without stacking).
let pollTimer = null;
function clearPoll() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }
function setPoll(fn, ms) { clearPoll(); pollTimer = setInterval(fn, ms); }

function setTabs(visible) { $("#tabbar").hidden = !visible; }
function setActiveTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === name));
}
function setWhoami() {
  const w = $("#whoami");
  if (store.profileId && store.name) {
    w.hidden = false;
    w.innerHTML = `<span class="avatar" aria-hidden="true">${escapeHtml(initial(store.name))}</span>
                   <span class="who-name">${escapeHtml(firstName(store.name))}</span>`;
  } else { w.hidden = true; w.innerHTML = ""; }
}

// Wire the top bar + tabs once at startup.
document.querySelectorAll(".tab").forEach((t) =>
  t.addEventListener("click", () => setHash("#/" + t.dataset.tab)));

/* ============================  3. THE ROUTER  ============================= */
// The screen is chosen by the URL "hash" (#/match, #/chat, #/organizer).
// Bottom tabs and buttons just change the hash; this function reacts to it.

function setHash(h) { if (location.hash === h) route(); else location.hash = h; }

function route() {
  clearPoll();
  const path = (location.hash || "#/").replace(/^#/, "");
  if (path === "/match")     return store.profileId ? showMatch()     : setHash("#/");
  if (path === "/chat")      return store.profileId ? showChat()      : setHash("#/");
  if (path === "/organizer") return showOrganizer();
  // default "/" — the front door.
  if (store.profileId) return setHash("#/match"); // already signed up? go to your match.
  return showWelcome();                            // otherwise, start onboarding.
}

window.addEventListener("hashchange", route);

/* ========================  4. ONBOARDING (SIGN-UP FLOW)  ================== */
// A step-by-step wizard: welcome -> your profile -> one question per screen.
// The question screens are built from questions.js, so your survey drives the flow.

const flow = {
  steps: [],                                    // built from QUESTIONS below
  index: 0,                                      // which step we're on (0 = welcome)
  profile: { name: "", email: "", age: "" },     // the identity fields
  answers: {},                                   // survey answers, keyed by question id
};

function buildSteps() {
  const questions = (window.QUESTIONS || []).map((q) => ({ kind: "question", q }));
  flow.steps = [{ kind: "welcome" }, { kind: "profile" }, ...questions];
}

function showWelcome() {
  setTabs(false); setWhoami();
  flow.index = 0;
  renderOnboarding();
}

// The single entry point that draws whatever step we're on.
function renderOnboarding(refresh) {
  const s = flow.steps[flow.index];
  if (!s || s.kind === "welcome") return renderWelcomeScreen();

  setTabs(false); $("#whoami").hidden = true;

  const total = flow.steps.length - 1;   // steps excluding the welcome screen
  const current = flow.index;            // profile = 1, then 2, 3...  -> "Step X of N"
  const pct = Math.round((current / total) * 100);
  const isLast = flow.index === flow.steps.length - 1;

  let title = "", sub = "", body = "";
  if (s.kind === "profile") {
    title = "Create your profile";
    sub = "Just the basics, so your buddy knows who they matched with.";
    body = profileFields();
  } else {
    title = s.q.label;
    body = questionFields(s.q);
  }

  const prevScroll = refresh ? view.scrollTop : 0;
  setView(`
    <section class="wizard">
      <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
      <p class="step-count">Step ${current} of ${total}</p>
      <h1 class="wizard-title">${escapeHtml(title)}</h1>
      ${sub ? `<p class="wizard-sub">${escapeHtml(sub)}</p>` : ""}
      <div class="wizard-body">${body}</div>
      <p class="wizard-error" id="wizError"></p>
      <div class="wizard-nav">
        <button class="btn ghost" id="backBtn" type="button">Back</button>
        <button class="btn" id="nextBtn" type="button">${isLast ? "Find my buddy" : "Next"}</button>
      </div>
    </section>
  `, !refresh);
  if (refresh) view.scrollTop = prevScroll;

  wireStep(s);
}

function renderWelcomeScreen() {
  setTabs(false); $("#whoami").hidden = true;
  setView(`
    <section class="welcome">
      <div class="welcome-art"><img src="/icon.svg" alt="" /></div>
      <h1>Find your study buddy</h1>
      <p class="welcome-sub">Answer a few quick questions and we'll pair you with
        someone who studies like you do — and tell you why. Takes about a minute.</p>
      <button class="btn block" id="startBtn" type="button">Get started</button>
      <button class="linkbtn" id="orgBtn" type="button">I'm running the event</button>
    </section>
  `);
  $("#startBtn").addEventListener("click", () => { flow.index = 1; renderOnboarding(); });
  $("#orgBtn").addEventListener("click", () => setHash("#/organizer"));
}

// ---- The identity fields (name / email / age) ----
function profileFields() {
  return `
    <label class="field">
      <span class="field-label">Your name</span>
      <input class="text-input" type="text" id="pf-name" autocomplete="name"
             placeholder="Alex Rivera" value="${escapeAttr(flow.profile.name)}" />
    </label>
    <label class="field">
      <span class="field-label">Email</span>
      <input class="text-input" type="email" id="pf-email" autocomplete="email"
             placeholder="alex@school.edu" value="${escapeAttr(flow.profile.email)}" />
    </label>
    <label class="field">
      <span class="field-label">Age <span class="muted">(used for a safety check)</span></span>
      <input class="text-input" type="number" id="pf-age" min="10" max="120" inputmode="numeric"
             placeholder="19" value="${escapeAttr(flow.profile.age)}" />
    </label>`;
}

// ---- One survey question, in the right shape (select / multi / text) ----
function questionFields(q) {
  if (q.type === "select") {
    const chosen = flow.answers[q.id];
    let html = `<div class="options">${q.options.map((o) => optionCard(q.id, o, chosen === o)).join("")}</div>`;
    // BRANCHING: a chosen answer can reveal a follow-up question, inline.
    if (q.branch && chosen && q.branch[chosen]) {
      html += `<div class="branch">${q.branch[chosen].map(followField).join("")}</div>`;
    }
    return html;
  }
  if (q.type === "multi") {
    const chosen = flow.answers[q.id] || [];
    return `<p class="field-hint">Pick any that apply.</p>
            <div class="chips">${q.options.map((o) => chip(q.id, o, chosen.includes(o))).join("")}</div>`;
  }
  if (q.type === "text") {
    return `<input class="text-input" type="text" data-qid="${q.id}"
             value="${escapeAttr(flow.answers[q.id] || "")}" placeholder="Type your answer" />`;
  }
  return "";
}

function followField(fq) {
  if (fq.type === "select") {
    const chosen = flow.answers[fq.id];
    return `<p class="field-label branch-label">${escapeHtml(fq.label)}</p>
            <div class="options">${fq.options.map((o) => optionCard(fq.id, o, chosen === o)).join("")}</div>`;
  }
  return `<p class="field-label branch-label">${escapeHtml(fq.label)}</p>
          <input class="text-input" type="text" data-qid="${fq.id}"
           value="${escapeAttr(flow.answers[fq.id] || "")}" placeholder="Type your answer" />`;
}

function optionCard(qid, value, selected) {
  return `<button class="option ${selected ? "is-selected" : ""}" type="button"
            data-qid="${escapeAttr(qid)}" data-value="${escapeAttr(value)}">
            <span>${escapeHtml(value)}</span><span class="option-check" aria-hidden="true"></span>
          </button>`;
}
function chip(qid, value, selected) {
  return `<button class="chip ${selected ? "is-selected" : ""}" type="button"
            data-qid="${escapeAttr(qid)}" data-value="${escapeAttr(value)}">${escapeHtml(value)}</button>`;
}

// Attach the behavior for the current step (fresh nodes each render — no stacking).
function wireStep(s) {
  $("#backBtn").addEventListener("click", goBack);
  $("#nextBtn").addEventListener("click", goNext);

  if (s.kind === "profile") {
    [["pf-name", "name"], ["pf-email", "email"], ["pf-age", "age"]].forEach(([id, key]) => {
      const inp = $("#" + id);
      inp.addEventListener("input", () => { flow.profile[key] = inp.value; clearWizError(); });
    });
  }

  // Single-choice option cards (and branch selects): choose, then refresh in place.
  document.querySelectorAll("#view .option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const qid = btn.dataset.qid, val = btn.dataset.value;
      // If this is the branching question, forget follow-ups from the OTHER branch.
      if (s.kind === "question" && s.q.branch && qid === s.q.id) {
        const keep = new Set((s.q.branch[val] || []).map((f) => f.id));
        Object.values(s.q.branch).flat().forEach((f) => { if (!keep.has(f.id)) delete flow.answers[f.id]; });
      }
      flow.answers[qid] = val;
      renderOnboarding(true);
    });
  });

  // Multi-select chips: toggle on/off.
  document.querySelectorAll("#view .chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const qid = btn.dataset.qid, val = btn.dataset.value;
      const arr = flow.answers[qid] || [];
      const i = arr.indexOf(val);
      if (i >= 0) arr.splice(i, 1); else arr.push(val);
      flow.answers[qid] = arr;
      renderOnboarding(true);
    });
  });

  // Free-text answers: save as you type (don't redraw — keeps your cursor).
  document.querySelectorAll("#view .text-input[data-qid]").forEach((inp) => {
    inp.addEventListener("input", () => { flow.answers[inp.dataset.qid] = inp.value; clearWizError(); });
  });
}

function clearWizError() { const e = $("#wizError"); if (e) e.textContent = ""; }
function stepError(msg) { const e = $("#wizError"); if (e) e.textContent = msg; }

// Is the current step answered enough to move on?
function stepValid() {
  const s = flow.steps[flow.index];
  if (s.kind === "welcome") return true;
  if (s.kind === "profile")
    return !!flow.profile.name.trim() && isEmail(flow.profile.email) && ageOk(flow.profile.age);
  if (s.kind === "question" && s.q.type === "select") return !!flow.answers[s.q.id];
  return true; // text + multi are optional — never a dead end
}

function goBack() {
  if (flow.index <= 0) return;
  flow.index--;
  renderOnboarding();
}
function goNext() {
  if (!stepValid()) {
    const s = flow.steps[flow.index];
    stepError(s.kind === "profile"
      ? "Add your name, a valid email, and an age between 10 and 120."
      : "Pick an option to continue.");
    return;
  }
  if (flow.index === flow.steps.length - 1) return finish();
  flow.index++;
  renderOnboarding();
}

// Last step done: save the profile, kick off matching, show the result.
async function finish() {
  showFinding();
  try {
    const [profile] = await Promise.all([
      api("/api/signup", {
        method: "POST",
        body: JSON.stringify({
          name: flow.profile.name.trim(),
          email: flow.profile.email.trim(),
          age: Number(flow.profile.age),
          answers: flow.answers,
        }),
      }),
      delay(1300), // a beat, so "finding your buddy" doesn't just flash by
    ]);
    store.profileId = profile.id;
    store.name = profile.name;
    // Ask the matcher now, so a match is ready the moment we land on the screen.
    await api("/api/match", { method: "POST", body: JSON.stringify({ profileId: Number(profile.id) }) }).catch(() => {});
    setHash("#/match");
  } catch (e) {
    renderFindingError(e.message);
  }
}

function showFinding() {
  setTabs(false); $("#whoami").hidden = true;
  setView(`
    <section class="finding">
      <div class="spinner" aria-hidden="true"></div>
      <h1>Finding your buddy…</h1>
      <p class="muted">Saving your answers and looking for a great match.</p>
    </section>
  `);
}
function renderFindingError(msg) {
  setView(`
    <section class="finding">
      <div class="finding-emoji">😕</div>
      <h1>That didn't go through</h1>
      <p class="muted">${escapeHtml(msg)}</p>
      <button class="btn block" id="retry" type="button">Try again</button>
    </section>
  `);
  $("#retry").addEventListener("click", () => renderOnboarding());
}

/* ============================  5. MATCH SCREEN  ========================== */

function showMatch() {
  setTabs(true); setActiveTab("match"); setWhoami();
  renderCenter("Your match", "Loading your match…");
  loadMatch();
  setPoll(loadMatch, 4000); // keep checking while you wait (and to catch "confirmed")
}

async function loadMatch() {
  try {
    const r = await api("/api/match", { method: "POST", body: JSON.stringify({ profileId: Number(store.profileId) }) });
    renderMatch(r);
  } catch (e) {
    renderCenterError("Your match", e.message);
  }
}

function renderMatch(r) {
  if (r.status === "waiting") {
    setView(`
      <section class="screen">
        <h1 class="screen-title">Your match</h1>
        <div class="card waiting-card">
          <div class="pulse" aria-hidden="true"><span></span></div>
          <h2>Waiting for a buddy</h2>
          <p class="muted">You're in the pool, ${escapeHtml(firstName(store.name) || "friend")}.
            As soon as someone compatible signs up, we'll pair you automatically —
            this screen updates on its own.</p>
          <div class="mini-note">Tip: open this app on another device (or a private window)
            and sign up as a second person to watch a match happen.</div>
          <button class="btn ghost block" id="recheck" type="button">Check now</button>
        </div>
        <button class="linkbtn center" id="startover" type="button">Start over</button>
      </section>
    `);
    $("#recheck").addEventListener("click", loadMatch);
    $("#startover").addEventListener("click", startOver);
    return;
  }

  const src = r.source === "ai" ? pill("ai", "Chosen by AI") : pill("rule", "Chosen by rules");
  const status = r.status === "confirmed" ? pill("confirmed", "Confirmed") : pill("matched", "Matched");
  setView(`
    <section class="screen">
      <h1 class="screen-title">Your match</h1>
      <div class="card match-card">
        <div class="match-head">
          <div class="pills">${status} ${src}</div>
          <span class="muted small">match strength ${escapeHtml(String(r.score))}</span>
        </div>
        <div class="buddy">
          <div class="buddy-avatar" aria-hidden="true">${escapeHtml(initial(r.buddy.name))}</div>
          <div>
            <p class="buddy-label">You matched with</p>
            <p class="buddy-name">${escapeHtml(r.buddy.name)}</p>
          </div>
        </div>
        <div class="why"><p class="why-label">Why you two</p><p>${escapeHtml(r.reason)}</p></div>
        <button class="btn block" id="toChat" type="button">${r.status === "confirmed" ? "Open conversation" : "Say hi"}</button>
      </div>
      <button class="linkbtn center" id="startover" type="button">Start over</button>
    </section>
  `);
  $("#toChat").addEventListener("click", () => setHash("#/chat"));
  $("#startover").addEventListener("click", startOver);
}

function startOver() {
  if (!confirm("Start over? This forgets you on this device so you can sign up again.")) return;
  store.clear();
  flow.index = 0; flow.answers = {}; flow.profile = { name: "", email: "", age: "" };
  setHash("#/");
}

/* ============================  6. CHAT SCREEN  =========================== */

let chatBuilt = false;   // have we drawn the chat shell (header + input) yet?
let chatCount = -1;      // last message count we saw (to know when to scroll down)

function showChat() {
  setTabs(true); setActiveTab("chat"); setWhoami();
  chatBuilt = false; chatCount = -1;
  renderCenter("Conversation", "Opening your conversation…");
  loadChat();
  setPoll(loadChat, 4000);
}

async function loadChat() {
  const me = Number(store.profileId);
  let r;
  try { r = await api("/api/messages?profileId=" + me); }
  catch (e) { if (!chatBuilt) renderCenterError("Conversation", e.message); return; }

  // No match yet — a friendly wait, not a dead end.
  if (!r.matchId) { chatBuilt = false; renderChatEmpty(); return; }

  if (!chatBuilt) buildChatShell();
  $("#chatTitle").textContent = "You + " + firstName(r.buddyName);
  $("#chatSub").textContent = r.status === "confirmed"
    ? "You're connected — keep the plan going."
    : "Send the first message to confirm your match.";

  const thread = $("#thread");
  thread.innerHTML = r.messages.length
    ? r.messages.map((m) => bubble(m, me, r.buddyName)).join("")
    : `<p class="thread-empty muted">No messages yet. Say hi to break the ice.</p>`;

  // Scroll to the newest message when the count grows (or on first open).
  if (r.messages.length !== chatCount) { view.scrollTop = view.scrollHeight; chatCount = r.messages.length; }
}

function buildChatShell() {
  chatBuilt = true;
  setView(`
    <section class="screen chat-screen">
      <div class="chat-headline">
        <h1 class="screen-title" id="chatTitle">Conversation</h1>
        <p class="muted small" id="chatSub"></p>
      </div>
      <div id="thread" class="thread"></div>
      <form id="chat-form" class="composer" autocomplete="off">
        <input id="chat-input" class="text-input" type="text" placeholder="Say hi…" />
        <button class="btn send" type="submit">Send</button>
      </form>
    </section>
  `);
  $("#chat-form").addEventListener("submit", onSend);
}

async function onSend(e) {
  e.preventDefault();
  const input = $("#chat-input");
  const body = input.value.trim();
  if (!body) return;
  input.value = "";
  try {
    await api("/api/messages", { method: "POST", body: JSON.stringify({ profileId: Number(store.profileId), body }) });
    await loadChat();
    input.focus();
  } catch (ex) { input.value = body; alert(ex.message); }
}

function renderChatEmpty() {
  setView(`
    <section class="screen">
      <h1 class="screen-title">Conversation</h1>
      <div class="card empty-card">
        <div class="empty-emoji">💬</div>
        <h2>No buddy yet</h2>
        <p class="muted">Once you're matched, your conversation shows up here.
          Hang tight — we're still looking.</p>
        <button class="btn block" id="toMatch" type="button">Go to your match</button>
      </div>
    </section>
  `);
  $("#toMatch").addEventListener("click", () => setHash("#/match"));
}

function bubble(m, me, buddyName) {
  const mine = m.sender_id === me;
  return `<div class="bubble ${mine ? "mine" : "theirs"}">
    <span class="bmeta">${mine ? "You" : escapeHtml(firstName(buddyName))} · ${escapeHtml(shortTime(m.created_at))}</span>
    <span class="btext">${escapeHtml(m.body)}</span>
  </div>`;
}

/* ==========================  7. ORGANIZER SCREEN  ======================== */

function showOrganizer() {
  setTabs(true); setActiveTab("organizer"); setWhoami();
  renderCenter("Organizer", "Loading the room…");
  loadOrganizer();
  setPoll(loadOrganizer, 6000);
}

async function loadOrganizer() {
  let r;
  try { r = await api("/api/organizer"); }
  catch (e) { return renderCenterError("Organizer", e.message); }

  const matches = r.matches, pool = r.profiles;
  setView(`
    <section class="screen">
      <h1 class="screen-title">Organizer</h1>
      <p class="admin-note">The run-the-event view: everyone in the pool and every match.
        It's open to anyone with the link — fine for a class demo. The README shows how to lock it down.</p>

      <div class="section-head"><h2>Matches</h2><span class="count">${matches.length}</span></div>
      ${matches.length ? matches.map(matchRow).join("") : emptyBox("No matches yet.")}

      <div class="section-head"><h2>The pool</h2><span class="count">${pool.length}</span></div>
      ${pool.length ? pool.map(poolRow).join("") : emptyBox("Nobody has signed up yet.")}
    </section>
  `);
}

function matchRow(m) {
  const src = m.source === "ai" ? pill("ai", "AI") : pill("rule", "rules");
  const status = pill(m.status, m.status);
  return `<div class="o-card">
    <div class="o-top"><strong>${escapeHtml(m.a_name)}</strong> + <strong>${escapeHtml(m.b_name)}</strong>
      <span class="o-msgs">${m.message_count} msg${m.message_count === 1 ? "" : "s"}</span></div>
    <p class="o-why">${escapeHtml(m.reason)}</p>
    <div class="o-pills">${status} ${src}</div>
  </div>`;
}

function poolRow(p) {
  const answers = Object.entries(p.answers || {})
    .map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(Array.isArray(v) ? v.join("/") : v)}`).join(" · ");
  const state = p.matched ? pill("matched", "matched") : pill("waiting", "waiting");
  return `<div class="o-card">
    <div class="o-top"><strong>${escapeHtml(p.name)}</strong> ${state}
      <span class="o-msgs">age ${escapeHtml(String(p.age))}</span></div>
    <p class="o-email muted small">${escapeHtml(p.email)}</p>
    <p class="o-answers small">${answers || "<span class='muted'>no answers</span>"}</p>
  </div>`;
}

function emptyBox(text) { return `<div class="empty-box muted">${escapeHtml(text)}</div>`; }

/* ======================  SHARED LOADING / ERROR STATES  ================== */

function renderCenter(title, msg) {
  setView(`
    <section class="screen">
      <h1 class="screen-title">${escapeHtml(title)}</h1>
      <div class="card center-card"><div class="spinner"></div><p class="muted">${escapeHtml(msg)}</p></div>
    </section>
  `);
}
function renderCenterError(title, msg) {
  setView(`
    <section class="screen">
      <h1 class="screen-title">${escapeHtml(title)}</h1>
      <div class="card center-card">
        <div class="empty-emoji">😕</div>
        <p class="muted">${escapeHtml(msg)}</p>
        <button class="btn ghost" id="retry" type="button">Try again</button>
      </div>
    </section>
  `);
  $("#retry").addEventListener("click", route);
}

/* ==============================  START UP  =============================== */

buildSteps();
route();

// Register the service worker so the app can be installed on a phone / used offline.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
