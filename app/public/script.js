const form = document.querySelector("#task-form");
const input = document.querySelector("#task-title");
const list = document.querySelector("#task-list");

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    throw new Error("Falha na requisicao");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function loadTasks() {
  const tasks = await request("/api/tasks");
  list.innerHTML = "";

  tasks.forEach((task) => {
    const item = document.createElement("li");
    const title = document.createElement("span");
    const toggle = document.createElement("button");
    const remove = document.createElement("button");

    title.className = `task-title${task.completed ? " completed" : ""}`;
    title.textContent = task.title;

    toggle.textContent = task.completed ? "Reabrir" : "Concluir";
    toggle.addEventListener("click", async () => {
      await request(`/api/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ completed: !task.completed })
      });
      await loadTasks();
    });

    remove.textContent = "Remover";
    remove.addEventListener("click", async () => {
      await request(`/api/tasks/${task.id}`, { method: "DELETE" });
      await loadTasks();
    });

    item.append(title, toggle, remove);
    list.appendChild(item);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await request("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ title: input.value })
  });
  input.value = "";
  await loadTasks();
});

loadTasks().catch(() => {
  list.innerHTML = "<li>Configure o banco de dados para carregar as tarefas.</li>";
});

