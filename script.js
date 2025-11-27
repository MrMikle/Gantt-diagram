const uid = (s='id')=> (s+'-'+Math.random().toString(36).slice(2,9));

let state = { subjects: [] };

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

    del.onclick = () => {
  if (confirm('Удалить предмет?')) {
    state.subjects = state.subjects.filter(x => x.id !== s.id);
    if (currentSubjectId === s.id) {
      currentSubjectId = null;
      currentProjectId = null;
      projectDetail.style.display = 'none';
      projectsArea.style.display = 'none';
      backToSubjects.style.display = 'none';
      deleteProjectBtn.style.display = 'none';
    }
    renderSubjects();
  }
};

    buttonsDiv.append(open, del);
    el.append(infoDiv, buttonsDiv);
    subjectsList.append(el);
  });
}

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
const addResponsibleForm = document.getElementById('addResponsibleForm');
const responsibleInput = document.getElementById('responsibleInput');
const clearResponsibles = document.getElementById('clearResponsibles');
const modalRoot = document.getElementById('modalRoot');
const deleteProjectBtn = document.getElementById('deleteProjectBtn');

let currentSubjectId = null;
let currentProjectId = null;

const parseDate = s => s ? new Date(s + "T12:00:00") : null;
const validMonth = d => d && (d.getMonth() >= 0 && d.getMonth() <= 11);

function validateTask(proj, task) {
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
  if (!task.stages || task.stages.length === 0) {
    if (task._autoStart) {
      task.start = null;
      task.duration = null;
    }
    return;
  }

  const maxStage = task.stages.reduce((a,b) => a.duration >= b.duration ? a : b);
  if (task._autoStart) {
    task.duration = maxStage.duration;

    const dl = parseDate(task.deadline);
    if (dl) {
      const start = new Date(dl);
      start.setDate(start.getDate() - task.duration + 1);
      task.start = start.toISOString().slice(0,10);
    }
  }
}




renderSubjects();

addSubjectBtn.onclick = () => {
  const name = prompt('Название предмета:');
  if (!name) return;
  const subj = {
    id: uid('subj'),
    name: name.trim(),
    projects: []
  };
  state.subjects.push(subj);
  renderSubjects();
};

function openSubject(id){
  if (currentProjectId) {
    currentProjectId = null;
    projectDetail.style.display = 'none';
    deleteProjectBtn.style.display = 'none';
  }
  
  currentSubjectId = id;
  const subj = state.subjects.find(x=>x.id===id);
  currentSubjectTitle.innerHTML = '<strong>'+escapeHtml(subj.name)+'</strong>';
  backToSubjects.style.display='inline-block';
  projectsArea.style.display='block';
  projectDetail.style.display='none';
  renderProjects(subj);
}

backToSubjects.onclick = ()=> {
  currentSubjectId = null;
  currentProjectId = null;
  currentSubjectTitle.innerHTML = '<strong>Выберите предмет</strong>';
  backToSubjects.style.display='none';
  projectsArea.style.display='none';
  projectDetail.style.display='none';
  deleteProjectBtn.style.display = 'none';
};

deleteProjectBtn.onclick = () => {
  if (!currentSubjectId || !currentProjectId) return;
  const subj = state.subjects.find(s => s.id === currentSubjectId);
  const proj = subj.projects.find(p => p.id === currentProjectId);
  if (!proj) return;

  if (confirm(`Удалить проект "${proj.name}"?`)) {
    subj.projects = subj.projects.filter(p => p.id !== currentProjectId);
    currentProjectId = null;
    projectDetail.style.display = 'none';
    renderProjects(subj);
    renderSubjects()
    deleteProjectBtn.style.display = 'none';
  }
};

function openProjectEditor(proj=null){
    if(!currentSubjectId) return;
    const subj = state.subjects.find(s=>s.id===currentSubjectId);
    if(!proj){
        if(!currentProjectId) return;
        proj = subj.projects.find(p=>p.id===currentProjectId);
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

    form.onsubmit = e=>{
        e.preventDefault();
        const name = form.name.value.trim();
        const dl = form.deadline.value || null;

        if(!name) return alert('Название проекта не может быть пустым');

        if(dl){
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
            if(!valid){
                return alert("Ошибка: некорректная дата дедлайна! Используйте формат YYYY-MM-DD.");
            }
        }

        if (dl) {
          const newProjDeadline = parseDate(dl);
          const invalidTask = proj.tasks.find(t => {
              const tDeadline = parseDate(t.deadline);
              return tDeadline && tDeadline > newProjDeadline;
          });
          if (invalidTask) {
              return alert(`Невозможно установить дедлайн проекта на ${dl}, задача "${invalidTask.title}" (${invalidTask.deadline}) выходит за пределы дедлайна.`);
          }
        }

        proj.name = name;
        proj.deadline = dl;
        closeModal(modal.root);

        renderProjects(subj);
        openProject(subj.id, proj.id);
    };

    form.cancelBtn.onclick = ()=>closeModal(modal.root);
}

function renderProjects(subj){
  projectsTabs.innerHTML='';
  (subj.projects||[]).forEach(p=>{
    const el = document.createElement('div');
    el.className='tab';
    if(p.id===currentProjectId) el.classList.add('active');
    el.innerHTML = '<strong>'+escapeHtml(p.name)+'</strong><div class="muted small">DL: '+(p.deadline||'—')+'</div>';
    el.onclick = () => {
            if(currentProjectId !== p.id){
                openProject(subj.id, p.id);
            } else {
                openProjectEditor(p);
            }
        };
    projectsTabs.appendChild(el);
  });
}

addProjectBtn.onclick = ()=>createProject();

function createProject() {
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
    id: uid('proj'),
    name: name.trim(),
    deadline: dl || null,
    tasks: [],
    responsibles: []
  };
  const subj = state.subjects.find(x => x.id === currentSubjectId);
  subj.projects.push(proj);
  renderSubjects();
  renderProjects(subj);
  openProject(subj.id, proj.id);
}

function openProject(subjId, projId) {
  currentProjectId = projId;
  const subj = state.subjects.find(x => x.id === subjId);
  const proj = subj.projects.find(x => x.id === projId);

  projectDetail.style.display = 'block';
  projectTitle.textContent = proj.name;
  projectDeadlineLabel.textContent = proj.deadline ? 'DL: ' + proj.deadline : '';
  renderProjects(subj);
  renderTasks(proj);
  renderResponsibles(proj);
  renderGantt(proj);
  deleteProjectBtn.style.display = 'inline-block';
}


addTaskBtn.onclick = ()=>openTaskEditor();
addStageBtn.onclick = ()=>openStageEditor();

function renderTasks(proj){
  tasksList.innerHTML = '';
  if((proj.tasks||[]).length===0){
    const p = document.createElement('div'); 
    p.className='muted'; 
    p.textContent='Задач пока нет. Нажмите + Задача';
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
    if(t.done) title.className='task-done';

    const meta = document.createElement('div'); 
    meta.className='muted small';
    meta.style.display = 'flex';
    meta.style.flexDirection = 'column';
    meta.style.marginTop = '2px';
    meta.innerHTML = `
    <span>DL: ${t.deadline || '—'}</span>
    <span>Длительность: ${t.start ? Math.max(0, Math.ceil((parseDate(t.deadline) - parseDate(t.start)) / 86400000) + 1) + 'д' : '?'}</span>
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
    done.onclick = (e) => {
      e.stopPropagation();
      if (t.done) {
        t.done = false;
      } else {
        if (!t.stages || t.stages.length === 0 || t.stages.every(st => st.done)) {
          t.done = true;
        } else {
          alert("Невозможно выполнить задачу: не все этапы завершены");
        }
      }
      renderTasks(proj);
    };
    right.appendChild(done);

    const edit = document.createElement('button'); 
    edit.className='ghost'; 
    edit.textContent='edit';
    edit.onclick = (e) => { 
        e.stopPropagation(); 
        openTaskEditor(t); 
    };
    right.appendChild(edit);

    const del = document.createElement('button'); 
    del.className='ghost'; 
    del.textContent='del';
    del.onclick = (e) => { 
        e.stopPropagation();
        if(confirm('Удалить задачу?')) { 
            proj.tasks = proj.tasks.filter(x=>x.id!==t.id); 
            renderTasks(proj); 
        } 
    };
    right.appendChild(del);

    row.appendChild(right);

    if(t.stages && t.stages.length){
      const st = document.createElement('div'); 
      st.style.marginTop='6px';
      st.style.marginTop='6px';
      st.style.display = 'flex';
      st.style.flexDirection = 'column';
      st.style.gap = '4px'; 
      t.stages.forEach(sg=>{
          const sdiv = document.createElement('div'); 
          sdiv.className='stage small';
          sdiv.style.display = 'flex';
          sdiv.style.justifyContent = 'space-between';
          sdiv.style.alignItems = 'center';
          sdiv.style.padding = '2px 6px';
          sdiv.style.borderRadius = '6px';
          sdiv.style.cursor = 'pointer';
          sdiv.textContent = `${sg.title} — ${sg.duration||0}д`;
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
          doneBtn.onclick = (e)=>{
              e.stopPropagation();
              sg.done = !sg.done;
              renderTasks(proj);
          };

          sdiv.appendChild(doneBtn);
          sdiv.onclick = ()=>openStageEditor(t, sg);

          st.appendChild(sdiv);
      });
      left.appendChild(st);
    }

    if(t.depends && t.depends.length){
        const dep = document.createElement('div'); 
        dep.className='muted small'; 
        dep.style.marginTop='6px';
        dep.textContent = 'depends on: ' + t.depends.map(id=> (proj.tasks.find(xx=>xx.id===id)||{title:'?' }).title).join(', ');
        left.appendChild(dep);
    }

    tasksList.appendChild(row);
  });
  renderGantt(proj);
}

function openTaskEditor(task=null){
  if(!currentSubjectId || !currentProjectId) return;
  const subj = state.subjects.find(x=>x.id===currentSubjectId);
  const proj = subj.projects.find(x=>x.id===currentProjectId);

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
  (proj.responsibles||[]).forEach(r=>{
    const op = document.createElement('option'); op.value=r; op.textContent=r; respSel.appendChild(op);
  });

  const dependsSel = form.querySelector('select[name="depends"]');
  (proj.tasks||[]).forEach(t=>{
    if(task && t.id===task.id) return; 
    const op = document.createElement('option'); op.value=t.id; op.textContent=t.title; dependsSel.appendChild(op);
  });

  if(task){
    form.title.value = task.title;
    form.start.value = task.start || '';
    form.deadline.value = task.deadline || '';
    form.responsible.value = task.responsible || '';
    form.desc.value = task.desc || '';
    (task.depends||[]).forEach(d=>{
      const opt = Array.from(dependsSel.options).find(o=>o.value===d);
      if(opt) opt.selected=true;
    });
  }

  form.onsubmit = e=>{
    e.preventDefault();

    if(task){
      if(form.start.value){
        delete task._autoStart;  
      } else {
        task._autoStart = true;  
      }
    }


    const obj = {
      title: form.title.value.trim() || 'Без названия',
      start: form.start.value || null,
      deadline: form.deadline.value || null,
      responsible: form.responsible.value || null,
      desc: form.desc.value || '',
      depends: Array.from(form.depends.selectedOptions).map(o=>o.value),
      stages: task ? (task.stages||[]) : [],
      done: task ? !!task.done : false,
      id: task ? task.id : uid('task'),
      _autoStart: task ? task._autoStart : !form.start.value
    };

    if(!validateTask(proj, obj)) return;

    if(task){
      const idx = proj.tasks.findIndex(x=>x.id===task.id);
      proj.tasks[idx] = obj;
    } else {
      proj.tasks.push(obj);
    }

    updateTaskDurationFromStages(obj);

    closeModal(modal.root);
    renderTasks(proj);
  };

  form.cancelBtn.onclick = ()=>closeModal(modal.root);
}



function openStageEditor(task=null, stage=null){
  if(!currentSubjectId || !currentProjectId) return;
  const subj = state.subjects.find(x=>x.id===currentSubjectId);
  const proj = subj.projects.find(x=>x.id===currentProjectId);
  if(!task){
    const pick = prompt('Введите название задачи');
    if(!pick) return;
    task = proj.tasks.find(t=>t.title===pick);
    if(!task) return alert('Задача не найдена');
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

  if(stage){
    form.title.value = stage.title;
    form.duration.value = stage.duration || 1;
  }

    form.onsubmit = (e)=>{
    e.preventDefault();
    const s = {
        id: stage ? stage.id : uid('stage'),
        title: form.title.value.trim() || 'Этап',
        duration: Math.max(0, parseInt(form.duration.value||0)),
        done: stage ? !!stage.done : false
    };

    const tempStages = stage 
        ? task.stages.map(x => x.id===stage.id ? s : x)
        : [...(task.stages||[]), s];

    const tempTask = {...task, stages: tempStages};

    updateTaskDurationFromStages(tempTask); 
    if(!validateTask(proj, tempTask)) return;

    task.stages = tempStages;
    updateTaskDurationFromStages(task); 
    closeModal(modal.root);
    renderTasks(proj);
    };

  if(stage){
    const delBtn = form.querySelector('#deleteBtn');
    delBtn.onclick = ()=>{
        if(confirm(`Удалить этап "${stage.title}"?`)){
            task.stages = task.stages.filter(x=>x.id!==stage.id);
            closeModal(modal.root);
            updateTaskDurationFromStages(task); 
            renderTasks(proj);
        }
    };
  }

  form.cancelBtn.onclick = ()=>closeModal(modal.root);
}


addResponsibleForm.onsubmit = (e)=>{
  e.preventDefault(); if(!currentSubjectId || !currentProjectId) return;
  const v = responsibleInput.value.trim(); if(!v) return;
  const subj = state.subjects.find(x=>x.id===currentSubjectId);
  const proj = subj.projects.find(x=>x.id===currentProjectId);
  proj.responsibles = proj.responsibles || [];
  proj.responsibles.push(v);
  responsibleInput.value=''; renderResponsibles(proj);
};
clearResponsibles.onclick = ()=>{
  if(!currentSubjectId || !currentProjectId) return;
  const subj = state.subjects.find(x=>x.id===currentSubjectId);
  const proj = subj.projects.find(x=>x.id===currentProjectId);
  if(confirm('Очистить всех ответственных?')) { proj.responsibles=[]; renderResponsibles(proj); }
};
function renderResponsibles(proj){
  responsiblesList.innerHTML='';
  if(!proj.responsibles || proj.responsibles.length===0){
    const p = document.createElement('div'); p.className='muted small'; p.textContent='Нет ответственных';
    responsiblesList.appendChild(p); return;
  }
  proj.responsibles.forEach(r=>{
    const el = document.createElement('div'); el.className='item small';
    el.textContent = r;
    const del = document.createElement('button'); del.className='ghost'; del.textContent='del';
    del.onclick = ()=>{ proj.responsibles = proj.responsibles.filter(x=>x!==r); renderResponsibles(proj); };
    el.appendChild(del); responsiblesList.appendChild(el);
  });
}

function createModal(title=''){
  const root = document.getElementById('modalRoot');
  const overlay = document.createElement('div');
  overlay.style.position='fixed'; overlay.style.left=0; overlay.style.top=0; overlay.style.right=0; overlay.style.bottom=0;
  overlay.style.background='rgba(12,12,30,0.28)'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center';
  overlay.style.zIndex=9999;
  const card = document.createElement('div'); card.className='card'; card.style.width='520px'; card.style.maxWidth='94%';
  const h = document.createElement('div'); h.style.display='flex'; h.style.justifyContent='space-between'; h.style.alignItems='center';
  const t = document.createElement('strong'); t.textContent = title;
  const closeBtn = document.createElement('button'); closeBtn.className='ghost'; closeBtn.textContent='✕';
  closeBtn.onclick = ()=>closeModal(overlay);
  h.appendChild(t); h.appendChild(closeBtn);
  card.appendChild(h);
  const content = document.createElement('div'); content.style.marginTop='8px';
  card.appendChild(content);
  overlay.appendChild(card);
  root.appendChild(overlay);
  return { root:overlay, content };
}

function renderGantt(project){
    const svg = document.getElementById("ganttSvg");
    svg.innerHTML = "";

    const tasks = [...project.tasks];
    if(!tasks.length) return;

    const MONTH_NAMES = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

    let minDate = null, maxDate = null;
    tasks.forEach(t=>{
        const dl = parseDate(t.deadline);
        if(!minDate || dl<minDate) minDate = dl;
        if(!maxDate || dl>maxDate) maxDate = dl;
        if(t.start){
            const st = parseDate(t.start);
            if(!minDate || st<minDate) minDate = st;
        }
    });

    minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth()+1, 1);

    const dayMs = 86400000;
    const totalDays = Math.ceil((maxDate-minDate)/dayMs);
    const pxPerDay = 16, leftMargin=140, rowHeight=34;
    svg.setAttribute("width", leftMargin + totalDays*pxPerDay + 100);
    svg.setAttribute("height", tasks.length*rowHeight + 120);

    const defs = document.createElementNS("http://www.w3.org/2000/svg","defs");
    defs.innerHTML = `
        <linearGradient id="noStartGrad">
            <stop offset="0%" stop-color="#b393ff" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#6b46c1" stop-opacity="1"/>
        </linearGradient>
    `;
    svg.appendChild(defs);

    let cur = new Date(minDate);
    const yMonth = 25;
    while(cur <= maxDate){
        const x = leftMargin + ((cur-minDate)/dayMs)*pxPerDay;
        const label = document.createElementNS("http://www.w3.org/2000/svg","text");
        label.setAttribute("x", x); label.setAttribute("y", yMonth); label.setAttribute("font-size","14");
        label.setAttribute("fill","#444"); label.textContent = MONTH_NAMES[cur.getMonth()];
        svg.appendChild(label);

        const line = document.createElementNS("http://www.w3.org/2000/svg","line");
        line.setAttribute("x1",x); line.setAttribute("x2",x); line.setAttribute("y1",yMonth+5); line.setAttribute("y2",2000);
        line.setAttribute("stroke","#eee"); svg.appendChild(line);

        cur = new Date(cur.getFullYear(), cur.getMonth()+1, 1);
    }

    // задачи
    tasks.forEach((t,i)=>{
        const dl = parseDate(t.deadline);
        const st = t.start ? parseDate(t.start) : null;
        const y = 60 + i*rowHeight;

        let startX, width;
        if(st){
            startX = leftMargin + ((st-minDate)/dayMs)*pxPerDay;
            width = Math.max(18, ((dl-st)/dayMs)*pxPerDay);
        } else {
            startX = leftMargin + ((dl-minDate)/dayMs)*pxPerDay - 50;
            width = 50;
        }

        const tLabel = document.createElementNS("http://www.w3.org/2000/svg","text");
        tLabel.setAttribute("x",10); tLabel.setAttribute("y",y+16); tLabel.setAttribute("font-size","13");
        tLabel.textContent = t.title; svg.appendChild(tLabel);

        const bar = document.createElementNS("http://www.w3.org/2000/svg","rect");
        bar.setAttribute("x",startX); bar.setAttribute("y",y); bar.setAttribute("width",width); bar.setAttribute("height",20);
        bar.setAttribute("rx",5);

        const barColor = t.done ? "#2aa36b" : (st ? "#6b46c1" : "url(#noStartGrad)");
        bar.setAttribute("fill", barColor);

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

(function(){
  // elements (may be null if HTML missing - guards below)
  const authModal = document.getElementById("authModal");
  const openAuth = document.getElementById("openAuth");
  const closeAuth = document.getElementById("closeAuth");
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const loginUser = document.getElementById("loginUser");
  const loginPass = document.getElementById("loginPass");
  const regUser = document.getElementById("regUser");
  const regPass = document.getElementById("regPass");

  const profileBox = document.getElementById("userProfile");
  const profileName = document.getElementById("profileName");
  const profileAvatar = document.getElementById("profileAvatar");
  const logoutBtn = document.getElementById("logoutBtn");

  // safety: if required elements missing, stop and warn in console
  if (!authModal || !openAuth || !closeAuth || !loginTab || !registerTab || !loginForm || !registerForm) {
    console.warn("Auth block: some auth elements are missing in DOM. Check IDs in HTML.");
    return;
  }

  // helper: toggle .hidden
  const show = el => el.classList.remove("hidden");
  const hide = el => el.classList.add("hidden");

  // open / close
  openAuth.addEventListener("click", () => {
    show(authModal);
    // default to login tab when opening
    activateTab("login");
  });

  closeAuth.onclick = () => {
  authModal.classList.add('hidden');
};

  // close when clicking on overlay (but not when clicking dialog inside)
  authModal.addEventListener("click", (e) => {
    if (e.target === authModal) hide(authModal);
  });

  // tab activation helper
  function activateTab(which) {
    if (which === "login") {
      loginTab.classList.add("active");
      registerTab.classList.remove("active");
      show(loginForm);
      hide(registerForm);
    } else {
      registerTab.classList.add("active");
      loginTab.classList.remove("active");
      show(registerForm);
      hide(loginForm);
    }
  }

  // attach tab clicks
  loginTab.addEventListener("click", () => activateTab("login"));
  registerTab.addEventListener("click", () => activateTab("register"));

  // profile helpers
  function updateUI() {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        if (profileName) profileName.textContent = u.username || 'User';
        if (profileAvatar) profileAvatar.src = `https://ui-avatars.com/api/?background=6b46c1&color=fff&name=${encodeURIComponent(u.username||'U')}`;
        if (profileBox) show(profileBox);
        if (openAuth) hide(openAuth);
      } catch (err) {
        console.warn("Auth: invalid user in localStorage", err);
        localStorage.removeItem("user");
      }
    } else {
      if (profileBox) hide(profileBox);
      if (openAuth) show(openAuth);
    }
  }

  // logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("user");
      updateUI();
    });
  }

  // login submit
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = (loginUser && loginUser.value || "").trim();
    const pass = (loginPass && loginPass.value || "").trim();
    if (!username) { alert("Введите логин"); return; }
    // TODO: validate/pass to server - now mock
    localStorage.setItem("user", JSON.stringify({ username }));
    updateUI();
    hide(authModal);
    // clear password field for safety
    if (loginPass) loginPass.value = "";
  });

  // register submit
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = (regUser && regUser.value || "").trim();
    const pass = (regPass && regPass.value || "").trim();
    if (!username) { alert("Введите логин"); return; }
    // TODO: perform registration - now mock
    localStorage.setItem("user", JSON.stringify({ username }));
    updateUI();
    hide(authModal);
    if (regPass) regPass.value = "";
  });

  // initial UI state
  updateUI();
  // ensure login tab active by default
  activateTab("login");

})();

function closeModal(node){ if(node && node.parentNode) node.parentNode.removeChild(node); }

function escapeHtml(s){ return (''+s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]); }