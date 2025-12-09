// console.log("4.js loaded");

// const uid = (s = 'id') => (s + '-' + Math.random().toString(36).slice(2, 9));

// let state = { subjects: [] };

// const subjectsList = document.getElementById('subjectsList');
// const addSubjectBtn = document.getElementById('addSubjectBtn');
// const currentSubjectTitle = document.getElementById('currentSubjectTitle');
// const backToSubjects = document.getElementById('backToSubjects');
// const projectsArea = document.getElementById('projectsArea');
// const projectsTabs = document.getElementById('projectsTabs');
// const addProjectBtn = document.getElementById('addProjectBtn');
// const projectDetail = document.getElementById('projectDetail');
// const projectTitle = document.getElementById('projectTitle');
// const projectDeadlineLabel = document.getElementById('projectDeadlineLabel');
// const tasksList = document.getElementById('tasksList');
// const addTaskBtn = document.getElementById('addTaskBtn');
// const addStageBtn = document.getElementById('addStageBtn');
// const responsiblesList = document.getElementById('responsiblesList');
// const clearResponsibles = document.getElementById('clearResponsibles');
// const modalRoot = document.getElementById('modalRoot');
// const deleteProjectBtn = document.getElementById('deleteProjectBtn');

// let currentSubjectId = null;
// let currentProjectId = null;

// const parseDate = s => s ? new Date(s) : null;
// const validMonth = d => d && (d.getMonth() >= 0 && d.getMonth() <= 11);

// function validateTask(proj, task) {
//   if (currentUser == null) return;
//   if (!task.duration && task.start && task.deadline) {
//     const start = parseDate(task.start);
//     const end = parseDate(task.deadline);
//     if (start && end) {
//       task.duration = Math.max(1, Math.ceil((end - start)/86400000)+1); 
//     }
//   }

//   const taskDate = parseDate(task.deadline);
//   if (!taskDate || !validMonth(taskDate)) {
//     alert("Некорректный формат даты дедлайна! Используйте YYYY-MM-DD.");
//     return false;
//   }

//   const taskStart = task.start ? parseDate(task.start) : null;
//   if (taskStart && taskDate && taskStart > taskDate) {
//       alert(`Ошибка: дата начала задачи "${task.title}" (${task.start}) позже её дедлайна (${task.deadline})!`);
//       return false;
//   }

//   if ((!task.start) && (task.depends || []).length) {
//     let latestDep = null;
//     for (const depId of task.depends) {
//       const dep = proj.tasks.find(t => t.id === depId);
//       if (!dep) continue;
//       const depDl = parseDate(dep.deadline);
//       if (!depDl) continue;
//       if (!latestDep || depDl > latestDep) latestDep = depDl;
//     }
//     if (latestDep) {
//       const autoStart = new Date(latestDep);
//       autoStart.setDate(autoStart.getDate() + 1);
//       task.start = autoStart.toISOString().slice(0, 10);
//     }
//   }

//   if (proj.deadline) {
//     const projDeadline = parseDate(proj.deadline);
//     if (projDeadline && taskDate > projDeadline) {
//       alert(`Ошибка: дедлайн задачи "${task.title}" (${task.deadline}) выходит за пределы дедлайна проекта (${proj.deadline}).`);
//       return false;
//     }
//   }

//   for (const depId of task.depends || []) {
//     const dep = proj.tasks.find(t => t.id === depId);
//     if (!dep) continue;
    
//     const depDeadline = parseDate(dep.deadline);
//     if (!depDeadline) continue;
//     const earliestStart = new Date(depDeadline);
//     earliestStart.setDate(earliestStart.getDate() + 1); 

//     const taskStart = new Date(taskDate);
//     taskStart.setDate(taskStart.getDate() - Number(task.duration || 0) + 1);

//     if (taskStart < earliestStart) {
//         alert(`Ошибка: задача "${task.title}" зависит от "${dep.title}" и не может завершиться раньше окончания её срока (${dep.deadline}) с учётом своей длительности (${task.duration}д).`);
//         return false;
//     }
//     }

//   for (const st of (task.stages || [])) {
//   if (task.start && !task._autoStart) {
//     if (+st.duration > +task.duration) {
//       alert(`Ошибка: длительность этапа "${st.title}" (${st.duration}д) превышает длительность задачи "${task.title}" (${task.duration}д).`);
//       return false;
//     }
//   }
// }

//   return true;
// }

// function updateTaskDurationFromStages(task) {
//   if (currentUser == null) return;
//     if (!task.stages || task.stages.length === 0) {
//         if (task._autoStart) {
//             task.start = null;
//             task.duration = null;
//         }
//         return;
//     }

//     const maxStage = task.stages.reduce((a, b) => {
//         const durA = Number(a.duration ?? 0);
//         const durB = Number(b.duration ?? 0);
//         return durA >= durB ? a : b;
//     });

//     const maxDuration = Number(maxStage.duration ?? 1);

//     if (task._autoStart) {
//         task.duration = maxDuration || 1;

//         const dl = parseDate(task.deadline);
//         if (dl) {
//             const start = new Date(dl);
//             start.setDate(start.getDate() - task.duration + 1);
//             task.start = start.toISOString().slice(0, 10);
//         }
//     } else {
//         if (task.start && task.deadline) {
//             const s = parseDate(task.start);
//             const e = parseDate(task.deadline);
//             if (s && e) task.duration = Math.max(1, Math.ceil((e - s) / 86400000) + 1);
//         }
//     }
// }

// addSubjectBtn.onclick = async () => {
//   if (currentUser == null) return;
//     const name = prompt('Название предмета:');
//     if (!name) return;

//     try {
//         const newSubj = await addSubjectAPI(name.trim());
//         state.subjects.push(newSubj);
//         renderSubjects();
//     } catch (err) {
//         alert(err.message);
//     }
// };

// backToSubjects.onclick = ()=> {
//   if (currentUser == null) return;
//   currentSubjectId = null;
//   currentProjectId = null;
//   currentSubjectTitle.innerHTML = '<strong>Выберите предмет</strong>';
//   backToSubjects.style.display='none';
//   projectsArea.style.display='none';
//   projectDetail.style.display='none';
//   deleteProjectBtn.style.display = 'none';
// };

// deleteProjectBtn.onclick = async () => {
//   if (currentUser == null) return;
//     if (!currentSubjectId || !currentProjectId) return;
//     const subj = state.subjects.find(s => s.id === currentSubjectId);
//     const proj = subj.projects.find(p => p.id === currentProjectId);
//     if (!proj) return;

//     if (confirm(`Удалить проект "${proj.name}"?`)) {
//         try {
//             await deleteProjectAPI(currentProjectId);
//         } catch (err) {
//             return alert(err.message);
//         }

//         subj.projects = subj.projects.filter(p => p.id !== currentProjectId);
//         currentProjectId = null;
//         projectDetail.style.display = 'none';
//         renderProjects(subj);
//         renderSubjects();
//         deleteProjectBtn.style.display = 'none';
//     }
// };

// addProjectBtn.onclick = ()=>createProject();

// addTaskBtn.onclick = ()=>openTaskEditor();
// addStageBtn.onclick = () => openStageEditor();

// function openSubject(id) {
//   if (currentUser == null) return;
//     if (currentProjectId) {
//         currentProjectId = null;
//         projectDetail.style.display = 'none';
//         deleteProjectBtn.style.display = 'none';
//     }

//     currentSubjectId = id;
//     const subj = state.subjects.find(x => x.id === id);
//     currentSubjectTitle.innerHTML = '<strong>' + escapeHtml(subj.name) + '</strong>';
//     backToSubjects.style.display = 'inline-block';
//     projectsArea.style.display = 'block';
//     projectDetail.style.display = 'none';
//     renderProjects(subj);
// }

// function getTaskDuration(t) {
//   if (currentUser == null) return;
//     const start = parseDate(t.start);
//     const end = parseDate(t.deadline);

//     if (!start || !end) {
//         return t.duration ? t.duration + 'д' : '?';
//     }

//     return Math.max(0, Math.ceil((end - start) / 86400000) + 1) + 'д';
// }

// function closeModal(node){ if(node && node.parentNode) node.parentNode.removeChild(node); }

// function escapeHtml(s){ return (''+s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]); }