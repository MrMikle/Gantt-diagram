function renderSubjects() {
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