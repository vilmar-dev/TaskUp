const P={mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',grid:'<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',check:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14l-3-3"/>',chart:'<path d="M3 3v18h18M7 15l4-4 3 3 5-6"/>',bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a2 2 0 0 0 3.4 0"/>',user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"/>',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',plus:'<path d="M12 5v14M5 12h14"/>',back:'<path d="m12 19-7-7 7-7M19 12H5"/>',up:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',clip:'<path d="m21 12-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8"/>'};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const $=id=>document.getElementById(id);
$('lg2').innerHTML=ic('check');$('lav').innerHTML=ic('user');$('im').innerHTML=ic('mail');$('il').innerHTML=ic('lock');
$('bell').innerHTML=ic('bell')+'<i class="dot"></i>';$('pf').innerHTML=ic('user');$('lo').innerHTML=ic('out');
const NAV={employee:[['dashboard','Dashboard','grid'],['tasks','My tasks','list'],['accomplish','Submit work','check'],['performance','Performance','chart'],['notif','Notifications','bell'],['profile','Profile','user'],['flow','Flow map','grid']],
supervisor:[['supdash','Overview','grid'],['tasks','All tasks','list'],['evaluate','Evaluate','check'],['users','Team','users'],['reports','Reports','chart'],['notif','Notifications','bell'],['flow','Flow map','grid']]};
const TT={dashboard:'Dashboard',supdash:'Overview',tasks:'Task board',taskdetail:'Task details',accomplish:'Submit accomplishment',performance:'Performance records',evaluate:'Evaluate accomplishments',users:'Manage team',taskcreate:'Task form',notif:'Notifications',reports:'Reports',profile:'Profile and settings',flow:'Flow map'};
const SL={dashboard:'Home',supdash:'Home',tasks:'Tasks',accomplish:'Submit',performance:'Records',evaluate:'Review',users:'Team',reports:'Reports',notif:'Alerts',profile:'Me',flow:'Flow'};
let role='employee',cur='',hist=[];
const T=[{t:'Finalize thesis draft',d:'Due tomorrow',p:'hi',n:65},{t:'Submit chapter 3',d:'Due in 2 days',p:'hi',n:30},{t:'Client report',d:'Due in 5 days',p:'md',n:40},{t:'Team sync notes',d:'Due next week',p:'lo',n:10}];
const PL={hi:'High',md:'Medium',lo:'Low'};
const card=t=>`<div class="tc ${t.p}" tabindex="0" role="button" onclick="go('taskdetail')" onkeydown="if(event.key==='Enter')go('taskdetail')"><b>${t.t}</b><span class="muted sm">${t.d}</span><div class="bar"><i style="width:${t.n}%"></i></div><div class="row sb"><span class="chip ${t.p}">${PL[t.p]}</span><span class="muted sm">${t.n}% done</span></div></div>`;
const row=t=>`<button class="item" onclick="go('taskdetail')"><span><b>${t.t}</b><br><span class="muted sm">${t.d}</span></span><span class="chip ${t.p}">${PL[t.p]}</span></button>`;
const head=(h,p,a='')=>`<div class="banner"><div class="head"><div><h2>${h}</h2><p>${p}</p></div>${a}</div></div>`;
const bk='<button class="btn lnk" style="margin-bottom:14px" onclick="back()">'+ic('back')+'Back</button>';
const fld=(l,i)=>`<label class="f">${l}${i}</label>`;
const inp=(ph,t='text')=>`<input class="in" type="${t}" placeholder="${ph}">`;
const sel=o=>`<select class="in">${o.map(x=>`<option>${x}</option>`).join('')}</select>`;
let sc=0;const stat=(l,v,c='')=>{const k=/Employees/.test(l)?'users':/Overdue|Due/.test(l)?'bell':/omplet|Pending/.test(l)?'check':/rate/.test(l)?'chart':'list';return `<div class="card stat ${c}"><span class="bub b${sc++%3}">${ic(k)}</span><div><b>${v}</b><span class="muted sm">${l}</span></div></div>`};
const V={
dashboard:()=>head('Hi, Juan','You have 2 tasks due soon. Start with the thesis draft.',`<button class="btn p" onclick="go('accomplish')">${ic('check')}Submit accomplishment</button>`)+
`<div class="g3">${stat('Assigned tasks',7,'hl')}${stat('Due today',2)}${stat('Completed this month','78%')}</div>
<div class="card mt"><div class="row sb"><h3>My assigned tasks</h3><button class="btn lnk" onclick="go('tasks')">View all</button></div>${T.slice(0,3).map(row).join('')}</div>
<div class="g2 mt"><button class="item" onclick="go('performance')"><span><b>Performance records</b><br><span class="muted sm">42 tasks completed, 89% on time</span></span>${ic('chart')}</button><button class="item" onclick="go('notif')"><span><b>Notifications</b><br><span class="muted sm">3 new reminders and updates</span></span>${ic('bell')}</button></div>`,
supdash:()=>head('Organization overview','Team workload, pending reviews, and task progress at a glance.',`<button class="btn p" onclick="go('taskcreate')">${ic('plus')}Assign new task</button>`)+
`<div class="g4">${stat('Employees',18)}${stat('Active tasks',142)}${stat('Overdue',6)}${stat('Pending review',4,'hl')}</div>
<div class="card mt"><div class="row sb"><h3>Team workload</h3><button class="btn lnk" onclick="go('users')">Manage team</button></div><div class="tw"><table><tr><th>Employee</th><th>Active</th><th>Overdue</th><th>Load</th></tr>
<tr><td>Juan D.</td><td>7</td><td>0</td><td style="width:30%"><div class="bar"><i style="width:70%"></i></div></td></tr>
<tr><td>Maria S.</td><td>5</td><td><span class="chip hi">1 overdue</span></td><td><div class="bar"><i style="width:50%"></i></div></td></tr></table></div></div>
<div class="card mt"><div class="row sb"><h3>Waiting for your review</h3><button class="btn lnk" onclick="go('evaluate')">Evaluate</button></div>
<button class="item" onclick="go('evaluate')"><span><b>Client email batch</b><br><span class="muted sm">Maria S. submitted Sept 20</span></span><span class="chip pd">Pending</span></button></div>`,
tasks:()=>head('Task board','Sorted automatically by deadline and workload.',role==='supervisor'?`<button class="btn p" onclick="go('taskcreate')">${ic('plus')}New task</button>`:'')+
`<div class="row wrap" style="margin-bottom:18px"><button class="btn">Filter: All tasks</button><button class="btn">List</button><button class="btn p">Board</button></div>
<div class="g3"><div class="col"><h3>High priority <span class="muted">2</span></h3>${T.filter(t=>t.p=='hi').map(card).join('')}</div><div class="col"><h3>Medium priority <span class="muted">1</span></h3>${T.filter(t=>t.p=='md').map(card).join('')}</div><div class="col"><h3>Low priority <span class="muted">1</span></h3>${T.filter(t=>t.p=='lo').map(card).join('')}</div></div>`,
taskdetail:()=>bk+head('Finalize thesis draft','Assigned to Juan Dela Cruz. Deadline Sept 23.',`<span class="chip hi">High priority</span>`)+
`<div class="g2 g21"><div><div class="card"><h3>Description</h3><p class="muted" style="margin:0">Complete and finalize the thesis draft for review.</p></div>
<div class="card mt"><h3>Attachments and comments</h3><div class="drop">${ic('clip')}<br>Drop a file here or add a comment</div></div></div>
<div class="card" style="align-self:start">${role==='employee'?`<h3>Update progress</h3><div class="seg" style="margin-top:0"><button onclick="sg(this)">Not started</button><button class="on" onclick="sg(this)">In progress</button><button onclick="sg(this)">Done</button></div>
<label class="f">Progress <b>65%</b><input type="range" value="65" style="width:100%;accent-color:var(--pri)" oninput="this.previousElementSibling.textContent=this.value+'%'"></label>
<button class="btn p full" onclick="toast('Progress saved. Supervisor notified')">Save progress</button><button class="btn full" style="margin-top:10px" onclick="go('accomplish')">Submit accomplishment</button>`:
`<h3>Status</h3><span class="chip pd">In progress</span><div class="bar" style="margin:14px 0"><i style="width:65%"></i></div><button class="btn p full" onclick="go('taskcreate')">Edit task</button>`}</div></div>`,
accomplish:()=>bk+head('Submit accomplishment','Share a short summary and proof so your supervisor can evaluate it.')+
`<div class="card" style="max-width:640px">${fld('Task',sel(['Finalize thesis draft','Client report','Team sync notes']))}${fld('What did you accomplish?','<textarea class="in" placeholder="Summarize what was done"></textarea>')}
<div class="f" style="font-weight:600;font-size:14px;margin-bottom:16px">Proof or output<div class="drop" style="margin-top:6px">${ic('up')}<br>Upload a file (PDF, image, or document)</div></div>${fld('Date completed',inp('','date'))}
<button class="btn p full" onclick="toast('Submitted for supervisor review');back()">Submit for review</button></div>`,
performance:()=>head('Performance records','Your completed tasks and supervisor evaluations.')+
`<div class="g2">${stat('Tasks completed',42)}${stat('On-time rate','89%','hl')}</div><div class="card mt"><h3>Evaluation history</h3><div class="tw"><table><tr><th>Task</th><th>Date</th><th>Status</th><th>Remarks</th></tr>
<tr><td>Chapter 2 draft</td><td>Sept 18</td><td><span class="chip ok">Approved</span></td><td>On time, good quality</td></tr>
<tr><td>Client email batch</td><td>Sept 20</td><td><span class="chip ok">Approved</span></td><td>Submitted late</td></tr></table></div></div>`,
evaluate:()=>head('Evaluate accomplishments','Review submitted work and update performance records.')+
`<div class="card"><div class="row sb wrap"><h3 style="margin:0">Chapter 2 draft</h3><span class="chip pd">Needs review</span></div><p class="muted sm">Juan D. submitted Sept 18. ${ic('clip').replace('class="ic"','class="ic" style="width:14px;height:14px;vertical-align:-2px"')} attachment.pdf</p>
${fld('Feedback','<textarea class="in" placeholder="Add remarks for the employee"></textarea>')}<div class="row wrap"><button class="btn p" onclick="toast('Approved. Performance record updated')">Approve</button><button class="btn" onclick="toast('Returned to employee for revision')">Request revision</button></div></div>
<div class="card mt row sb"><div><b>Client email batch</b><br><span class="muted sm">Maria S. submitted Sept 20</span></div><span class="chip pd">Pending</span></div>`,
users:()=>bk+head('Manage team','Employee accounts, roles, and status.',`<button class="btn p" onclick="toast('Add-user form opens here')">${ic('plus')}Add user</button>`)+
`<div class="card"><div class="tw"><table><tr><th>Name</th><th>Role</th><th>Status</th><th></th></tr>${[['Juan D.','Employee'],['Maria S.','Employee'],['Ana R.','Supervisor']].map(u=>`<tr><td><div class="row"><span class="av">${u[0].slice(0,1)}</span>${u[0]}</div></td><td>${u[1]}</td><td><span class="chip ok">Active</span></td><td><button class="btn" onclick="toast('Edit user opens here')">Edit</button></td></tr>`).join('')}</table></div></div>`,
taskcreate:()=>bk+head('Create or edit task','Add the details, then assign it to a team member.')+
`<div class="card" style="max-width:640px">${fld('Task title',inp('e.g. Prepare weekly report'))}${fld('Description','<textarea class="in" placeholder="Add details or notes"></textarea>')}
<div class="g2" style="gap:14px">${fld('Deadline',inp('','date'))}${fld('Priority',sel(['Auto (recommended)','High','Medium','Low']))}</div>${fld('Assign to',sel(['Juan D.','Maria S.']))}
<div class="row"><button class="btn p" onclick="toast('Task saved');go('tasks')">Save task</button><button class="btn" onclick="back()">Cancel</button></div></div>`,
notif:()=>head('Notifications','Reminders and updates from email, Slack, and Teams.')+
[['bell','New deadline reminder: Client report','taskdetail'],[role==='employee'?'chart':'check',role==='employee'?'Your accomplishment was evaluated':'Weekly accomplishment summary is ready',role==='employee'?'performance':'reports'],['users','Slack: a teammate commented on a task','taskdetail']].map(n=>`<button class="item" onclick="go('${n[2]}')"><span class="row">${ic(n[0])}${n[1]}</span></button>`).join(''),
reports:()=>head('Reports','Accomplishment monitoring across your team.',`<button class="btn" onclick="toast('Report exported')">${ic('up')}Export report</button>`)+
`<div class="card"><h3>Completed per week</h3><div class="bars">${[['W1',55],['W2',72],['W3',48],['W4',88]].map(b=>`<div><i style="height:${b[1]}%"></i><span class="muted sm">${b[0]}</span></div>`).join('')}</div></div>
<div class="card mt"><h3>Accomplishment log</h3><div class="tw"><table><tr><th>Employee</th><th>Task</th><th>Completed</th><th>On time</th></tr><tr><td>Juan D.</td><td>Chapter 2 draft</td><td>Sept 18</td><td><span class="chip ok">Yes</span></td></tr><tr><td>Maria S.</td><td>Client email batch</td><td>Sept 20</td><td><span class="chip hi">Late</span></td></tr></table></div></div>`,
flow:()=>head('Navigation flow map','How each role moves through the app.')+`<div class="g2">${[['Login','Employee tab opens the Employee Dashboard. Supervisor tab opens the Supervisor Overview.'],['Employee dashboard','Task board, submit accomplishment, performance records, notifications, and profile.'],['Task detail','Employee: update progress and submit accomplishment. Supervisor: edit task.'],['Supervisor overview','Task board, create and assign tasks, evaluate, manage team, and reports.'],['Evaluate accomplishments','Approve or request revision. Updates the employee performance record.'],['Back button','Returns to the exact screen you came from.']].map(f=>`<div class="card"><h3>${f[0]}</h3><p class="muted" style="margin:0">${f[1]}</p></div>`).join('')}</div>`,
profile:()=>head('Profile and settings','Your details, notifications, and connected accounts.')+
`<div class="g2"><div class="card"><h3>Your details</h3>${fld('Name',inp('Juan Dela Cruz'))}${fld('Department',inp('Operations'))}<button class="btn p" onclick="toast('Profile saved')">Save changes</button></div>
<div class="card"><h3>Notifications</h3>${[['Email',1],['Slack',1],['Microsoft Teams',0]].map(s=>`<div class="row sb" style="padding:10px 0;border-bottom:1px solid var(--ln)"><span>${s[0]}</span><label class="sw"><input type="checkbox" ${s[1]?'checked':''} aria-label="${s[0]}"><span></span></label></div>`).join('')}</div></div>`
};
function setRole(r){role=r;$('r-e').classList.toggle('on',r=='employee');$('r-s').classList.toggle('on',r=='supervisor');$('em').placeholder=r=='employee'?'Email or username':'Supervisor email'}
function login(){hist=[];cur='';$('login').style.display='none';$('app').style.display='grid';const s=role=='supervisor';
 $('av').textContent=s?'AR':'JD';$('mn').textContent=s?'Ana Reyes':'Juan Dela Cruz';$('mr').textContent=s?'Supervisor':'Employee';
 const h=NAV[role].map(n=>`<button data-s="${n[0]}" onclick="go('${n[0]}')" title="${n[1]}">${ic(n[2])}<span class="nl">${n[1]}</span></button>`).join('');$('nav').innerHTML=h;
 $('bn').innerHTML=NAV[role].slice(0,5).map(n=>`<button data-s="${n[0]}" onclick="go('${n[0]}')">${ic(n[2])}${SL[n[0]]}</button>`).join('');go(s?'supdash':'dashboard')}
function logout(){$('app').style.display='none';$('login').style.display='grid';window.scrollTo(0,0)}
function go(s){if(cur&&cur!==s)hist.push(cur);show(s)}
function back(){show(hist.pop()||(role=='supervisor'?'supdash':'dashboard'))}
function show(s){cur=s;$('view').innerHTML=V[s]();{const b=$('view').querySelector('.banner'),k=$('view').querySelector(':scope>.btn.lnk');if(b&&k)b.prepend(k)}document.querySelectorAll('#view table').forEach(t=>{const h=[...t.querySelectorAll('th')].map(x=>x.textContent);t.querySelectorAll('tr').forEach(r=>{if(r.querySelector('th'))r.classList.add('hd');else[...r.children].forEach((c,i)=>c.dataset.l=h[i]||'')})});$('crumb').innerHTML=(role=='supervisor'?'Supervisor':'Employee')+'<span class="wsp"> workspace</span>';
 document.querySelectorAll('[data-s]').forEach(b=>b.classList.toggle('on',b.dataset.s===s));window.scrollTo({top:0})}
function sg(b){b.parentNode.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on')}
let tm;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(tm);tm=setTimeout(()=>t.classList.remove('show'),2600)}
