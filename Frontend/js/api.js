console.log("api.js loaded");

const API_BASE = "http://158.160.171.150:8080/api";

async function fetchSubjects() {
    if (currentUser == null) return;
    const res = await fetch(`${API_BASE}/subjects`, { credentials: 'include' });
    if (!res.ok) throw new Error("Ошибка загрузки предметов");
    const subjects = await res.json();

    for (const s of subjects) {
        s.projects = s.projects || [];
        for (const p of s.projects) {
            p.tasks = p.tasks || [];
            p.responsibles = p.responsibles || [];
        }
    }

    return subjects;
}

function filterSubjectsByStudent(subjects, studentId) {
    if (currentUser == null) return;
    if (!studentId) return subjects.map(s => ({ ...s, projects: [] }));

    return subjects.map(s => {
        const filteredProjects = (s.projects || []).filter(p => {
            if (!p.team || !p.team.length) return false;
            return p.team.some(member => String(member.id) === String(studentId));
        }).map(p => {
            p.tasks = p.tasks || [];
            p.responsibles = p.responsibles || [];
            return p;
        });

        return { ...s, projects: filteredProjects };
    }).filter(s => (s.projects || []).length > 0 || true);
}

async function fetchProjects(subjectId) {
    if (currentUser == null) return;
    const res = await fetch(`${API_BASE}/subjects/${subjectId}/projects`);
    if (!res.ok) throw new Error("Ошибка загрузки проектов");
    return await res.json();
}

async function fetchTasks(projectId) {
    if (currentUser == null) return;
    const res = await fetch(`${API_BASE}/projects/${projectId}/tasks`);
    if (!res.ok) throw new Error("Ошибка загрузки задач");
    const tasks = await res.json();

    tasks.forEach(t => {
        t.depends = (t.dependencies || []).map(d => d.dependsOnTaskId);
        t.stages = (t.stages || []).map(s => ({
            id: s.id,
            title: s.title,
            duration: s.durationDays,
            done: s.isDone
        }));
    });

    return tasks;
}

async function openSubject(id) {
    if (currentUser == null) return;
    await loadProjectsToState(id);
    state.currentSubject = state.subjects.find(s => s.id === id);
    renderProjects(state.currentSubject);
}

async function createProject() {
    if (currentUser == null) return;
    if (!currentSubjectId) return alert('Сначала выберите предмет');
    const name = prompt('Название проекта:', 'Курсовой проект');
    if (!name) return;

    const dl = prompt('Дедлайн проекта (YYYY-MM-DD)', new Date().toISOString().slice(0, 10));

    if (dl) {
        const date = new Date(dl + "T12:00:00");
        const parts = dl.split('-');
        const y = +parts[0], m = +parts[1], d = +parts[2];
        const valid =
            parts.length === 3 &&
            !isNaN(date) &&
            date.getFullYear() === y &&
            date.getMonth() + 1 === m &&
            date.getDate() === d &&
            m >= 1 && m <= 12 && d >= 1 && d <= 31;

        if (!valid) {
            alert("Ошибка: некорректная дата дедлайна! Используйте формат YYYY-MM-DD и существующую дату.");
            return;
        }
    }

    const proj = {
        name: name.trim(),
        deadline: dl || null
    };

    try {
        const newProj = await addProjectAPI(currentSubjectId, proj);
        const subj = state.subjects.find(x => x.id === currentSubjectId);
        subj.projects = subj.projects || [];
        subj.projects.push({ ...newProj, tasks: [], responsibles: [] });
        renderSubjects();
        renderProjects(subj);
        openProject(subj.id, newProj.id);
    } catch (err) {
        alert("Ошибка добавления проекта: " + err.message);
    }
}

async function addSubjectAPI(name) {
    if (currentUser == null) return;
    const res = await fetch(`${API_BASE}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error("Ошибка добавления предмета");
    return await res.json();
}

async function addResponsibleAPI(projectId, name) {
    if (currentUser == null) return;
    const res = await fetch(`${API_BASE}/responsibles/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}

async function addProjectAPI(subjectId, project) {
    if (currentUser == null) return;
    const res = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: project.name,
            deadline: project.deadline,
            subjectId
        })
    });
    if (!res.ok) throw new Error("Ошибка добавления проекта");
    return await res.json();
}

async function addTaskAPI(projectId, t) {
    if (currentUser == null) return;
    const payload = {
        projectId,
        title: t.title,
        start: t.start,
        deadline: t.deadline,
        isDone: t.done ?? false,
        description: t.description ?? "",
        responsible: t.responsible ?? null,
        duration: t.duration ?? null,
        stages: (t.stages || []).map(s => ({
            id: 0,
            title: s.title,
            durationDays: Number(s.duration),
            isDone: Boolean(s.done),
            updated: new Date().toISOString()
        })),
        dependencies: (t.depends || []).map(id => ({
            dependsOnTaskId: id
        }))
    };

    console.log("Sending task payload:", payload);

    const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        console.error(await res.text());
        throw new Error("Ошибка добавления задачи");
    }
    const data = await res.json();
    console.log("Server response:", data);
    return data;
}

async function loadTasks(proj) {
    if (currentUser == null) return;
    proj.tasks = await fetchTasks(proj.id);
    proj.tasks.forEach(t => {
        t.done = t.isDone ?? false;
    });
    renderTasks(proj);
}

async function loadProjectsToState(subjectId) {
    if (currentUser == null) return;
    const projects = await fetchProjects(subjectId);

    const subj = state.subjects.find(s => s.id === subjectId);
    subj.projects = projects;
}

async function updateProjectAPI(projectId, data) {
    if (currentUser == null) return;
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error("Ошибка обновления проекта: " + text);
    }
    return await res.json();
}

async function updateTaskAPI(taskId, data) {
    if (currentUser == null) return;
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}

async function deleteResponsibleAPI(id) {
    if (currentUser == null) return;
    const res = await fetch(`${API_BASE}/responsibles/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
}

async function deleteSubjectAPI(subjectId) {
    if (currentUser == null) return;
    const res = await fetch(`${API_BASE}/subjects/${subjectId}`, { method: 'DELETE' });
    if (!res.ok) {
        const text = await res.text();
        throw new Error("Ошибка удаления предмета: " + text);
    }
}

async function deleteProjectAPI(projectId) {
    if (currentUser == null) return;
    const res = await fetch(`${API_BASE}/projects/${projectId}`, { method: 'DELETE' });
    if (!res.ok) {
        const text = await res.text();
        throw new Error("Ошибка удаления проекта: " + text);
    }
}

async function deleteTaskAPI(taskId) {
    if (currentUser == null) return;
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' });
    if (!res.ok) {
        const text = await res.text();
        throw new Error("Ошибка удаления задачи: " + text);
    }
}

