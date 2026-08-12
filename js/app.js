import { createStorage } from "./storage.js";
import { createTimer } from "./timer.js";

const storage = createStorage(window.localStorage);
let state = storage.loadState();
let selectedSeconds = 25 * 60;
let selectedLabel = "专注";

const el = id => document.getElementById(id);
const timeEl = el("time");
const statusEl = el("timer-status");

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function renderTimer(snapshot) {
  timeEl.textContent = formatTime(snapshot.remainingSeconds);
  document.title = `${formatTime(snapshot.remainingSeconds)} · 番茄日程`;
  statusEl.textContent = snapshot.completed
    ? `${selectedLabel}完成，做得好。`
    : snapshot.running ? `正在${selectedLabel}` : `准备开始 · ${selectedLabel}`;
}

const timer = createTimer({
  seconds: selectedSeconds,
  onChange: renderTimer,
  onComplete: () => {
    if (selectedLabel !== "专注") return;
    state.sessions.unshift({ id: crypto.randomUUID(), completedAt: new Date().toISOString(), minutes: Math.round(selectedSeconds / 60) });
    state.sessions = state.sessions.slice(0, 30);
    persistAndRender();
  }
});

function persistAndRender() {
  storage.saveState(state);
  renderTasks();
  renderSessions();
}

function renderTasks() {
  const list = el("task-list");
  list.replaceChildren();
  state.tasks.forEach(task => {
    const item = document.createElement("li");
    item.className = `task-item${task.done ? " done" : ""}`;
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `标记“${task.title}”${task.done ? "未完成" : "完成"}`);
    checkbox.addEventListener("change", () => { task.done = checkbox.checked; persistAndRender(); });
    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    const remove = document.createElement("button");
    remove.className = "delete-task";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `删除“${task.title}”`);
    remove.addEventListener("click", () => { state.tasks = state.tasks.filter(entry => entry.id !== task.id); persistAndRender(); });
    label.append(checkbox, title);
    item.append(label, remove);
    list.append(item);
  });
  el("task-empty").hidden = state.tasks.length > 0;
  el("task-count").textContent = `${state.tasks.length} 项`;
}

function renderSessions() {
  const list = el("session-list");
  list.replaceChildren();
  state.sessions.slice(0, 5).forEach(session => {
    const item = document.createElement("li");
    item.className = "session-item";
    const title = document.createElement("strong");
    title.textContent = `${session.minutes} 分钟专注`;
    const date = document.createElement("time");
    date.dateTime = session.completedAt;
    date.textContent = new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(session.completedAt));
    item.append(title, date);
    list.append(item);
  });
  el("session-empty").hidden = state.sessions.length > 0;
  el("clear-history").hidden = state.sessions.length === 0;
}

document.querySelectorAll(".mode").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mode").forEach(mode => mode.classList.remove("active"));
    button.classList.add("active");
    selectedSeconds = Number(button.dataset.seconds);
    selectedLabel = button.dataset.label;
    timer.reset(selectedSeconds);
  });
});
el("start").addEventListener("click", () => timer.start());
el("pause").addEventListener("click", () => timer.pause());
el("reset").addEventListener("click", () => timer.reset(selectedSeconds));
el("task-form").addEventListener("submit", event => {
  event.preventDefault();
  const input = el("task-input");
  const title = input.value.trim();
  if (!title) return;
  state.tasks.unshift({ id: crypto.randomUUID(), title, done: false });
  input.value = "";
  persistAndRender();
  input.focus();
});
el("clear-history").addEventListener("click", () => { state.sessions = []; persistAndRender(); });

renderTimer(timer.snapshot());
renderTasks();
renderSessions();
