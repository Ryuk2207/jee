const suites = [
  {id:'jee-mains.json', title:'JEE Main Tests', desc:'Full-length and topic tests for JEE Main'},
  {id:'jee-advance.json', title:'JEE Advanced Tests', desc:'Advanced level problems'},
  {id:'chapter-wise.json', title:'Chapter-wise', desc:'Small chapter quizzes'},
  {id:'short-test.json', title:'Short Tests', desc:'Quick 10-15 question tests'}
];

const testList = document.getElementById('testList');
const overlay = document.getElementById('overlay');
const progBar = document.getElementById('progBar');
const questionText = document.getElementById('questionText');
const optionsEl = document.getElementById('options');
const qcount = document.getElementById('qcount');
const quizTitle = document.getElementById('quizTitle');
const quizMeta = document.getElementById('quizMeta');

let current = {index:0, questions:[], answers:[], startedAt:null};

function renderTestList(){
  testList.innerHTML = '';
  suites.forEach(s => {
    const el = document.createElement('div'); el.className='test-item';
    el.innerHTML = `<div><div style="font-weight:700">${s.title}</div>
      <div class="small">${s.desc}</div></div>
      <div><button onclick="startSuite('${s.id}','${s.title}')">Start</button></div>`;
    testList.appendChild(el);
  })
}

async function startSuite(file, title){
  quizTitle.textContent = title;
  try {
    const res = await fetch(file);
    if(!res.ok) throw new Error('File not found: '+file);
    const data = await res.json();
    let questions = Array.isArray(data) ? data : (data.questions || Object.values(data).flat());
    questions = questions.map(q=>({...q, options: q.options || q.choices || q.answers || []}));
    current.questions = questions;
    current.index = 0;
    current.answers = new Array(questions.length).fill(null);
    current.startedAt = Date.now();
    quizMeta.textContent = questions.length + ' questions • untimed';
    overlay.classList.add('open');
    renderQuestion();
  } catch(err){
    alert('Could not load test: '+err.message);
  }
}

// ...existing code...

function renderQuestion(){
  const q = current.questions[current.index];
  if(!q) return;
  questionText.innerHTML = q.question || q.q || ('Question '+(current.index+1));
  optionsEl.innerHTML = '';
  q.options.forEach((opt,i)=>{
    const btn = document.createElement('button');
    btn.className='option';
    btn.innerHTML = opt;
    btn.onclick = ()=>selectOption(i, btn);
    if(current.answers[current.index]===i) btn.classList.add('selected');
    optionsEl.appendChild(btn);
  });
  qcount.textContent = `Q ${current.index+1} / ${current.questions.length}`;
  progBar.style.width = Math.round((current.index/current.questions.length)*100) + '%';

  // Remove submit box if not last question
  const confirmBox = document.getElementById('confirmBox');
  if (confirmBox) confirmBox.remove();
}

function selectOption(i, btn){
  const q = current.questions[current.index];
  current.answers[current.index] = i;

  // Disable all options
  Array.from(optionsEl.children).forEach(b => b.disabled = true);

  // Show correct/wrong glow
  let correctIdx = typeof q.correct === "number" ? q.correct : q.answer;
  if (i === correctIdx) {
    btn.classList.add('correct');
  } else {
    btn.classList.add('wrong');
    // Also show correct option
    if (typeof correctIdx === "number" && optionsEl.children[correctIdx])
      optionsEl.children[correctIdx].classList.add('correct');
  }

  // If last question, show confirm box after short delay
  if (current.index === current.questions.length - 1) {
    setTimeout(() => {
      showConfirmBox();
    }, 700);
  } else {
    // Auto jump to next after short delay
    setTimeout(() => {
      current.index++;
      renderQuestion();
    }, 700);
  }
}

function showConfirmBox() {
  // Remove submit button from footer
  document.getElementById('nextBtn').style.display = 'none';

  // Show confirm box
  let quizBody = document.getElementById('quizBody');
  let box = document.createElement('div');
  box.id = 'confirmBox';
  box.style = 'margin:18px 0;padding:18px;background:#fff;border-radius:12px;box-shadow:0 2px 8px #0002;text-align:center;';
  box.innerHTML = `<div style="font-weight:700;font-size:18px;margin-bottom:10px">Confirm to submit</div>
    <button class="btn" id="submitBtn">Submit</button>`;
  quizBody.appendChild(box);
  document.getElementById('submitBtn').onclick = showResults;
}

// Change "Next" to "Skip" everywhere
document.getElementById('nextBtn').textContent = 'Skip';

// ...existing code...

document.getElementById('nextBtn').addEventListener('click', ()=>{
  if(current.index < current.questions.length-1) {
    current.index++;
    renderQuestion();
  } else if(current.index === current.questions.length-1) {
    showConfirmBox();
  }
  // No submit here, handled by confirm box
});

// ...existing code...

function showConfirmBox() {
  // Remove submit button from footer
  document.getElementById('nextBtn').style.display = 'none';

  // Remove any existing confirm box
  let oldBox = document.getElementById('confirmBox');
  if (oldBox) oldBox.remove();

  // Show professional confirm box
  let quizBody = document.getElementById('quizBody');
  let box = document.createElement('div');
  box.id = 'confirmBox';
  box.style = `
    margin:28px auto 0 auto;
    padding:28px 24px;
    background:#f7fafc;
    border-radius:16px;
    box-shadow:0 4px 24px #0002;
    text-align:center;
    max-width:340px;
    border:1px solid #e2e8f0;
    color:#222;
  `;
  box.innerHTML = `
    <div style="font-weight:800;font-size:22px;margin-bottom:12px;color:#1fb14b">
      Confirm Submission
    </div>
    <div style="font-size:15px;margin-bottom:18px;color:#295c92">
      Are you sure you want to submit your answers?<br>
      You cannot change them after submission.
    </div>
    <button class="btn" id="submitBtn" style="margin-top:8px;width:100%;font-size:16px;">
      Submit Test
    </button>
  `;
  quizBody.appendChild(box);
  document.getElementById('submitBtn').onclick = showResults;
}

// ...existing code...

// ...existing code...
function showResults(){
  overlay.classList.remove('open');
  let score=0,total=current.questions.length;
  current.questions.forEach((q,i)=>{
    if(q.correct===current.answers[i]) score++;
    if(typeof q.answer==="number" && q.answer===current.answers[i]) score++;
  });
  const tpl = document.getElementById('resultsTpl').content.cloneNode(true);
  tpl.querySelector('#scoreCircle').style.setProperty('--pct', Math.round((score/total)*360)+'deg');
  tpl.querySelector('#scoreCircle').textContent = Math.round((score/total)*100)+'%';
  tpl.querySelector('#scoreText').textContent = `You scored ${score} / ${total}`;
  tpl.querySelector('#timeTaken').textContent = 'Time: '+Math.round((Date.now()-current.startedAt)/1000)+'s';
  tpl.querySelector('#retryBtn').addEventListener('click', ()=> startSuite('short-test.json','Quick Test'));
  tpl.querySelector('#homeBtn').addEventListener('click', ()=> document.querySelector('.container').scrollIntoView({behavior:'smooth'}));
  document.body.appendChild(tpl);
}

document.getElementById('startQuick').addEventListener('click', ()=> startSuite('short-test.json','Quick Test'));
renderTestList();
