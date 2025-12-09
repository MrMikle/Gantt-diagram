console.log("1.js loaded");

const API_URL = "http://localhost:5000/api";

const authModal = document.getElementById('authModal');
const closeAuthBtn = document.getElementById('closeAuth');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const openAuthBtn = document.getElementById('openAuth');
const userDropdown = document.getElementById('userDropdown');
const logoutBtn = document.getElementById('logoutBtn');
let currentUser = null;

function updateAuthButton() {
    if (currentUser) {
        openAuthBtn.textContent = currentUser;
        openAuthBtn.classList.add("ghost");
        openAuthBtn.disabled = false;
    } else {
        openAuthBtn.textContent = "Войти";
        openAuthBtn.classList.remove("ghost");
        userDropdown.classList.add("hidden");
    }
}

openAuthBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentUser) {
        authModal.classList.remove("hidden");
    } else {
        userDropdown.classList.toggle("hidden");
    }
});

document.addEventListener('click', () => {
    userDropdown.classList.add('hidden');
});


logoutBtn.addEventListener('click', logoutUser);

function openAuthModal() { authModal.classList.remove('hidden'); }
function closeAuthModal() { authModal.classList.add('hidden'); }
closeAuthBtn.addEventListener('click', closeAuthModal);
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
});

function showLogin() {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
}
function showRegister() {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
}
loginTab.addEventListener('click', showLogin);
registerTab.addEventListener('click', showRegister);

loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    if (!user || !pass) return;
    await loginUserFunc(user, pass);
};

registerForm.onsubmit = async (e) => {
    e.preventDefault();
    const user = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    if (!user || !pass) return;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login: user, password: pass })
        });
        if (!res.ok) {
            const err = await res.json();
            alert(err.error || "Ошибка регистрации");
            return;
        }
        await loginUserFunc(user, pass);
    } catch (err) {
        console.error(err);
        alert("Ошибка сети");
    }
};

async function logoutUser() {
    try {
        const res = await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            credentials: "include"
        });
        if (res.ok) {
            currentUser = null;
            clearAppState();
            userDropdown.classList.add("hidden");
        } else {
            alert("Не удалось выйти");
        }
    } catch (err) {
        console.error(err);
        alert("Ошибка сети");
    }
}

async function loginUserFunc(user, pass) {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login: user, password: pass }),
            credentials: "include"
        });
        if (!res.ok) {
            const err = await res.json();
            alert(err.error || "Ошибка входа");
            return;
        }
        currentUser = user;
        updateAuthButton();
        authModal.classList.add("hidden");
        await loadUserData(); 
    } catch (err) {
        console.error(err);
        alert("Ошибка сети");
    }
}

async function checkSession() {
    try {
        const res = await fetch(`${API_URL}/auth/session`, { credentials: 'include' });

        if (res.ok) {
            const data = await res.json();
            currentUser = data.login;
        } else {
            currentUser = null;
        }
    } catch (err) {
        currentUser = null;
        console.log("Не удалось проверить сессию:", err);
    }

    updateAuthButton();
}

async function renderStudentProjects(studentId) {
    const projects = await loadStudentProjects(studentId);
    const container = document.getElementById('projectsTabs');
    if (!container) return; 
    container.innerHTML = ""; 
    projects.forEach(p => {
        const div = document.createElement('div');
        div.textContent = p.name;
        container.appendChild(div);
    });
}

async function loadStudentProjects(studentId) {
    const res = await fetch(`${API_URL}/students/${studentId}/projects`, {
        credentials: "include"
    });
    if (!res.ok) return [];
    return await res.json();
}

async function getStudentId() {
    const res = await fetch(`${API_URL}/auth/studentId`, { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id;
}

function clearAppState() {
    state.subjects = [];
    state.currentSubjectId = null;
    currentProjectId = null;

    const containers = [
        'subjectsList',
        'projectsTabs',
        'tasksList',
        'responsiblesList',
        'ganttSvg'
    ];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });

    const hideBlocks = ['projectsArea', 'projectDetail'];
    hideBlocks.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    updateAuthButton();
}

async function loadUserData() {
    const studentId = await getStudentId();
    if (!studentId) {
        state.subjects = [];
        renderSubjects();
        return;
    }

    const subjectsAll = await fetchSubjects();

    state.subjects = filterSubjectsByStudent(subjectsAll, studentId);

    renderSubjects();

    if (currentSubjectId) {
        const subj = state.subjects.find(s => s.id === currentSubjectId);
        if (subj) renderProjects(subj);
    }
}

async function init() {
    console.log(currentUser);
    await checkSession();  
    updateAuthButton();

    if (currentUser) {
        try {
            await loadUserData();
        } catch (err) {
            console.error("Ошибка загрузки данных пользователя:", err);
        }
    } else {
        clearAppState();
    }
}

async function openProfilePage() {
    const profilePage = document.getElementById('profilePage');
    if (!profilePage || !currentUser) return;

    clearAppState();
    await loadUserData();  
}

document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.getElementById('profilePageBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            openProfilePage();
        });
    }
    init();
});

console.log("api.js loaded");

const API_BASE = "http://localhost:5000/api";

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
    if (currentUser == null) return [];
    return subjects.map(s => {
        const filteredProjects = (s.projects || []).filter(p =>
            p.team?.some(member => String(member.id) === String(studentId))
        );
        return { ...s, projects: filteredProjects };
    });
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
        const studentId = await getStudentId();

        const newProj = await addProjectAPI(currentSubjectId, proj, studentId);
        const subj = state.subjects.find(x => x.id === currentSubjectId);
        subj.projects = subj.projects || [];

        subj.projects.push({
            ...newProj,
            tasks: [],
            responsibles: [],
            team: newProj.team
        });

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

async function addResponsibleAPI(projectId, studentId) {
    if (!currentUser) return;

    const res = await fetch(`${API_BASE}/projects/${projectId}/addStudent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Ошибка добавления студента в проект");
    }

    return await res.json();
}

async function addProjectAPI(subjectId, project, studentId) {
    if (currentUser == null) return;
    const res = await fetch(`${API_BASE}/projects?creatorId=${studentId}&subjectId=${subjectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: project.name,
            deadline: project.deadline
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

    // подгружаем студентов для каждого проекта
    for (const proj of subj.projects) {
        if (!proj.team) proj.team = [];
        if (!proj.responsibles) proj.responsibles = [];
        try {
            const res = await fetch(`${API_BASE}/projects/${proj.id}/team`, { credentials: 'include' });
            if (res.ok) {
                const team = await res.json(); // [{id, login}]
                proj.team = team;
                proj.responsibles = team.map(s => ({ id: s.id, name: s.login }));
            }
        } catch (err) {
            console.error('Ошибка загрузки команды проекта', err);
        }
    }
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

console.log("2.js loaded");
function renderSubjects() {
    if (currentUser == null) return;
    subjectsList.innerHTML = '';
    if (state.subjects.length === 0) {
        subjectsList.innerHTML = '<div class="muted">Нет предметов. Добавьте с помощью кнопки +.</div>';
        return;
    }

    let tooltip = document.getElementById('tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        document.body.appendChild(tooltip);
    }

    state.subjects.forEach(s => {
        const el = document.createElement('div');
        el.className = 'item';
        el.style.display = 'flex';
        el.style.justifyContent = 'space-between';
        el.style.alignItems = 'center';
        el.style.gap = '10px';

        const infoDiv = document.createElement('div');
        infoDiv.style.flex = '1';
        infoDiv.style.overflow = 'hidden';
        infoDiv.style.textOverflow = 'ellipsis';
        infoDiv.style.whiteSpace = 'nowrap';
        infoDiv.style.minWidth = '0';
        infoDiv.style.position = 'relative';

        const nameEl = document.createElement('strong');
        nameEl.textContent = s.name;
        nameEl.classList.add('has-tooltip');
        nameEl.dataset.fullname = s.name;

        nameEl.onmouseenter = e => {
            if (s.name.length > 10) {
                tooltip.textContent = s.name;
                tooltip.style.display = 'block';
                tooltip.style.left = e.pageX + 10 + 'px';
                tooltip.style.top = e.pageY - 30 + 'px';
            }
        };
        nameEl.onmousemove = e => {
            tooltip.style.left = e.pageX + 10 + 'px';
            tooltip.style.top = e.pageY - 30 + 'px';
        };
        nameEl.onmouseleave = () => {
            tooltip.style.display = 'none';
        };

        const projectsInfo = document.createElement('span');
        projectsInfo.className = 'muted small';
        projectsInfo.textContent = `проектов: ${(s.projects?.length || 0)}`;

        infoDiv.append(nameEl, document.createElement('br'), projectsInfo);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.gap = '6px';
        buttonsDiv.style.flexShrink = '0';

        const open = document.createElement('button');
        open.textContent = 'Открыть';
        open.onclick = () => openSubject(s.id);

        const del = document.createElement('button');
        del.textContent = '✕';
        del.className = 'ghost';
        del.onclick = async () => {
            if (confirm('Удалить предмет?')) {
                try {
                    await deleteSubjectAPI(s.id);
                    state.subjects = state.subjects.filter(x => x.id !== s.id);
                    renderSubjects();
                } catch (err) {
                    alert(err.message);
                }
            }
        };

        buttonsDiv.append(open, del);
        el.append(infoDiv, buttonsDiv);
        subjectsList.append(el);
    });
}

function renderProjects(subj) {
    if (!currentUser) return;
    projectsTabs.innerHTML = '';
    (subj.projects || []).forEach(p => {
        const el = document.createElement('div');
        el.className = 'tab';
        if (p.id === currentProjectId) el.classList.add('active');
        el.innerHTML = '<strong>' + escapeHtml(p.name) + '</strong><div class="muted small">DL: ' + (p.deadline || '—') + '</div>';
        el.onclick = () => {
            if (currentProjectId !== p.id) {
                openProject(subj.id, p.id);
            } else {
                openProjectEditor(p);
            }
        };
        projectsTabs.appendChild(el);
    });
}

function renderTasks(proj) {
    if (!currentUser) return;
    tasksList.innerHTML = '';
    if ((proj.tasks || []).length === 0) {
        const p = document.createElement('div');
        p.className = 'muted';
        p.textContent = 'Задач пока нет. Нажмите + Задача';
        tasksList.appendChild(p);
        return;
    }

    proj.tasks.forEach(t => {
        const row = document.createElement('div');
        row.className = 'task-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '6px 0';

        const left = document.createElement('div');
        left.style.flex = '1';

        const title = document.createElement('div');
        title.textContent = t.title;
        if (t.done) title.className = 'task-done';

        const meta = document.createElement('div');
        meta.className = 'muted small';
        meta.style.display = 'flex';
        meta.style.flexDirection = 'column';
        meta.style.marginTop = '2px';
        meta.innerHTML = `
    <span>DL: ${t.deadline || '—'}</span>
    <span>Длительность: ${getTaskDuration(t)}</span>
    <span>Ответственный: ${t.responsible || '—'}</span>
  `;

        left.appendChild(title);
        left.appendChild(meta);
        row.appendChild(left);

        const right = document.createElement('div');
        right.style.display = 'flex';
        right.style.gap = '6px';
        right.style.alignItems = 'center';

        const done = document.createElement('button');
        done.innerHTML = t.done ? '✓' : '';
        done.style.width = '28px';
        done.style.height = '28px';
        done.style.borderRadius = '50%';
        done.style.border = '2px solid #9b59b6';
        done.style.background = t.done ? '#9b59b6' : 'transparent';
        done.style.color = '#fff';
        done.style.fontWeight = 'bold';
        done.style.fontSize = '16px';
        done.style.display = 'flex';
        done.style.alignItems = 'center';
        done.style.justifyContent = 'center';
        done.style.cursor = 'pointer';
        done.onclick = async (e) => {
            e.stopPropagation();
            if (t.stages && t.stages.some(st => !st.done) && !t.done) {
                alert("Невозможно выполнить задачу: не все этапы завершены");
                return;
            }

            const newDone = !t.done;

            try {
                const res = await fetch(`${API_BASE}/tasks/${t.id}/done`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newDone)
                });
                if (!res.ok) throw new Error(await res.text());
                t.done = newDone;
                renderTasks(proj);
            } catch (err) {
                alert("Не удалось обновить задачу: " + err.message);
            }
        };
        right.appendChild(done);

        const addStage = document.createElement('button');
        addStage.className = 'ghost';
        addStage.textContent = '+ этап';
        addStage.onclick = (e) => {
            e.stopPropagation();
            openStageEditor(t);
        };
        right.appendChild(addStage);

        const edit = document.createElement('button');
        edit.className = 'ghost';
        edit.textContent = 'edit';
        edit.onclick = (e) => {
            e.stopPropagation();
            openTaskEditor(t);
        };
        right.appendChild(edit);

        const del = document.createElement('button');
        del.className = 'ghost';
        del.textContent = 'del';
        del.onclick = async (e) => {
            e.stopPropagation();
            if (confirm('Удалить задачу?')) {
                try {
                    await deleteTaskAPI(t.id);
                    proj.tasks = proj.tasks.filter(x => x.id !== t.id);
                    renderTasks(proj);
                    renderGantt(proj);
                } catch (err) {
                    alert(err.message);
                }
            }
        };
        right.appendChild(del);

        row.appendChild(right);

        if (t.stages && t.stages.length) {
            const st = document.createElement('div');
            st.style.marginTop = '6px';
            st.style.marginTop = '6px';
            st.style.display = 'flex';
            st.style.flexDirection = 'column';
            st.style.gap = '4px';
            t.stages.forEach(sg => {
                const sdiv = document.createElement('div');
                sdiv.className = 'stage small';
                sdiv.style.display = 'flex';
                sdiv.style.justifyContent = 'space-between';
                sdiv.style.alignItems = 'center';
                sdiv.style.padding = '2px 6px';
                sdiv.style.borderRadius = '6px';
                sdiv.style.cursor = 'pointer';
                sdiv.textContent = `${sg.title} — ${sg.duration || 0}д`;
                sdiv.style.background = sg.done ? '#b6f1c0' : '#f0f0f6';

                const doneBtn = document.createElement('button');
                doneBtn.innerHTML = sg.done ? '✓' : '';
                doneBtn.style.width = '20px';
                doneBtn.style.height = '20px';
                doneBtn.style.borderRadius = '50%';
                doneBtn.style.border = '2px solid #2aa36b';
                doneBtn.style.background = sg.done ? '#2aa36b' : 'transparent';
                doneBtn.style.color = '#fff';
                doneBtn.style.fontWeight = 'bold';
                doneBtn.style.fontSize = '12px';
                doneBtn.style.display = 'flex';
                doneBtn.style.alignItems = 'center';
                doneBtn.style.justifyContent = 'center';
                doneBtn.style.marginLeft = '8px';
                doneBtn.onclick = async (e) => {
                    e.stopPropagation();
                    sg.done = !sg.done;

                    try {
                        await updateTaskAPI(t.id, {
                            title: t.title,
                            start: t.start,
                            deadline: t.deadline,
                            responsible: t.responsible,
                            description: t.desc,
                            duration: t.duration,
                            isDone: t.done,
                            stages: t.stages.map(s => ({
                                id: s.id,
                                title: s.title,
                                durationDays: Number(s.duration),
                                isDone: s.done,
                                updated: new Date().toISOString()
                            })),
                            dependencies: (t.depends || []).map(id => ({
                                dependsOnTaskId: id
                            }))
                        });

                        renderTasks(proj);
                    } catch (err) {
                        alert("Не удалось обновить этап: " + err.message);
                        sg.done = !sg.done;
                    }
                };

                sdiv.appendChild(doneBtn);
                sdiv.onclick = () => openStageEditor(t, sg);

                st.appendChild(sdiv);
            });
            left.appendChild(st);
        }

        if (t.depends && t.depends.length) {
            const dep = document.createElement('div');
            dep.className = 'muted small';
            dep.style.marginTop = '6px';
            dep.textContent = 'depends on: ' + t.depends.map(id => (proj.tasks.find(xx => xx.id === id) || { title: '?' }).title).join(', ');
            left.appendChild(dep);
        }

        tasksList.appendChild(row);
    });
    renderGantt(proj);
}

function renderGantt(project) {
    if (!currentUser) return;
    const svg = document.getElementById("ganttSvg");
    svg.innerHTML = "";

    const tasks = [...project.tasks];
    if (!tasks.length) return;

    const MONTH_NAMES = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

    let minDate = null, maxDate = null;
    tasks.forEach(t => {
        const dl = parseDate(t.deadline);
        if (!minDate || dl < minDate) minDate = dl;
        if (!maxDate || dl > maxDate) maxDate = dl;
        if (t.start) {
            const st = parseDate(t.start);
            if (!minDate || st < minDate) minDate = st;
        }
    });

    minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 1);

    const dayMs = 86400000;
    const totalDays = Math.ceil((maxDate - minDate) / dayMs);
    const pxPerDay = 16, leftMargin = 140, rowHeight = 34;
    svg.style.width = (leftMargin + totalDays * pxPerDay + 100) + "px";
    svg.style.height = (tasks.length * rowHeight + 120) + "px";

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
        <linearGradient id="noStartGrad">
            <stop offset="0%" stop-color="#b393ff" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#6b46c1" stop-opacity="1"/>
        </linearGradient>
    `;
    svg.appendChild(defs);

    let cur = new Date(minDate);
    const yMonth = 25;
    while (cur <= maxDate) {
        const x = leftMargin + ((cur - minDate) / dayMs) * pxPerDay;
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", x); label.setAttribute("y", yMonth); label.setAttribute("font-size", "14");
        label.setAttribute("fill", "#444"); label.textContent = MONTH_NAMES[cur.getMonth()];
        svg.appendChild(label);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x); line.setAttribute("x2", x); line.setAttribute("y1", yMonth + 5); line.setAttribute("y2", 2000);
        line.setAttribute("stroke", "#eee"); svg.appendChild(line);

        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }

    tasks.forEach((t, i) => {
        const dl = parseDate(t.deadline);
        const st = t.start ? parseDate(t.start) : null;
        const y = 60 + i * rowHeight;

        let startX, width;
        if (st) {
            startX = leftMargin + ((st - minDate) / dayMs) * pxPerDay;
            width = Math.max(18, ((dl - st) / dayMs) * pxPerDay);
        } else {
            startX = leftMargin + ((dl - minDate) / dayMs) * pxPerDay - 50;
            width = 50;
        }

        const tLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        tLabel.setAttribute("x", 10); tLabel.setAttribute("y", y + 16); tLabel.setAttribute("font-size", "13");
        tLabel.textContent = t.title; svg.appendChild(tLabel);

        const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bar.setAttribute("x", startX); bar.setAttribute("y", y); bar.setAttribute("width", width); bar.setAttribute("height", 20);
        bar.setAttribute("rx", 5);

        const barColor = t.done ? "#2aa36b" : (st ? "#6b46c1" : "url(#noStartGrad)");
        bar.setAttribute("fill", barColor);

        bar.onclick = () => {
            openTaskInfoModal(project, t.id);
        };

        svg.appendChild(bar);
    });

    tasks.forEach((task, index) => {
        const taskStartX = task.start
            ? leftMargin + ((parseDate(task.start) - minDate) / dayMs) * pxPerDay
            : leftMargin + ((parseDate(task.deadline) - minDate) / dayMs) * pxPerDay - 50;

        const taskY = 60 + index * rowHeight + 10;

        (task.depends || []).forEach(depId => {
            if (depId === task.id) return;

            const dep = tasks.find(x => x.id === depId);
            if (!dep) return;

            const depEndX = leftMargin + ((parseDate(dep.deadline) - minDate) / dayMs) * pxPerDay;
            const depY = 60 + tasks.indexOf(dep) * rowHeight + 10;

            const color = task.start && parseDate(task.start) < parseDate(dep.deadline)
                ? "#d9534f"
                : "#888";

            const dx = taskStartX - depEndX;
            const dy = taskY - depY;
            const curve = Math.min(Math.abs(dx) * 0.4, 40);

            const pathD = `
                M ${depEndX} ${depY}
                C ${depEndX + curve} ${depY},
                  ${taskStartX - curve} ${taskY},
                  ${taskStartX} ${taskY}
            `;

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathD.trim());
            path.setAttribute("stroke", color);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke-width", "2");
            svg.appendChild(path);
        });
    });
}

function renderResponsibles(proj) {
    if (!currentUser) return;
    responsiblesList.innerHTML = '';
    if (!proj.responsibles || proj.responsibles.length === 0) {
        const p = document.createElement('div'); p.className = 'muted small'; p.textContent = 'Нет ответственных';
        responsiblesList.appendChild(p); return;
    }
    proj.responsibles.forEach(r => {
        const el = document.createElement('div'); el.className = 'item small';
        el.textContent = r.name;
        const del = document.createElement('button'); del.className = 'ghost'; del.textContent = 'del';
        del.onclick = async () => {
            try {
                await deleteResponsibleAPI(r.id);
                proj.responsibles = proj.responsibles.filter(x => x.id !== r.id);
                renderResponsibles(proj);
            } catch (err) {
                alert(err.message);
            }
        };
        el.appendChild(del); responsiblesList.appendChild(el);
    });
}

console.log("3.js loaded");

function openStageEditor(task = null, stage = null) {
    if (currentUser == null) return;
    if (!currentSubjectId || !currentProjectId) return;
    const subj = state.subjects.find(x => x.id === currentSubjectId);
    const proj = subj.projects.find(x => x.id === currentProjectId);
    if (!task) {
        const pick = prompt('Введите название задачи');
        if (!pick) return;
        task = proj.tasks.find(t => t.title === pick);
        if (!task) return alert('Задача не найдена');
    }

    const modal = createModal('Stage editor');
    const form = document.createElement('form');
    form.innerHTML = `
    <label>Заголовок этапа<input name="title" required /></label>
    <label>Длительность (дни)<input name="duration" type="number" value="1" min="0" /></label>
    <div style="display:flex;gap:8px">
      <button type="submit">Сохранить</button>
      ${stage ? '<button type="button" id="deleteBtn" class="ghost">Удалить</button>' : ''}
      <button type="button" id="cancelBtn" class="ghost">Отмена</button>
    </div>
  `;
    modal.content.appendChild(form);

    if (stage) {
        form.title.value = stage.title;
        form.duration.value = stage.duration || 1;
    }

    form.onsubmit = (e) => {
        e.preventDefault();
        const s = {
            id: stage ? stage.id : uid('stage'),
            title: form.title.value.trim() || 'Этап',
            duration: Math.max(1, parseInt(form.duration.value) || 1),
            done: stage ? !!stage.done : false
        };

        const tempStages = stage
            ? task.stages.map(x => x.id === stage.id ? s : x)
            : [...(task.stages || []), s];

        const tempTask = { ...task, stages: tempStages };

        updateTaskDurationFromStages(tempTask);
        if (!validateTask(proj, tempTask)) return;

        task.stages = tempStages;
        updateTaskDurationFromStages(task);

        (async () => {
            try {
                await updateTaskAPI(task.id, {
                    title: task.title,
                    start: task.start,
                    deadline: task.deadline,
                    responsible: task.responsible,
                    description: task.desc,
                    duration: task.duration,
                    isDone: task.done,
                    stages: task.stages.map(s => ({
                        id: Number(s.id) || 0,
                        title: s.title,
                        durationDays: Number(s.duration),
                        isDone: Boolean(s.done),
                        updated: new Date().toISOString()
                    })),
                    dependencies: (task.depends || []).map(id => ({
                        dependsOnTaskId: id
                    }))
                });

                proj.tasks = await fetchTasks(proj.id);

                closeModal(modal.root);
                renderTasks(proj);
                renderGantt(proj);

            } catch (err) {
                alert("Ошибка сохранения этапа: " + err.message);
            }
        })();
    };

    if (stage) {
        const delBtn = form.querySelector('#deleteBtn');
        delBtn.onclick = async () => {
            if (confirm(`Удалить этап "${stage.title}"?`)) {
                task.stages = task.stages.filter(x => x.id !== stage.id);
                updateTaskDurationFromStages(task);

                try {
                    await updateTaskAPI(task.id, {
                        title: task.title,
                        start: task.start,
                        deadline: task.deadline,
                        responsible: task.responsible,
                        description: task.desc,
                        duration: task.duration,
                        isDone: task.done,
                        stages: task.stages.map(s => ({
                            id: Number(s.id) || 0,
                            title: s.title,
                            durationDays: Number(s.duration),
                            isDone: Boolean(s.done),
                            updated: new Date().toISOString()
                        })),
                        dependencies: (task.depends || []).map(id => ({ dependsOnTaskId: id }))
                    });

                    proj.tasks = await fetchTasks(proj.id);

                    renderTasks(proj);
                    renderGantt(proj);
                    closeModal(modal.root);

                } catch (err) {
                    alert("Ошибка удаления этапа: " + err.message);
                }
            }
        };
    }

    form.cancelBtn.onclick = () => closeModal(modal.root);
}

function openProjectEditor(proj = null) {
    if (currentUser == null) return;
    if (!currentSubjectId) return;
    const subj = state.subjects.find(s => s.id === currentSubjectId);
    if (!proj) {
        if (!currentProjectId) return;
        proj = subj.projects.find(p => p.id === currentProjectId);
    }

    const modal = createModal('Редактировать проект');
    const form = document.createElement('form');
    form.innerHTML = `
        <label>Название<input name="name" required /></label>
        <label>Дедлайн<input name="deadline" type="date" /></label>
        <div style="display:flex;gap:8px">
            <button type="submit">Сохранить</button>
            <button type="button" class="ghost" id="cancelBtn">Отмена</button>
        </div>
    `;
    modal.content.appendChild(form);

    form.name.value = proj.name;
    form.deadline.value = proj.deadline || '';

    form.onsubmit = async e => {
        e.preventDefault();
        const name = form.name.value.trim();
        const dl = form.deadline.value || null;

        if (!name) return alert('Название проекта не может быть пустым');

        try {
            const updatedProj = await updateProjectAPI(proj.id, { name, deadline: dl });
            Object.assign(proj, updatedProj);

            closeModal(modal.root);
            renderProjects(subj);
            openProject(subj.id, proj.id);
        } catch (err) {
            alert(err.message);
        }
    };

    form.cancelBtn.onclick = () => closeModal(modal.root);
}

function openTaskInfoModal(proj, taskId) {
    if (currentUser == null) return;
    const task = proj.tasks.find(t => t.id === taskId);
    if (!task) return;

    const modal = document.getElementById("taskInfoModal");
    const title = document.getElementById("taskInfoTitle");
    const body = document.getElementById("taskInfoBody");

    title.textContent = task.title;

    let html = `
        <div class="muted small">Дедлайн: ${task.deadline}</div>
        <div class="muted small">Начало: ${task.start || "—"}</div>
        <div class="muted small">Длительность: ${task.duration || "?"} д.</div>
        <div class="muted small">Ответственный: ${task.responsible || "—"}</div>
        <hr style="margin: 10px 0;">
        <strong>Этапы:</strong>
    `;

    if (task.stages && task.stages.length) {
        html += `<ul style="margin-top:6px; padding-left:18px">`;
        task.stages.forEach(st => {
            html += `
                <li>
                    <strong>${st.title}</strong> — ${st.duration} д.
                    ${st.done ? '<span style="color:var(--ok)"> (готово)</span>' : ''}
                </li>`;
        });
        html += `</ul>`;
    } else {
        html += `<div class="muted small">Этапов нет.</div>`;
    }

    body.innerHTML = html;

    modal.classList.remove("hidden");
}

function renderTeam(proj) {
    const container = document.getElementById('responsiblesList');
    container.innerHTML = '';
    if (!proj.team || proj.team.length === 0) {
        container.textContent = 'Нет студентов';
        return;
    }

    proj.team.forEach(st => {
        const div = document.createElement('div');
        div.textContent = st.login;
        container.appendChild(div);
    });
}

async function loadProjectTeam(projectId) {
    const res = await fetch(`${API_BASE}/projects/${projectId}/team`, { credentials: 'include' });
    if (res.ok) {
        const team = await res.json();
        const proj = getProjectById(projectId);
        proj.team = team;
        proj.responsibles = team.map(s => ({ id: s.id, name: s.login }));
    }
}

function openTaskEditor(task = null) {
    if (currentUser == null) return;
    if (!currentSubjectId || !currentProjectId) return;
    const subj = state.subjects.find(x => x.id === currentSubjectId);
    const proj = subj.projects.find(x => x.id === currentProjectId);

    const modal = createModal('Task editor');
    const form = document.createElement('form');
    form.innerHTML = `
    <label>Заголовок<input name="title" required /></label>
    <label>Начало (опционально)<input name="start" type="date" /></label>
    <label>Дедлайн<input name="deadline" type="date" required /></label>
    <label>Ответственный<select name="responsible"><option value="">—</option></select></label>
    <label>Зависит от (CTRL+click множественный выбор)
      <select name="depends" multiple style="height:90px"></select>
    </label>
    <label>Описание<textarea name="desc" rows="3"></textarea></label>
    <div style="display:flex;gap:8px">
      <button type="submit">Сохранить</button>
      <button type="button" id="cancelBtn" class="ghost">Отмена</button>
    </div>
  `;
    modal.content.appendChild(form);

    const respSel = form.querySelector('select[name="responsible"]');
    (proj.responsibles || []).forEach(r => {
        const op = document.createElement('option'); op.value = r.name; op.textContent = r.name; respSel.appendChild(op);
    });

    const dependsSel = form.querySelector('select[name="depends"]');
    (proj.tasks || []).forEach(t => {
        if (task && t.id === task.id) return;
        const op = document.createElement('option'); op.value = t.id; op.textContent = t.title; dependsSel.appendChild(op);
    });

    if (task) {
        form.title.value = task.title;
        form.start.value = task.start || '';
        form.deadline.value = task.deadline || '';
        form.responsible.value = task.responsible || '';
        form.desc.value = task.desc || '';
        (task.depends || []).forEach(d => {
            const opt = Array.from(dependsSel.options).find(o => o.value === d);
            if (opt) opt.selected = true;
        });
    }

    form.onsubmit = async e => {
        e.preventDefault();

        if (task) {
            if (form.start.value) delete task._autoStart;
            else task._autoStart = true;
        }

        const obj = {
            title: form.title.value.trim() || 'Без названия',
            start: form.start.value || null,
            deadline: form.deadline.value || null,
            responsible: form.responsible.value || null,
            desc: form.desc.value || '',
            depends: Array.from(form.depends.selectedOptions).map(o => o.value),
            stages: task ? (task.stages || []) : [],
            done: task ? !!task.done : false
        };

        if (!validateTask(proj, obj)) return;

        try {
            if (task) {
                await updateTaskAPI(task.id, {
                    title: obj.title,
                    start: obj.start,
                    deadline: obj.deadline,
                    responsible: obj.responsible,
                    description: obj.desc,
                    duration: obj.duration,
                    stages: obj.stages,
                    isDone: obj.done,
                    dependencies: obj.depends.map(id => ({ dependsOnTaskId: id }))
                });
            } else {
                await addTaskAPI(currentProjectId, obj);
            }

            proj.tasks = await fetchTasks(proj.id);

            closeModal(modal.root);
            renderTasks(proj);
            renderGantt(proj);

        } catch (err) {
            alert("Ошибка сохранения задачи: " + err.message);
        }
    };

    form.cancelBtn.onclick = () => closeModal(modal.root);
}

async function openProject(subjId, projId) {
    if (currentUser == null) return;
    currentProjectId = projId;
    const subj = state.subjects.find(x => x.id === subjId);
    const proj = subj.projects.find(x => x.id === projId);

    projectDetail.style.display = 'block';
    projectTitle.textContent = proj.name;
    projectDeadlineLabel.textContent = proj.deadline ? 'DL: ' + proj.deadline : '';
    renderProjects(subj);
    loadTasks(proj); 

    if (!proj.team || proj.team.length === 0) {
        await loadProjectTeam(proj.id);

        try {
            const res = await fetch(`${API_BASE}/projects/${proj.id}/team`, { credentials: 'include' });
            if (res.ok) {
                const team = await res.json(); // [{id, login}]
                proj.team = team;
                proj.responsibles = team.map(s => ({ id: s.id, name: s.login }));
            }
        } catch (err) {
            console.error('Ошибка подгрузки команды проекта', err);
        }
    }

    renderResponsibles(proj);
    renderGantt(proj);
    renderTeam(proj);
    deleteProjectBtn.style.display = 'inline-block';
}

function createModal(title = '') {
    const root = document.getElementById('modalRoot');
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed'; overlay.style.left = 0; overlay.style.top = 0; overlay.style.right = 0; overlay.style.bottom = 0;
    overlay.style.background = 'rgba(12,12,30,0.28)'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
    overlay.style.zIndex = 9999;
    const card = document.createElement('div'); card.className = 'card'; card.style.width = '520px'; card.style.maxWidth = '94%';
    const h = document.createElement('div'); h.style.display = 'flex'; h.style.justifyContent = 'space-between'; h.style.alignItems = 'center';
    const t = document.createElement('strong'); t.textContent = title;
    const closeBtn = document.createElement('button'); closeBtn.className = 'ghost'; closeBtn.textContent = '✕';
    closeBtn.onclick = () => closeModal(overlay);
    h.appendChild(t); h.appendChild(closeBtn);
    card.appendChild(h);
    const content = document.createElement('div'); content.style.marginTop = '8px';
    card.appendChild(content);
    overlay.appendChild(card);
    root.appendChild(overlay);
    return { root: overlay, content };
}

document.addEventListener('DOMContentLoaded', () => {
    const addResponsibleForm = document.getElementById('addResponsibleForm');
    const responsibleInput = document.getElementById('responsibleInput');

    addResponsibleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = responsibleInput.value.trim();
        if (!studentId) return alert("Введите ID студента");

        const proj = getCurrentProject();
        if (!proj) return alert("Сначала выберите проект");

        try {
            const addedStudent = await addResponsibleAPI(proj.id, studentId);

            // обновляем фронтенд
            proj.responsibles = proj.responsibles || [];
            proj.team = proj.team || [];

            if (!proj.responsibles.some(s => s.id === addedStudent.id)) {
                proj.responsibles.push({ id: addedStudent.id, name: addedStudent.login });
            }
            if (!proj.team.some(s => s.id === addedStudent.id)) {
                proj.team.push({ id: addedStudent.id, login: addedStudent.login });
            }

            responsibleInput.value = '';
            renderResponsibles(proj);
            renderTeam(proj); // чтобы сразу обновить отображение команды
            alert(`Студент ${addedStudent.login} добавлен в проект`);
        } catch (err) {
            console.error(err);
            alert("Ошибка добавления студента: " + err.message);
        }
    });
});

document.getElementById("closeTaskInfoBtn").onclick = () => {
    document.getElementById("taskInfoModal").classList.add("hidden");
};

document.getElementById("taskInfoModal").onclick = (e) => {
    if (e.target.id === "taskInfoModal") {
        e.target.classList.add("hidden");
    }
};

console.log("4.js loaded");

const uid = (s = 'id') => (s + '-' + Math.random().toString(36).slice(2, 9));

let state = { subjects: [] };

const subjectsList = document.getElementById('subjectsList');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const currentSubjectTitle = document.getElementById('currentSubjectTitle');
const backToSubjects = document.getElementById('backToSubjects');
const projectsArea = document.getElementById('projectsArea');
const projectsTabs = document.getElementById('projectsTabs');
const addProjectBtn = document.getElementById('addProjectBtn');
const projectDetail = document.getElementById('projectDetail');
const projectTitle = document.getElementById('projectTitle');
const projectDeadlineLabel = document.getElementById('projectDeadlineLabel');
const tasksList = document.getElementById('tasksList');
const addTaskBtn = document.getElementById('addTaskBtn');
const addStageBtn = document.getElementById('addStageBtn');
const responsiblesList = document.getElementById('responsiblesList');
const clearResponsibles = document.getElementById('clearResponsibles');
const modalRoot = document.getElementById('modalRoot');
const deleteProjectBtn = document.getElementById('deleteProjectBtn');
const addResponsibleForm = document.getElementById('addResponsibleForm');
const responsibleInput = document.getElementById('responsibleInput');

function getCurrentProject() {
    if (!currentSubjectId || !currentProjectId) return null;
    const subj = state.subjects.find(s => s.id === currentSubjectId);
    if (!subj) return null;
    return subj.projects.find(p => p.id === currentProjectId) || null;
}

let currentSubjectId = null;
let currentProjectId = null;

const parseDate = s => s ? new Date(s) : null;
const validMonth = d => d && (d.getMonth() >= 0 && d.getMonth() <= 11);

function validateTask(proj, task) {
  if (currentUser == null) return;
  if (!task.duration && task.start && task.deadline) {
    const start = parseDate(task.start);
    const end = parseDate(task.deadline);
    if (start && end) {
      task.duration = Math.max(1, Math.ceil((end - start)/86400000)+1); 
    }
  }

  const taskDate = parseDate(task.deadline);
  if (!taskDate || !validMonth(taskDate)) {
    alert("Некорректный формат даты дедлайна! Используйте YYYY-MM-DD.");
    return false;
  }

  const taskStart = task.start ? parseDate(task.start) : null;
  if (taskStart && taskDate && taskStart > taskDate) {
      alert(`Ошибка: дата начала задачи "${task.title}" (${task.start}) позже её дедлайна (${task.deadline})!`);
      return false;
  }

  if ((!task.start) && (task.depends || []).length) {
    let latestDep = null;
    for (const depId of task.depends) {
      const dep = proj.tasks.find(t => t.id === depId);
      if (!dep) continue;
      const depDl = parseDate(dep.deadline);
      if (!depDl) continue;
      if (!latestDep || depDl > latestDep) latestDep = depDl;
    }
    if (latestDep) {
      const autoStart = new Date(latestDep);
      autoStart.setDate(autoStart.getDate() + 1);
      task.start = autoStart.toISOString().slice(0, 10);
    }
  }

  if (proj.deadline) {
    const projDeadline = parseDate(proj.deadline);
    if (projDeadline && taskDate > projDeadline) {
      alert(`Ошибка: дедлайн задачи "${task.title}" (${task.deadline}) выходит за пределы дедлайна проекта (${proj.deadline}).`);
      return false;
    }
  }

  for (const depId of task.depends || []) {
    const dep = proj.tasks.find(t => t.id === depId);
    if (!dep) continue;
    
    const depDeadline = parseDate(dep.deadline);
    if (!depDeadline) continue;
    const earliestStart = new Date(depDeadline);
    earliestStart.setDate(earliestStart.getDate() + 1); 

    const taskStart = new Date(taskDate);
    taskStart.setDate(taskStart.getDate() - Number(task.duration || 0) + 1);

    if (taskStart < earliestStart) {
        alert(`Ошибка: задача "${task.title}" зависит от "${dep.title}" и не может завершиться раньше окончания её срока (${dep.deadline}) с учётом своей длительности (${task.duration}д).`);
        return false;
    }
    }

  for (const st of (task.stages || [])) {
  if (task.start && !task._autoStart) {
    if (+st.duration > +task.duration) {
      alert(`Ошибка: длительность этапа "${st.title}" (${st.duration}д) превышает длительность задачи "${task.title}" (${task.duration}д).`);
      return false;
    }
  }
}

  return true;
}

function updateTaskDurationFromStages(task) {
  if (currentUser == null) return;
    if (!task.stages || task.stages.length === 0) {
        if (task._autoStart) {
            task.start = null;
            task.duration = null;
        }
        return;
    }

    const maxStage = task.stages.reduce((a, b) => {
        const durA = Number(a.duration ?? 0);
        const durB = Number(b.duration ?? 0);
        return durA >= durB ? a : b;
    });

    const maxDuration = Number(maxStage.duration ?? 1);

    if (task._autoStart) {
        task.duration = maxDuration || 1;

        const dl = parseDate(task.deadline);
        if (dl) {
            const start = new Date(dl);
            start.setDate(start.getDate() - task.duration + 1);
            task.start = start.toISOString().slice(0, 10);
        }
    } else {
        if (task.start && task.deadline) {
            const s = parseDate(task.start);
            const e = parseDate(task.deadline);
            if (s && e) task.duration = Math.max(1, Math.ceil((e - s) / 86400000) + 1);
        }
    }
}

addSubjectBtn.onclick = async () => {
  if (currentUser == null) return;
    const name = prompt('Название предмета:');
    if (!name) return;

    try {
        const newSubj = await addSubjectAPI(name.trim());
        state.subjects.push(newSubj);
        renderSubjects();
    } catch (err) {
        alert(err.message);
    }
};

backToSubjects.onclick = ()=> {
  if (currentUser == null) return;
  currentSubjectId = null;
  currentProjectId = null;
  currentSubjectTitle.innerHTML = '<strong>Выберите предмет</strong>';
  backToSubjects.style.display='none';
  projectsArea.style.display='none';
  projectDetail.style.display='none';
  deleteProjectBtn.style.display = 'none';
};

deleteProjectBtn.onclick = async () => {
  if (currentUser == null) return;
    if (!currentSubjectId || !currentProjectId) return;
    const subj = state.subjects.find(s => s.id === currentSubjectId);
    const proj = subj.projects.find(p => p.id === currentProjectId);
    if (!proj) return;

    if (confirm(`Удалить проект "${proj.name}"?`)) {
        try {
            await deleteProjectAPI(currentProjectId);
        } catch (err) {
            return alert(err.message);
        }

        subj.projects = subj.projects.filter(p => p.id !== currentProjectId);
        currentProjectId = null;
        projectDetail.style.display = 'none';
        renderProjects(subj);
        renderSubjects();
        deleteProjectBtn.style.display = 'none';
    }
};

addProjectBtn.onclick = ()=>createProject();

addTaskBtn.onclick = ()=>openTaskEditor();
addStageBtn.onclick = () => openStageEditor();

function openSubject(id) {
  if (currentUser == null) return;
    if (currentProjectId) {
        currentProjectId = null;
        projectDetail.style.display = 'none';
        deleteProjectBtn.style.display = 'none';
    }

    currentSubjectId = id;
    const subj = state.subjects.find(x => x.id === id);
    currentSubjectTitle.innerHTML = '<strong>' + escapeHtml(subj.name) + '</strong>';
    backToSubjects.style.display = 'inline-block';
    projectsArea.style.display = 'block';
    projectDetail.style.display = 'none';
    renderProjects(subj);
}

function getTaskDuration(t) {
  if (currentUser == null) return;
    const start = parseDate(t.start);
    const end = parseDate(t.deadline);

    if (!start || !end) {
        return t.duration ? t.duration + 'д' : '?';
    }

    return Math.max(0, Math.ceil((end - start) / 86400000) + 1) + 'д';
}

function closeModal(node){ if(node && node.parentNode) node.parentNode.removeChild(node); }

function escapeHtml(s){ return (''+s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]); }