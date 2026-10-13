const STORAGE_KEY = "studyPlannerTasks_v1";

const $ = id => document.getElementById(id);

let tasks = loadTasks();

function loadTasks() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(data)) return [];

    return data.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.name === "string" &&
      typeof task.subject === "string" &&
      typeof task.date === "string" &&
      Number.isFinite(task.duration) &&
      task.duration > 0 &&
      ["Low", "Medium", "High"].includes(task.priority) &&
      typeof task.completed === "boolean"
    );
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tasks)
    );
    return true;
  } catch {
    alert("Unable to save tasks. Check browser storage.");
    return false;
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function updateDashboard() {
  const completed = tasks.filter(task => task.completed).length;
  const pending = tasks.length - completed;

  $("totalTasks").textContent = tasks.length;
  $("completedTasks").textContent = completed;
  $("pendingTasks").textContent = pending;

  const percentage = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  $("progress").textContent = percentage + "%";
}

function renderTasks() {
  const filter = $("filter").value;
  const search = $("search").value.trim().toLowerCase();

  const filtered = tasks
    .filter(task => {
      if (filter === "Pending" && task.completed) return false;
      if (filter === "Completed" && !task.completed) return false;

      return (
        task.name.toLowerCase().includes(search) ||
        task.subject.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  if (filtered.length === 0) {
    $("taskList").innerHTML = `
      <div class="empty">
        <h3>No study tasks found</h3>
        <p>Add a task or change your filters.</p>
      </div>`;
    return;
  }

  $("taskList").innerHTML = filtered.map(task => `
    <article class="task ${task.completed ? "completed" : ""}">
      <div class="task-info">
        <div class="task-name">${escapeHTML(task.name)}</div>

        <div class="task-meta">
          <span>📘 ${escapeHTML(task.subject)}</span>
          <span>📅 ${escapeHTML(task.date)}</span>
          <span>⏱ ${task.duration} min</span>
          <span class="badge ${task.priority}">
            ${escapeHTML(task.priority)} Priority
          </span>
          <span>${task.completed ? "Completed" : "Pending"}</span>
        </div>
      </div>

      <div class="task-actions">
        <button class="done-btn"
          data-action="toggle"
          data-id="${escapeHTML(task.id)}">
          ${task.completed ? "Undo" : "Complete"}
        </button>

        <button class="delete-btn"
          data-action="delete"
          data-id="${escapeHTML(task.id)}">
          Delete
        </button>
      </div>
    </article>
  `).join("");
}

function refresh() {
  updateDashboard();
  renderTasks();
}

$("taskForm").addEventListener("submit", event => {
  event.preventDefault();

  const duration = Number($("studyTime").value);
  const date = $("studyDate").value;

  if (
    !Number.isInteger(duration) ||
    duration < 1 ||
    duration > 1440
  ) {
    alert("Enter a duration between 1 and 1440 minutes.");
    return;
  }

  if (!date) {
    alert("Please select a study date.");
    return;
  }

  const task = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString() + Math.random().toString(36).slice(2),
    name: $("taskName").value.trim(),
    subject: $("subject").value,
    date,
    duration,
    priority: $("priority").value,
    completed: false
  };

  if (!task.name || !task.subject) {
    alert("Please complete all required fields.");
    return;
  }

  tasks.push(task);

  if (!saveTasks()) {
    tasks.pop();
    return;
  }

  event.target.reset();
  $("studyDate").value = getToday();
  $("studyTime").value = 30;
  $("priority").value = "Medium";

  refresh();
});

$("taskList").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const index = tasks.findIndex(
    task => task.id === button.dataset.id
  );

  if (index === -1) return;

  const action = button.dataset.action;
  const oldTasks = tasks.map(task => ({ ...task }));

  if (action === "toggle") {
    tasks[index].completed = !tasks[index].completed;
  } else if (action === "delete") {
    if (!confirm("Delete this study task?")) return;

    tasks.splice(index, 1);
  } else {
    return;
  }

  if (!saveTasks()) {
    tasks = oldTasks;
    return;
  }

  refresh();
});

$("filter").addEventListener("change", renderTasks);
$("search").addEventListener("input", renderTasks);

$("today").textContent = new Date().toLocaleDateString(
  "en-IN",
  {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }
);

$("studyDate").value = getToday();

refresh();