const CONVEX_URL = "https://usable-tortoise-739.eu-west-1.convex.cloud";

const client = new convex.ConvexClient(CONVEX_URL);

// Estado local
let allTasks = [];
let currentFilter = "all";

// Referencias DOM
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const emptyMsg = document.getElementById("emptyMsg");
const statsText = document.getElementById("statsText");
const filterBtns = document.querySelectorAll(".filter-btn");

// ─────────────────────────────
// SUSCRIPCIÓN EN TIEMPO REAL
// ─────────────────────────────
client.onUpdate("tasks:getTasks", {}, (tasks) => {
  allTasks = tasks || [];
  renderTasks();
});

// ─────────────────────────────
// RENDERIZAR TAREAS
// ─────────────────────────────
function renderTasks() {
  const filtered = allTasks.filter((task) => {
    if (currentFilter === "pending") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  taskList.innerHTML = "";

  if (filtered.length === 0) {
    emptyMsg.classList.remove("hidden");
  } else {
    emptyMsg.classList.add("hidden");
    filtered.forEach((task) => {
      taskList.appendChild(createTaskElement(task));
    });
  }

  const total = allTasks.length;
  const done = allTasks.filter((t) => t.completed).length;
  statsText.textContent = `${done} de ${total} completadas`;
}

// ─────────────────────────────
// CREAR ELEMENTO DE TAREA
// ─────────────────────────────
function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = `task-item ${task.completed ? "completed" : ""}`;
  li.dataset.id = task._id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked = task.completed;
  checkbox.addEventListener("change", () => toggleTask(task._id));

  const span = document.createElement("span");
  span.className = `task-text ${task.completed ? "done" : ""}`;
  span.contentEditable = "false";
  span.textContent = task.text;

  const editBtn = document.createElement("button");
  editBtn.className = "btn-edit";
  editBtn.title = "Editar";
  editBtn.textContent = "✏️";
  editBtn.addEventListener("click", () => startEdit(span, task._id, editBtn));

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn-delete";
  deleteBtn.title = "Eliminar";
  deleteBtn.textContent = "🗑️";
  deleteBtn.addEventListener("click", () => deleteTask(task._id));

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(editBtn);
  li.appendChild(deleteBtn);

  return li;
}

// ─────────────────────────────
// EDICIÓN INLINE
// ─────────────────────────────
function startEdit(span, id, btn) {
  if (span.contentEditable === "true") {
    const newText = span.textContent.trim();
    if (newText.length > 0) {
      client.mutation("tasks:editTask", { id, text: newText });
    } else {
      span.textContent = allTasks.find((t) => t._id === id)?.text || "";
    }
    span.contentEditable = "false";
    btn.textContent = "✏️";
  } else {
    span.contentEditable = "true";
    span.focus();
    btn.textContent = "💾";
    const range = document.createRange();
    range.selectNodeContents(span);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

// ─────────────────────────────
// OPERACIONES CONVEX
// ─────────────────────────────
async function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  addBtn.disabled = true;
  try {
    await client.mutation("tasks:createTask", { text });
    taskInput.value = "";
    taskInput.focus();
  } catch (e) {
    alert("Error al agregar la tarea: " + e.message);
  } finally {
    addBtn.disabled = false;
  }
}

async function toggleTask(id) {
  await client.mutation("tasks:toggleTask", { id });
}

async function deleteTask(id) {
  if (!confirm("¿Eliminar esta tarea?")) return;
  await client.mutation("tasks:deleteTask", { id });
}

// ─────────────────────────────
// EVENTOS
// ─────────────────────────────
addBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});
