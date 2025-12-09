// console.log("3.js loaded");

// function openStageEditor(task = null, stage = null) {
//     if (currentUser == null) return;
//     if (!currentSubjectId || !currentProjectId) return;
//     const subj = state.subjects.find(x => x.id === currentSubjectId);
//     const proj = subj.projects.find(x => x.id === currentProjectId);
//     if (!task) {
//         const pick = prompt('Введите название задачи');
//         if (!pick) return;
//         task = proj.tasks.find(t => t.title === pick);
//         if (!task) return alert('Задача не найдена');
//     }

//     const modal = createModal('Stage editor');
//     const form = document.createElement('form');
//     form.innerHTML = `
//     <label>Заголовок этапа<input name="title" required /></label>
//     <label>Длительность (дни)<input name="duration" type="number" value="1" min="0" /></label>
//     <div style="display:flex;gap:8px">
//       <button type="submit">Сохранить</button>
//       ${stage ? '<button type="button" id="deleteBtn" class="ghost">Удалить</button>' : ''}
//       <button type="button" id="cancelBtn" class="ghost">Отмена</button>
//     </div>
//   `;
//     modal.content.appendChild(form);

//     if (stage) {
//         form.title.value = stage.title;
//         form.duration.value = stage.duration || 1;
//     }

//     form.onsubmit = (e) => {
//         e.preventDefault();
//         const s = {
//             id: stage ? stage.id : uid('stage'),
//             title: form.title.value.trim() || 'Этап',
//             duration: Math.max(1, parseInt(form.duration.value) || 1),
//             done: stage ? !!stage.done : false
//         };

//         const tempStages = stage
//             ? task.stages.map(x => x.id === stage.id ? s : x)
//             : [...(task.stages || []), s];

//         const tempTask = { ...task, stages: tempStages };

//         updateTaskDurationFromStages(tempTask);
//         if (!validateTask(proj, tempTask)) return;

//         task.stages = tempStages;
//         updateTaskDurationFromStages(task);

//         (async () => {
//             try {
//                 await updateTaskAPI(task.id, {
//                     title: task.title,
//                     start: task.start,
//                     deadline: task.deadline,
//                     responsible: task.responsible,
//                     description: task.desc,
//                     duration: task.duration,
//                     isDone: task.done,
//                     stages: task.stages.map(s => ({
//                         id: Number(s.id) || 0,
//                         title: s.title,
//                         durationDays: Number(s.duration),
//                         isDone: Boolean(s.done),
//                         updated: new Date().toISOString()
//                     })),
//                     dependencies: (task.depends || []).map(id => ({
//                         dependsOnTaskId: id
//                     }))
//                 });

//                 proj.tasks = await fetchTasks(proj.id);

//                 closeModal(modal.root);
//                 renderTasks(proj);
//                 renderGantt(proj);

//             } catch (err) {
//                 alert("Ошибка сохранения этапа: " + err.message);
//             }
//         })();
//     };

//     if (stage) {
//         const delBtn = form.querySelector('#deleteBtn');
//         delBtn.onclick = async () => {
//             if (confirm(`Удалить этап "${stage.title}"?`)) {
//                 task.stages = task.stages.filter(x => x.id !== stage.id);
//                 updateTaskDurationFromStages(task);

//                 try {
//                     await updateTaskAPI(task.id, {
//                         title: task.title,
//                         start: task.start,
//                         deadline: task.deadline,
//                         responsible: task.responsible,
//                         description: task.desc,
//                         duration: task.duration,
//                         isDone: task.done,
//                         stages: task.stages.map(s => ({
//                             id: Number(s.id) || 0,
//                             title: s.title,
//                             durationDays: Number(s.duration),
//                             isDone: Boolean(s.done),
//                             updated: new Date().toISOString()
//                         })),
//                         dependencies: (task.depends || []).map(id => ({ dependsOnTaskId: id }))
//                     });

//                     proj.tasks = await fetchTasks(proj.id);

//                     renderTasks(proj);
//                     renderGantt(proj);
//                     closeModal(modal.root);

//                 } catch (err) {
//                     alert("Ошибка удаления этапа: " + err.message);
//                 }
//             }
//         };
//     }

//     form.cancelBtn.onclick = () => closeModal(modal.root);
// }

// function openProjectEditor(proj = null) {
//     if (currentUser == null) return;
//     if (!currentSubjectId) return;
//     const subj = state.subjects.find(s => s.id === currentSubjectId);
//     if (!proj) {
//         if (!currentProjectId) return;
//         proj = subj.projects.find(p => p.id === currentProjectId);
//     }

//     const modal = createModal('Редактировать проект');
//     const form = document.createElement('form');
//     form.innerHTML = `
//         <label>Название<input name="name" required /></label>
//         <label>Дедлайн<input name="deadline" type="date" /></label>
//         <div style="display:flex;gap:8px">
//             <button type="submit">Сохранить</button>
//             <button type="button" class="ghost" id="cancelBtn">Отмена</button>
//         </div>
//     `;
//     modal.content.appendChild(form);

//     form.name.value = proj.name;
//     form.deadline.value = proj.deadline || '';

//     form.onsubmit = async e => {
//         e.preventDefault();
//         const name = form.name.value.trim();
//         const dl = form.deadline.value || null;

//         if (!name) return alert('Название проекта не может быть пустым');

//         try {
//             const updatedProj = await updateProjectAPI(proj.id, { name, deadline: dl });
//             Object.assign(proj, updatedProj);

//             closeModal(modal.root);
//             renderProjects(subj);
//             openProject(subj.id, proj.id);
//         } catch (err) {
//             alert(err.message);
//         }
//     };

//     form.cancelBtn.onclick = () => closeModal(modal.root);
// }

// function openTaskInfoModal(proj, taskId) {
//     if (currentUser == null) return;
//     const task = proj.tasks.find(t => t.id === taskId);
//     if (!task) return;

//     const modal = document.getElementById("taskInfoModal");
//     const title = document.getElementById("taskInfoTitle");
//     const body = document.getElementById("taskInfoBody");

//     title.textContent = task.title;

//     let html = `
//         <div class="muted small">Дедлайн: ${task.deadline}</div>
//         <div class="muted small">Начало: ${task.start || "—"}</div>
//         <div class="muted small">Длительность: ${task.duration || "?"} д.</div>
//         <div class="muted small">Ответственный: ${task.responsible || "—"}</div>
//         <hr style="margin: 10px 0;">
//         <strong>Этапы:</strong>
//     `;

//     if (task.stages && task.stages.length) {
//         html += `<ul style="margin-top:6px; padding-left:18px">`;
//         task.stages.forEach(st => {
//             html += `
//                 <li>
//                     <strong>${st.title}</strong> — ${st.duration} д.
//                     ${st.done ? '<span style="color:var(--ok)"> (готово)</span>' : ''}
//                 </li>`;
//         });
//         html += `</ul>`;
//     } else {
//         html += `<div class="muted small">Этапов нет.</div>`;
//     }

//     body.innerHTML = html;

//     modal.classList.remove("hidden");
// }

// function openTaskEditor(task = null) {
//     if (currentUser == null) return;
//     if (!currentSubjectId || !currentProjectId) return;
//     const subj = state.subjects.find(x => x.id === currentSubjectId);
//     const proj = subj.projects.find(x => x.id === currentProjectId);

//     const modal = createModal('Task editor');
//     const form = document.createElement('form');
//     form.innerHTML = `
//     <label>Заголовок<input name="title" required /></label>
//     <label>Начало (опционально)<input name="start" type="date" /></label>
//     <label>Дедлайн<input name="deadline" type="date" required /></label>
//     <label>Ответственный<select name="responsible"><option value="">—</option></select></label>
//     <label>Зависит от (CTRL+click множественный выбор)
//       <select name="depends" multiple style="height:90px"></select>
//     </label>
//     <label>Описание<textarea name="desc" rows="3"></textarea></label>
//     <div style="display:flex;gap:8px">
//       <button type="submit">Сохранить</button>
//       <button type="button" id="cancelBtn" class="ghost">Отмена</button>
//     </div>
//   `;
//     modal.content.appendChild(form);

//     const respSel = form.querySelector('select[name="responsible"]');
//     (proj.responsibles || []).forEach(r => {
//         const op = document.createElement('option'); op.value = r.name; op.textContent = r.name; respSel.appendChild(op);
//     });

//     const dependsSel = form.querySelector('select[name="depends"]');
//     (proj.tasks || []).forEach(t => {
//         if (task && t.id === task.id) return;
//         const op = document.createElement('option'); op.value = t.id; op.textContent = t.title; dependsSel.appendChild(op);
//     });

//     if (task) {
//         form.title.value = task.title;
//         form.start.value = task.start || '';
//         form.deadline.value = task.deadline || '';
//         form.responsible.value = task.responsible || '';
//         form.desc.value = task.desc || '';
//         (task.depends || []).forEach(d => {
//             const opt = Array.from(dependsSel.options).find(o => o.value === d);
//             if (opt) opt.selected = true;
//         });
//     }

//     form.onsubmit = async e => {
//         e.preventDefault();

//         if (task) {
//             if (form.start.value) delete task._autoStart;
//             else task._autoStart = true;
//         }

//         const obj = {
//             title: form.title.value.trim() || 'Без названия',
//             start: form.start.value || null,
//             deadline: form.deadline.value || null,
//             responsible: form.responsible.value || null,
//             desc: form.desc.value || '',
//             depends: Array.from(form.depends.selectedOptions).map(o => o.value),
//             stages: task ? (task.stages || []) : [],
//             done: task ? !!task.done : false
//         };

//         if (!validateTask(proj, obj)) return;

//         try {
//             if (task) {
//                 await updateTaskAPI(task.id, {
//                     title: obj.title,
//                     start: obj.start,
//                     deadline: obj.deadline,
//                     responsible: obj.responsible,
//                     description: obj.desc,
//                     duration: obj.duration,
//                     stages: obj.stages,
//                     isDone: obj.done,
//                     dependencies: obj.depends.map(id => ({ dependsOnTaskId: id }))
//                 });
//             } else {
//                 await addTaskAPI(currentProjectId, obj);
//             }

//             proj.tasks = await fetchTasks(proj.id);

//             closeModal(modal.root);
//             renderTasks(proj);
//             renderGantt(proj);

//         } catch (err) {
//             alert("Ошибка сохранения задачи: " + err.message);
//         }
//     };

//     form.cancelBtn.onclick = () => closeModal(modal.root);
// }

// function openProject(subjId, projId) {
//     if (currentUser == null) return;
//     currentProjectId = projId;
//     const subj = state.subjects.find(x => x.id === subjId);
//     const proj = subj.projects.find(x => x.id === projId);

//     projectDetail.style.display = 'block';
//     projectTitle.textContent = proj.name;
//     projectDeadlineLabel.textContent = proj.deadline ? 'DL: ' + proj.deadline : '';
//     renderProjects(subj);
//     loadTasks(proj);
//     renderResponsibles(proj);
//     renderGantt(proj);
//     deleteProjectBtn.style.display = 'inline-block';
// }

// function createModal(title = '') {
//     const root = document.getElementById('modalRoot');
//     const overlay = document.createElement('div');
//     overlay.style.position = 'fixed'; overlay.style.left = 0; overlay.style.top = 0; overlay.style.right = 0; overlay.style.bottom = 0;
//     overlay.style.background = 'rgba(12,12,30,0.28)'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
//     overlay.style.zIndex = 9999;
//     const card = document.createElement('div'); card.className = 'card'; card.style.width = '520px'; card.style.maxWidth = '94%';
//     const h = document.createElement('div'); h.style.display = 'flex'; h.style.justifyContent = 'space-between'; h.style.alignItems = 'center';
//     const t = document.createElement('strong'); t.textContent = title;
//     const closeBtn = document.createElement('button'); closeBtn.className = 'ghost'; closeBtn.textContent = '✕';
//     closeBtn.onclick = () => closeModal(overlay);
//     h.appendChild(t); h.appendChild(closeBtn);
//     card.appendChild(h);
//     const content = document.createElement('div'); content.style.marginTop = '8px';
//     card.appendChild(content);
//     overlay.appendChild(card);
//     root.appendChild(overlay);
//     return { root: overlay, content };
// }

// document.addEventListener('DOMContentLoaded', () => {
//     const addResponsibleForm = document.getElementById('addResponsibleForm');
//     const responsibleInput = document.getElementById('responsibleInput');

//     addResponsibleForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         e.stopPropagation();
//         console.log("Форма отправляется");
//         if (!currentSubjectId || !currentProjectId) return;

//         const v = responsibleInput.value.trim();
//         if (!v) return;

//         const subj = state.subjects.find(x => x.id === currentSubjectId);
//         const proj = subj.projects.find(x => x.id === currentProjectId);

//         try {
//             const added = await addResponsibleAPI(currentProjectId, v);
//             console.log("Ответ от сервера:", added);
//             proj.responsibles = proj.responsibles || [];
//             proj.responsibles.push(added);
//             responsibleInput.value = '';
//             renderResponsibles(proj);
//         } catch (err) {
//             alert("Не удалось добавить ответственного: " + err.message);
//         }
//     });
// });

// document.getElementById("closeTaskInfoBtn").onclick = () => {
//     document.getElementById("taskInfoModal").classList.add("hidden");
// };

// document.getElementById("taskInfoModal").onclick = (e) => {
//     if (e.target.id === "taskInfoModal") {
//         e.target.classList.add("hidden");
//     }
// };