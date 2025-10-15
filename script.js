let tasks = [];

function loadTasks() {
  const raw = localStorage.getItem("my_tasks");
  tasks = raw ? JSON.parse(raw) : [];
  sortTasks();
  renderTasks();
}

function saveTasks() {
  localStorage.setItem("my_tasks", JSON.stringify(tasks));
}

function addTask(text) {
  const dueDate = document.getElementById("dueDate").value;
  const task = {
    id: Date.now(),
    text: text.trim(),
    done: false,
    important: false,
    dueDate: dueDate || null,
  };

  if (!task.text) return;
  tasks.push(task);
  saveTasks();
  sortTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  saveTasks();
  sortTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

function toggleImportant(id) {
  tasks = tasks.map((t) =>
    t.id === id ? { ...t, important: !t.important } : t
  );
  saveTasks();
  sortTasks();
  renderTasks();
}

function renderTasks() {
  const list = document.getElementById("tasks");
  list.innerHTML = "";

  const now = new Date();

  tasks.forEach((t) => {
    const li = document.createElement("li");
    li.className = t.done ? "completed" : "";

    // ✅ Υπολογισμός υπολειπόμενων ημερών
    let dueClass = "";
    let dueLabel = "";

    if (t.dueDate) {
      const due = new Date(t.dueDate);
      const diffDays = Math.floor((due - now) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        dueClass = "overdue";
        dueLabel = "⛔ Εκπρόθεσμο";
      } else if (diffDays === 0) {
        dueClass = "due-today";
        dueLabel = "⚠️ Λήγει σήμερα";
      } else if (diffDays === 1) {
        dueClass = "due-soon";
        dueLabel = "📅 1 ημέρα απομένει";
      } else if (diffDays === 2) {
        dueClass = "due-soon";
        dueLabel = "📅 2 ημέρες απομένουν";
      }
    }

    const due = t.dueDate
      ? `<small class="due-date ${dueClass}">${t.dueDate} ${dueLabel}</small>`
      : "";

    li.innerHTML = `
      <span>
        ${t.text}
        ${due}
      </span>
      <div class="actions">
        <button class="star-btn" onclick="toggleImportant(${t.id})">
          ${t.important ? "⭐" : "☆"}
        </button>
        <button class="complete-btn" onclick="toggleTask(${t.id})">
          ${t.done ? "Undo" : "Done"}
        </button>
        <button class="delete-btn" onclick="deleteTask(${t.id})">Delete</button>
      </div>
    `;

    list.appendChild(li);
  });

  checkReminders();
}

function sortTasks() {
  const criteria = document.getElementById("sortSelect").value;

  if (criteria === "date") {
    tasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else if (criteria === "important") {
    tasks.sort((a, b) => b.important - a.important);
  }
}

document.getElementById("addBtn").addEventListener("click", () => {
  const input = document.getElementById("taskInput");
  addTask(input.value);
  input.value = "";
  document.getElementById("dueDate").value = "";
});

document.getElementById("taskInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("addBtn").click();
  }
});

document.getElementById("sortSelect").addEventListener("change", () => {
  sortTasks();
  renderTasks();
});

window.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  requestNotificationPermission();

  // ✅ Έλεγχος υπενθυμίσεων κάθε 30 λεπτά
  setInterval(checkReminders, 30 * 60 * 1000);
});

// 🔔 ΥΠΕΝΘΥΜΙΣΕΙΣ

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}

function checkReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const now = new Date();

  tasks.forEach((task) => {
    if (!task.dueDate || task.done) return;

    const due = new Date(task.dueDate);
    const diffDays = Math.floor((due - now) / (1000 * 60 * 60 * 24));

    // 🔹 2 ημέρες πριν
    if (diffDays === 2 && !task.reminded2Days) {
      new Notification("📅 Υπενθύμιση", {
        body: `Απομένουν 2 ημέρες για: "${task.text}"`,
      });
      task.reminded2Days = true;
    }

    // 🔹 1 ημέρα πριν
    else if (diffDays === 1 && !task.reminded1Day) {
      new Notification("📅 Υπενθύμιση", {
        body: `Απομένει 1 ημέρα για: "${task.text}"`,
      });
      task.reminded1Day = true;
    }

    // 🔹 Την ημέρα λήξης
    else if (diffDays === 0 && !task.remindedToday) {
      new Notification("⏰ Σήμερα λήγει", {
        body: `Η εργασία "${task.text}" λήγει σήμερα!`,
      });
      task.remindedToday = true;
    }
  });

  saveTasks();
}
