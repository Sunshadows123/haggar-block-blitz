(()=>{
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const N=8, COLORS=['#ff4d6d','#ffb830','#40dc8c','#46a0ff','#ffd400','#b464ff','#ff7a3d','#2ee6d6'];
const GAME_MS=300000;
const SB_URL='https://rbqccmnlagaghfwzervg.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicWNjbW5sYWdhZ2hmd3plcnZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMTQwODgsImV4cCI6MjEwODc5MDA4OH0.VHkvdzhwentcj1O49nc_kN0MzVqrOS1jwrpGqH5LfqM';
const RAR=['common','uncommon','rare','epic','legendary'];
const RCOL={common:'#9aa4b8',uncommon:'#40dc8c',rare:'#46a0ff',epic:'#b464ff',legendary:'#ffb830'};
// ---------- persistent save ----------
const SAVE_KEY='hbb-save';
const S=Object.assign({coins:0,high:0,luck:0,seen:{},sound:true,anim:true,vib:true,boosts:{},device:null,name:null,queue:[]},JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'));
if(!S.device)S.device=(crypto.randomUUID?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^Math.random()*16>>c/4).toString(16)));
const save=()=>localStorage.setItem(SAVE_KEY,JSON.stringify(S));save();
// ---------- audio ----------
let AC;
function beep(f=440,d=.08,type='square',v=.06,slide=0){if(!S.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),AC.currentTime+d);g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.connect(g).connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}
const sfx={place:()=>beep(220,.07,'triangle',.08),clear:n=>{for(let i=0;i<Math.min(n,6);i++)setTimeout(()=>beep(440+i*120,.12,'square',.05),i*60)},power:()=>{[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.15,'sine',.07),i*70))},bad:()=>beep(160,.25,'sawtooth',.06,-80),tick:()=>beep(880,.03,'sine',.03),buy:()=>beep(1200,.1,'sine',.06,400),whoosh:()=>beep(300,.3,'sine',.04,-250)};
const vib=ms=>{if(S.vib&&navigator.vibrate)navigator.vibrate(ms)};
// ---------- shapes ----------
const BASE={'1':['#'],'2h':['##'],'2v':['#','#'],'3h':['###'],'3v':['#','#','#'],'4h':['####'],'4v':['#','#','#','#'],'5h':['#####'],'5v':['#','#','#','#','#'],
 sq2:['##','##'],sq3:['###','###','###'],r23:['###','###'],r32:['##','##','##'],
 c3a:['##','#.'],c3b:['##','.#'],c3c:['#.','##'],c3d:['.#','##'],
 La:['#.','#.','##'],Lb:['###','#..'],Lc:['##','.#','.#'],Ld:['..#','###'],Ja:['.#','.#','##'],Jb:['#..','###'],Jc:['##','#.','#.'],Jd:['###','..#'],
 Ta:['###','.#.'],Tb:['.#.','###'],Tc:['#.','##','#.'],Td:['.#','##','.#'],Sa:['.##','##.'],Sb:['#.','##','.#'],Za:['##.','.##'],Zb:['.#','##','#.'],
 BLa:['#..','#..','###'],BLb:['###','#..','#..'],BLc:['###','..#','..#'],BLd:['..#','..#','###']};
const SHAPE_KEYS=Object.keys(BASE);
const fromRows=rows=>{const c=[];rows.forEach((row,r)=>[...row].forEach((ch,k)=>{if(ch==='#')c.push([r,k])}));return c};
const norm=p=>{const mr=Math.min(...p.cells.map(x=>x[0])),mc=Math.min(...p.cells.map(x=>x[1]));return{cells:p.cells.map(([r,c])=>[r-mr,c-mc]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),color:p.color,key:p.key}};
const shape=(k,color)=>({cells:fromRows(BASE[k]),color:color??(Math.random()*COLORS.length|0),key:k});
const rot=p=>norm({cells:p.cells.map(([r,c])=>[c,-r]),color:p.color});
const mir=p=>norm({cells:p.cells.map(([r,c])=>[r,-c]),color:p.color});
// ---------- game state ----------
const G=window.G={N,grid:[],pieces:[null,null,null],score:0,streak:0,inv:[],flags:{},timers:{},timeLeft:GAME_MS,running:false,over:false,history:null,coinsGame:0,linesTotal:0,targeting:null,rescue:false,errors:[]};
G.norm=norm;G.rot=rot;G.mir=mir;
G.shape=k=>shape(k);
G.allShapes=()=>SHAPE_KEYS.map(k=>shape(k));
G.randPiece=(max=9)=>{const ks=SHAPE_KEYS.filter(k=>fromRows(BASE[k]).length<=max);const w=k=>{const n=fromRows(BASE[k]).length;return n>=9?.4:n===1?.5:1};let t=ks.reduce((a,k)=>a+w(k),0),x=Math.random()*t;for(const k of ks){x-=w(k);if(x<=0)return shape(k)}return shape(ks[0])};
G.canPlace=(p,r,c,ghost=G.flags.ghost)=>p.cells.every(([a,b])=>{const R=r+a,C=c+b;return R>=0&&C>=0&&R<N&&C<N&&(ghost||G.grid[R][C]<0)});
G.fits=p=>{for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(G.canPlace(p,r,c))return true;return false};
G.anyMove=()=>G.pieces.some(p=>p&&G.fits(p));
G.now=()=>performance.now();
G.timed=(k,s)=>{G.timers[k]=Math.max(G.timers[k]||0,G.now())+s*1000;G.after()};
G.active=k=>(G.timers[k]||0)>G.now();
G.mult=()=>(G.active('x2')?2:1)*(G.active('x3')?3:1)*(G.active('x5')?5:1);
G.addTime=s=>{G.timeLeft+=s*1000;floatText('+'+s+'s',null,'#7fe3ff');G.after()};
G.addScore=(n,raw)=>{n=Math.round(raw?n:n*G.mult());G.score+=n;if(n)floatText('+'+n,null,'#ffe066');G.after()};
G.addCoins=n=>{G.coinsGame+=n;S.coins+=n;save();if(n)floatText('+'+n+'🪙',null,'#ffb830');updateCoins()};
G.after=()=>{if(G.running)render()};
G.mapPieces=f=>{G.pieces=G.pieces.map(p=>p?f(p):p);dealAnim=true;G.after()};
G.setPieces=(f,keep)=>{G.pieces=G.pieces.map(p=>keep?f(p):f());dealAnim=true;G.after()};
G.snapshot=()=>({grid:G.grid.map(r=>r.slice()),pieces:G.pieces.map(p=>p&&{cells:p.cells.map(x=>x.slice()),color:p.color}),score:G.score,streak:G.streak});
G.undo=()=>{const h=G.history;if(!h){toast('Nothing to undo');return}Object.assign(G,{grid:h.grid,pieces:h.pieces,score:h.score,streak:h.streak});G.history=null;dealAnim=true;G.after()};
G.clear=(cells)=>{const seen=new Set;let n=0;cells.forEach(([r,c])=>{const k=r*N+c;if(seen.has(k)||r<0||c<0||r>=N||c>=N)return;seen.add(k);if(G.grid[r][c]>=0){burst(r,c,COLORS[G.grid[r][c]]);G.grid[r][c]=-1;n++}});if(n){G.addScore(n*5);shake();sfx.clear(Math.ceil(n/4))}G.after();return n};
G.fill=(cells,color=Math.random()*COLORS.length|0)=>{cells.forEach(([r,c])=>{if(G.grid[r][c]<0)G.grid[r][c]=color});checkLines();G.after()};
G.bestMove=()=>{let best=null;G.pieces.forEach((p,i)=>{if(!p)return;for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(G.canPlace(p,r,c)){const v=evalMove(p,r,c);if(!best||v>best.v)best={i,r,c,v}}});return best};
function evalMove(p,r,c){const g=G.grid.map(x=>x.slice());p.cells.forEach(([a,b])=>g[r+a][c+b]=1);let lines=0;for(let i=0;i<N;i++){if(g[i].every(v=>v>=0))lines++;if(g.every(row=>row[i]>=0))lines++}let adj=0;p.cells.forEach(([a,b])=>[[1,0],[-1,0],[0,1],[0,-1]].forEach(([x,y])=>{const R=r+a+x,C=c+b+y;if(R<0||C<0||R>=N||C>=N||g[R][C]>=0)adj++}));return lines*100+adj+p.cells.length}
G.autoPlace=()=>{const b=G.bestMove();if(b)placePiece(b.i,b.r,b.c);else toast('No spot for a piece')};
G.hint=()=>{const b=G.bestMove();if(!b){toast('No moves – use a power-up!');return}hintCells=G.pieces[b.i].cells.map(([a,c])=>[b.r+a,b.c+c]);hintUntil=G.now()+6000;G.after()};
G.run=(id,r=3,c=3)=>{const p=PW[id];try{p.run(G,r,c)}catch(e){G.errors.push(id+': '+e.message);console.error(e)}};
// ---------- power awards ----------
function rollRarity(){const L=S.luck;let w=[50-8*L,28+1*L,14+3*L,6+2.5*L,2+1.5*L];if(G.flags.charm>0){w=[0,0,w[2],w[3],w[4]];G.flags.charm--}let t=w.reduce((a,b)=>a+b),x=Math.random()*t;for(let i=0;i<5;i++){x-=w[i];if(x<=0)return RAR[i]}return 'common'}
G.award=(id,silent)=>{if(!id){const rar=rollRarity();const pool=POWERS.filter(p=>p.rarity===rar);id=pool[Math.random()*pool.length|0].id}const p=PW[id];S.seen[id]=(S.seen[id]||0)+1;save();if(!silent||true)revealQ.push(p);if(p.passive){G.run(id)}else{if(G.inv.length>=12){toast('Inventory full – '+PW[G.inv[0]].name+' auto-used');useInv(0)}G.inv.push(id)}runReveal();renderInv();return id};
// ---------- line clearing ----------
function checkLines(){const rows=[],cols=[];for(let i=0;i<N;i++){if(G.grid[i].every(v=>v>=0))rows.push(i);if(G.grid.every(r=>r[i]>=0))cols.push(i)}
 let lines=rows.length+cols.length;if(!lines)return 0;
 if(G.flags.chain){G.flags.chain=0;const extra=[...Array(N).keys()].filter(r=>!rows.includes(r));if(extra.length)rows.push(extra[Math.random()*extra.length|0]);toast('⛓️ Chain Reaction!')}
 const cells=[];rows.forEach(r=>{for(let c=0;c<N;c++)cells.push([r,c])});cols.forEach(c=>{for(let r=0;r<N;r++)cells.push([r,c])});
 const seen=new Set;cells.forEach(([r,c],i)=>{const k=r*N+c;if(seen.has(k))return;seen.add(k);if(G.grid[r][c]>=0)burst(r,c,COLORS[G.grid[r][c]]);G.grid[r][c]=-1});
 G.streak++;G.linesTotal+=lines;
 let pts=lines*lines*80*(1+(G.streak-1)*.5);if(G.flags.golden)pts*=1+.5*G.flags.golden;if(G.flags.x10){pts*=10;G.flags.x10=0;toast('🔟 Mega Clear x10!')}
 G.addScore(pts);G.addCoins(lines*2+(G.streak>1?G.streak:0)+(lines>1?lines*2:0));
 showCombo(lines,G.streak);sfx.clear(lines+G.streak);shake();vib(30);
 let awards=lines;if(G.flags.double){awards*=2;G.flags.double=0}
 for(let i=0;i<awards;i++)setTimeout(()=>{if(G.running)G.award()},150+i*250);
 return lines}
// ---------- placement ----------
let dealAnim=false,hintCells=[],hintUntil=0;
function placePiece(i,r,c){const p=G.pieces[i];if(!p||!G.canPlace(p,r,c))return false;G.history=G.snapshot();
 const ghost=G.flags.ghost;p.cells.forEach(([a,b])=>G.grid[r+a][c+b]=p.color);if(ghost){G.flags.ghost=0}
 G.pieces[i]=null;let pts=p.cells.length;if(G.active('builder'))pts+=10*p.cells.length;if(G.active('prism'))pts+=15*p.cells.length;G.addScore(pts);sfx.place();vib(10);
 const lines=checkLines();if(!lines){if(G.flags.keep>0)G.flags.keep--;else G.streak=0}
 if(G.pieces.every(x=>!x)){G.pieces=[G.randPiece(),G.randPiece(),G.randPiece()];dealAnim=true}
 hintCells=[];render();checkStuck();return true}
G.placePiece=placePiece;
function checkStuck(){if(!G.running||G.over)return;if(G.anyMove()){if(G.rescue){G.rescue=false;hideBanner()}return}
 if(G.flags.shield>0){G.flags.shield--;toast('🛡️ Shield! Pieces rerolled');G.setPieces(()=>G.randPiece());return checkStuck()}
 G.rescue=true;showBanner(`<b>No moves!</b><br>${G.inv.length?'Use a power-up below':'Buy a block'} to rescue yourself, or give up.<br><button id="bnBuy">🧩 Buy block</button><button id="bnGive">Give up</button>`);
 $('#bnBuy').onclick=openPieceShop;$('#bnGive').onclick=()=>endGame('No legal moves');}
G.checkStuck=checkStuck;
// ---------- rendering ----------
const board=$('#board');const cellEls=[];
for(let i=0;i<N*N;i++){const d=document.createElement('div');d.className='cell';d.dataset.i=i;board.appendChild(d);cellEls.push(d)}
function render(){if(G.now()>hintUntil)hintCells=[];const hs=new Set(hintCells.map(([r,c])=>r*N+c));
 for(let r=0;r<N;r++)for(let c=0;c<N;c++){const el=cellEls[r*N+c],v=G.grid[r][c];const was=el.classList.contains('f');el.className='cell'+(v>=0?' f':'')+(hs.has(r*N+c)?' hint':'');if(v>=0){el.style.setProperty('--c',COLORS[v]);if(was)el.style.animation='none';else el.style.animation=''}else el.style.removeProperty('--c')}
 const tray=$('#tray');tray.innerHTML='';G.pieces.forEach((p,i)=>{const s=document.createElement('div');s.className='slot';if(p){const el=pieceEl(p,Math.min(22,window.innerWidth/18));el.dataset.i=i;if(!G.fits(p))el.classList.add('cant');if(dealAnim){el.classList.add('new');el.style.animationDelay=i*80+'ms'}el.addEventListener('pointerdown',startDrag);s.appendChild(el)}tray.appendChild(s)});dealAnim=false;
 $('#score').textContent=G.score.toLocaleString();renderInv();renderEffects();board.classList.toggle('targeting',!!G.targeting)}
function pieceEl(p,sz){const w=Math.max(...p.cells.map(x=>x[1]))+1,h=Math.max(...p.cells.map(x=>x[0]))+1;const el=document.createElement('div');el.className='piece';el.style.gridTemplateColumns=`repeat(${w},${sz}px)`;el.style.gridTemplateRows=`repeat(${h},${sz}px)`;p.cells.forEach(([r,c])=>{const b=document.createElement('div');b.className='blk';b.style.gridRow=r+1;b.style.gridColumn=c+1;b.style.setProperty('--c',COLORS[p.color]);el.appendChild(b)});return el}
function renderInv(){const inv=$('#inv');inv.innerHTML='';G.inv.forEach((id,i)=>{const p=PW[id];const d=document.createElement('div');d.className='pw r-'+p.rarity+(G.targeting&&G.targeting.i===i?' sel':'');d.textContent=p.icon;d.title=p.name+': '+p.desc;d.onclick=()=>useInv(i);inv.appendChild(d)});if(!G.inv.length)inv.innerHTML='<span style="opacity:.4;padding:16px;font-size:13px">Clear lines to win power-ups</span>'}
function renderEffects(){const e=[];const t=k=>Math.ceil(((G.timers[k]||0)-G.now())/1000);[['freeze','🧊 Frozen'],['slow','🐢 Slow'],['x2','✌️ x2'],['x3','🔥 x3'],['x5','💥 x5'],['builder','🏗️ Builder'],['prism','🎆 Prism']].forEach(([k,l])=>{if(G.active(k))e.push(l+' '+t(k)+'s')});
 if(G.flags.ghost)e.push('👻 Ghost');if(G.flags.shield)e.push('🛡️×'+G.flags.shield);if(G.flags.phoenix)e.push('🐦‍🔥×'+G.flags.phoenix);if(G.flags.charm)e.push('🧿×'+G.flags.charm);if(G.flags.double)e.push('👯');if(G.flags.chain)e.push('⛓️');if(G.flags.golden)e.push('👑+'+50*G.flags.golden+'%');if(G.flags.x10)e.push('🔟');if(G.streak>1)e.push('🔥 Streak '+G.streak);
 $('#effects').innerHTML=e.map(x=>`<span>${x}</span>`).join('')}
// ---------- using powers ----------
function useInv(i){const id=G.inv[i];if(!id)return;const p=PW[id];
 if(p.t){if(G.targeting&&G.targeting.i===i){G.targeting=null;render();return}G.targeting={i,id};toast(p.icon+' '+p.name+': tap a cell on the board');render();return}
 G.inv.splice(i,1);G.targeting=null;sfx.power();G.run(id);render();checkStuck()}
G.useInv=useInv;
board.addEventListener('click',e=>{const el=e.target.closest('.cell');if(!el||!G.targeting)return;const i=+el.dataset.i,r=i/N|0,c=i%N;const {i:ii,id}=G.targeting;G.targeting=null;G.inv.splice(ii,1);sfx.power();G.run(id,r,c);render();checkStuck()});
// ---------- drag & drop ----------
let drag=null;
function startDrag(e){if(!G.running||G.over)return;e.preventDefault();G.targeting=null;const i=+e.currentTarget.dataset.i,p=G.pieces[i];if(!p)return;
 const cs=cellEls[0].getBoundingClientRect().width,gap=3;const el=pieceEl(p,cs);el.className='drag';el.style.gap=gap+'px';document.body.appendChild(el);
 e.currentTarget.style.opacity=.2;drag={i,p,el,src:e.currentTarget,cs,gap,off:e.pointerType==='touch'?cs*2.2:cs*0.6,pos:null};moveDrag(e);beep(500,.04,'sine',.03);
 window.addEventListener('pointermove',moveDrag);window.addEventListener('pointerup',endDrag);window.addEventListener('pointercancel',endDrag)}
function moveDrag(e){if(!drag)return;const {el,p,cs,gap,off}=drag;const w=Math.max(...p.cells.map(x=>x[1]))+1,h=Math.max(...p.cells.map(x=>x[0]))+1;const pw=w*cs+(w-1)*gap,ph=h*cs+(h-1)*gap;
 const x=e.clientX-pw/2,y=e.clientY-ph-off+cs*0.5;el.style.left=x+'px';el.style.top=y+'px';
 const b=cellEls[0].getBoundingClientRect(),step=cs+gap;const c=Math.round((x-b.left)/step),r=Math.round((y-b.top)/step);
 drag.pos=G.canPlace(p,r,c)?[r,c]:null;preview()}
function preview(){cellEls.forEach(el=>el.classList.remove('ghost','willclear'));if(!drag||!drag.pos)return;const[r,c]=drag.pos;const g=G.grid.map(x=>x.slice());
 drag.p.cells.forEach(([a,b])=>{g[r+a][c+b]=drag.p.color;const el=cellEls[(r+a)*N+c+b];if(G.grid[r+a][c+b]<0){el.classList.add('ghost');el.style.setProperty('--c',COLORS[drag.p.color])}});
 for(let i=0;i<N;i++){if(g[i].every(v=>v>=0))for(let k=0;k<N;k++)cellEls[i*N+k].classList.add('willclear');if(g.every(row=>row[i]>=0))for(let k=0;k<N;k++)cellEls[k*N+i].classList.add('willclear')}}
function endDrag(){if(!drag)return;window.removeEventListener('pointermove',moveDrag);window.removeEventListener('pointerup',endDrag);window.removeEventListener('pointercancel',endDrag);
 const d=drag;drag=null;d.el.remove();cellEls.forEach(el=>el.classList.remove('ghost','willclear'));if(d.pos)placePiece(d.i,d.pos[0],d.pos[1]);else{d.src.style.opacity=1;if(d.pos===null)sfx.bad()}render()}
// ---------- FX ----------
const fx=$('#fx');
function burst(r,c,col){if(!S.anim)return;const b=cellEls[r*N+c].getBoundingClientRect();for(let i=0;i<5;i++){const s=document.createElement('div');s.className='pt';s.style.left=b.left+b.width/2+'px';s.style.top=b.top+b.height/2+'px';s.style.setProperty('--c',col);s.style.setProperty('--dx',(Math.random()-.5)*160+'px');s.style.setProperty('--dy',(Math.random()-.7)*160+'px');fx.appendChild(s);setTimeout(()=>s.remove(),750)}}
function floatText(t,at,col){if(!S.anim||!G.running)return;const b=board.getBoundingClientRect();const s=document.createElement('div');s.className='ftxt';s.textContent=t;s.style.color=col;s.style.left=(b.left+b.width*(.3+Math.random()*.4))+'px';s.style.top=(b.top+b.height*(.3+Math.random()*.3))+'px';fx.appendChild(s);setTimeout(()=>s.remove(),1000)}
function shake(){board.classList.remove('shake');void board.offsetWidth;board.classList.add('shake')}
function showCombo(lines,streak){const el=$('#combo');const words=['','NICE!','GREAT!','AMAZING!','INCREDIBLE!','UNREAL!','GODLIKE!'];el.textContent=(words[Math.min(lines,6)])+(streak>1?` x${streak}`:'');el.style.color=COLORS[(lines+streak)%COLORS.length];el.classList.remove('go');void el.offsetWidth;el.classList.add('go')}
let toastT;function toast(t){const el=$('#toast');el.innerHTML=t;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),1800)}
const revealQ=[];let revealing=false;
function runReveal(){if(revealing||!revealQ.length)return;const p=revealQ.shift();revealing=true;const el=$('#reveal');el.classList.remove('hidden');el.innerHTML=`<div class="card r-${p.rarity}"><span class="rar">${p.rarity.toUpperCase()}${p.passive?' · PASSIVE':''}</span><span class="em">${p.icon}</span><h3>${p.name}</h3><p>${p.desc}</p></div>`;sfx.power();if(p.rarity==='legendary'||p.rarity==='epic')vib([30,40,30]);
 if(S.anim){const r=el.firstChild.getBoundingClientRect?null:null;for(let i=0;i<14;i++){const s=document.createElement('div');s.className='pt';s.style.left='50%';s.style.top='45%';s.style.setProperty('--c',RCOL[p.rarity]);s.style.setProperty('--dx',(Math.random()-.5)*400+'px');s.style.setProperty('--dy',(Math.random()-.5)*400+'px');fx.appendChild(s);setTimeout(()=>s.remove(),750)}}
 setTimeout(()=>{el.classList.add('hidden');revealing=false;runReveal()},S.anim?(revealQ.length?1000:1600):500)}
function showBanner(h){const b=$('#banner');b.innerHTML=h;b.classList.add('show')}
function hideBanner(){$('#banner').classList.remove('show')}
// ---------- modal ----------
function modal(html){$('#panel').innerHTML=html;$('#overlay').classList.remove('hidden')}
function closeModal(){$('#overlay').classList.add('hidden')}
G.closeModal=closeModal;
// ---------- piece shop (mid-game) ----------
const piecePrice=k=>{const n=fromRows(BASE[k]).length;return n===1?25:n<=2?20:n<=3?18:15};
function openPieceShop(){if(!G.running)return;const wasPaused=G.paused;G.paused=true;
 let h=`<h2>🧩 Emergency Shop</h2><p>🪙 ${S.coins} · pick a block to replace an offered piece</p><div class="shapes">`;
 SHAPE_KEYS.forEach(k=>{h+=`<div class="shapeBtn" data-k="${k}">${pieceEl(shape(k,3),10).outerHTML}<small>🪙${piecePrice(k)}</small></div>`});
 h+=`</div><div class="btns"><button id="bTime">⏱️ +20s · 🪙40</button><button id="bRe">🔁 Reroll · 🪙30</button><button id="bPow">🎁 Random power · 🪙60</button></div><div class="btns"><button id="bClose">Close</button></div>`;modal(h);
 const pay=n=>{if(S.coins<n){toast('Not enough coins');sfx.bad();return false}S.coins-=n;save();updateCoins();sfx.buy();return true};
 $$('.shapeBtn').forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(!pay(piecePrice(k)))return;let slot=G.pieces.findIndex(p=>!p||!G.fits(p));if(slot<0)slot=G.pieces.reduce((bi,p,i)=>p&&G.pieces[bi]&&p.cells.length>G.pieces[bi].cells.length?i:bi,0);G.pieces[slot]=shape(k);dealAnim=true;done()});
 $('#bTime').onclick=()=>{if(pay(40)){G.addTime(20);done()}};$('#bRe').onclick=()=>{if(pay(30)){G.setPieces(()=>G.randPiece());done()}};$('#bPow').onclick=()=>{if(pay(60)){G.award();done()}};
 const done=()=>{closeModal();G.paused=wasPaused;render();checkStuck()};$('#bClose').onclick=done}
$('#btnBuyPiece').onclick=openPieceShop;
// ---------- timer loop ----------
let last=0,lastSec=-1;
function loop(t){requestAnimationFrame(loop);const dt=Math.min(100,t-(last||t));last=t;if(!G.running||G.over||G.paused)return;
 if(!G.active('freeze'))G.timeLeft-=dt*(G.active('slow')?.5:1);
 if(G.timeLeft<=0){if(G.flags.phoenix>0){G.flags.phoenix--;G.timeLeft=30000;toast('🐦‍🔥 Phoenix revive! +30s')}else{G.timeLeft=0;endGame("Time's up!")}}
 const s=Math.ceil(G.timeLeft/1000);$('#time').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');const tm=$('.timer');tm.classList.toggle('low',s<=30);tm.classList.toggle('frozen',G.active('freeze'));
 if(s!==lastSec){lastSec=s;if(s<=10)sfx.tick();renderEffects();if(hintCells.length&&G.now()>hintUntil)render()}}
requestAnimationFrame(loop);
// ---------- game lifecycle ----------
function newGame(){Object.assign(G,{grid:[...Array(N)].map(()=>Array(N).fill(-1)),score:0,streak:0,inv:[],flags:{},timers:{},timeLeft:GAME_MS,running:true,over:false,paused:false,history:null,coinsGame:0,linesTotal:0,targeting:null,rescue:false});
 G.pieces=[G.randPiece(),G.randPiece(),G.randPiece()];dealAnim=true;hideBanner();closeModal();
 const b=S.boosts;if(b.time){G.timeLeft+=30000;b.time--}if(b.power){b.power--;setTimeout(()=>G.award(),600)}if(b.shield){b.shield--;G.flags.shield=1}save();render();updateCoins()}
G.newGame=newGame;
function endGame(reason){if(G.over)return;G.over=true;G.running=false;hideBanner();sfx.bad();vib([60,60,120]);
 const bonus=Math.floor(G.score/100);S.coins+=bonus;G.coinsGame+=bonus;const isHigh=G.score>S.high;if(isHigh)S.high=G.score;save();
 S.queue.push({score:G.score,coins:G.coinsGame});save();flushQueue();
 modal(`<h2>${reason}</h2><div style="font-size:42px;font-weight:900">${G.score.toLocaleString()}</div>${isHigh?'<p style="color:#ffb830">🏆 NEW HIGH SCORE!</p>':`<p>Best: ${S.high.toLocaleString()}</p>`}<p>Lines cleared: ${G.linesTotal}<br>🪙 Coins earned: ${G.coinsGame} (incl. ${bonus} score bonus)</p><div class="btns"><button id="goAgain">▶ Play again</button><button id="goMenu">Menu</button></div>`);
 $('#goAgain').onclick=()=>{closeModal();go('game')};$('#goMenu').onclick=()=>{closeModal();go('menu')}}
G.endGame=endGame;
$('#btnPause').onclick=()=>{if(!G.running)return;G.paused=true;modal(`<h2>Paused</h2><div class="btns"><button id="pRes">▶ Resume</button><button id="pQuit">Quit to menu</button></div>`);$('#pRes').onclick=()=>{closeModal();G.paused=false};$('#pQuit').onclick=()=>{closeModal();G.running=false;go('menu')}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.running&&!G.over&&!G.paused)$('#btnPause').click()});
// ---------- screens + falling block transition ----------
let transiting=false;
function go(id,instant){if(transiting)return;const show=()=>{$$('.screen').forEach(s=>s.classList.toggle('active',s.id===id));onEnter(id)};
 if(instant||!S.anim){show();return}transiting=true;sfx.whoosh();
 const tr=$('#transition');const cols=8,sz=window.innerWidth/cols,rows=Math.ceil(window.innerHeight/sz);tr.style.gridTemplateColumns=`repeat(${cols},1fr)`;tr.style.gridAutoRows=sz+'px';tr.innerHTML='';tr.classList.add('on');
 const bs=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const b=document.createElement('div');b.className='tb in';b.style.setProperty('--c',COLORS[(Math.random()*COLORS.length)|0]);b.style.setProperty('--d',((rows-r)*45+Math.random()*120)+'ms');tr.appendChild(b);bs.push([b,r])}
 const tIn=rows*45+120+380;setTimeout(()=>{show();beep(140,.15,'triangle',.08);bs.forEach(([b,r])=>{b.className='tb out';b.style.setProperty('--d',((rows-r)*35+Math.random()*120)+'ms')});setTimeout(()=>{tr.innerHTML='';tr.classList.remove('on');transiting=false},rows*35+120+460)},tIn)}
G.go=go;
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
function onEnter(id){updateCoins();if(id==='game')newGame();if(id==='menu')renderMenu();if(id==='shop')renderShop();if(id==='codex')renderCodex();if(id==='leader')loadLB();if(id==='settings'){$('#setSound').checked=S.sound;$('#setAnim').checked=S.anim;$('#setVib').checked=S.vib;$('#setName').textContent=S.name||'-'}}
function updateCoins(){$('#mCoins').textContent=S.coins;$('#gCoins').textContent=S.coins;$$('.coinsLbl').forEach(e=>e.textContent=S.coins)}
function renderMenu(){$('#mHigh').textContent=S.high.toLocaleString();$('#mCodex').textContent=`(${Object.keys(S.seen).length}/100)`;updateCoins();if(!S.name)setTimeout(askName,400)}
// ---------- shop ----------
const LUCK_COST=[150,350,700,1200,2000];
function renderShop(){const L=S.luck;let h=`<div class="sec">LUCK UPGRADES (PERMANENT)</div>`;
 h+=`<div class="shopItem"><span class="em">🍀</span><div><b>Luck Tier ${L}/5</b><small>${L<5?`Tier ${L+1}: more Rare, Epic &amp; Legendary power-ups`:'Max luck reached!'}</small></div>${L<5?`<button data-buy="luck">🪙${LUCK_COST[L]}</button>`:''}</div>`;
 h+=`<div class="sec">NEXT-GAME BOOSTS</div>`;
 [['time','⏰','+30s head start','Start your next game with 5:30',60],['power','🎁','Starter power-up','Begin with a random power-up',80],['shield','🛡️','Starting Shield','Auto-reroll once if you get stuck',120]].forEach(([k,e,n,d,c])=>h+=`<div class="shopItem"><span class="em">${e}</span><div><b>${n}</b> <small>${d} · owned: ${S.boosts[k]||0}</small></div><button data-buy="${k}" data-c="${c}">🪙${c}</button></div>`);
 h+=`<div class="sec">IN-GAME</div><div class="shopItem"><span class="em">🧩</span><div><b>Emergency blocks</b><small>Tap 🧩 during a game (or when stuck) to buy any exact block shape, extra time, a reroll or a power-up.</small></div></div>`;
 $('#shopList').innerHTML=h;
 $$('[data-buy]').forEach(b=>b.onclick=()=>{const k=b.dataset.buy;const c=k==='luck'?LUCK_COST[S.luck]:+b.dataset.c;if(S.coins<c){toast('Not enough coins');sfx.bad();return}S.coins-=c;if(k==='luck')S.luck++;else S.boosts[k]=(S.boosts[k]||0)+1;save();sfx.buy();toast('Purchased!');renderShop();updateCoins()})}
function renderCodex(){const n=Object.keys(S.seen).length;$('#codexCount').textContent=n+'/100';$('#codexGrid').innerHTML=POWERS.map(p=>{const s=S.seen[p.id];return`<div class="cx r-${p.rarity}${s?'':' locked'}" data-id="${p.id}"><span class="em">${s?p.icon:'❓'}</span>${s?p.name:'???'}</div>`}).join('');
 $$('.cx').forEach(el=>el.onclick=()=>{const p=PW[el.dataset.id],s=S.seen[p.id];modal(`<div class="card r-${p.rarity}" style="animation:none;margin:auto"><span class="rar">${p.rarity.toUpperCase()}${p.passive?' · PASSIVE':''}</span><span class="em">${s?p.icon:'❓'}</span><h3>${s?p.name:'Not discovered'}</h3><p>${s?p.desc+'<br><br>Found ×'+s:'Clear lines to discover it.'}</p></div><div class="btns"><button onclick="G.closeModal()">Close</button></div>`)})}
// ---------- settings ----------
$('#setSound').onchange=e=>{S.sound=e.target.checked;save()};$('#setAnim').onchange=e=>{S.anim=e.target.checked;document.body.classList.toggle('no-anim',!S.anim);save()};$('#setVib').onchange=e=>{S.vib=e.target.checked;save()};
$('#btnRename').onclick=()=>askName(true);
$('#btnReset').onclick=()=>{modal(`<h2>Reset progress?</h2><p>Coins, high score, luck, codex and boosts will be wiped on this device.</p><div class="btns"><button class="danger" id="rY">Reset</button><button id="rN">Cancel</button></div>`);$('#rY').onclick=()=>{Object.assign(S,{coins:0,high:0,luck:0,seen:{},boosts:{}});save();closeModal();toast('Progress reset')};$('#rN').onclick=closeModal};
document.body.classList.toggle('no-anim',!S.anim);
// ---------- leaderboard (Supabase RPC) ----------
async function rpc(fn,args){const r=await fetch(`${SB_URL}/rest/v1/rpc/${fn}`,{method:'POST',headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY,'Content-Type':'application/json'},body:JSON.stringify(args)});if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
G.rpc=rpc;
function askName(change){modal(`<h2>${change?'Change username':'Choose a username'}</h2><p>Shown on the global leaderboard. 3–16 letters, numbers, spaces, _ or -.</p><input type="text" id="nmIn" maxlength="16" value="${S.name||''}" autocomplete="off"><p id="nmErr" style="color:#ff4d6d;min-height:1em"></p><div class="btns"><button id="nmOk">Save</button>${S.name||change?'<button id="nmX">Cancel</button>':'<button id="nmX">Later</button>'}</div>`);
 $('#nmX').onclick=closeModal;$('#nmOk').onclick=async()=>{const v=$('#nmIn').value.trim();if(!/^[A-Za-z0-9_ -]{3,16}$/.test(v)){$('#nmErr').textContent='3–16 characters: letters, numbers, space, _ or -';return}$('#nmErr').textContent='Checking…';
  try{const res=await rpc('register_username',{p_device_id:S.device,p_username:v});if(res==='ok'){S.name=v;save();closeModal();toast('Welcome, '+v+'!');flushQueue();$('#setName').textContent=v}else $('#nmErr').textContent=res==='taken'?'That name is taken – try another':'Invalid name'}catch(e){$('#nmErr').textContent='Offline – try again when connected'}}}
let flushing=false;
async function flushQueue(){if(flushing||!S.name||!S.queue.length||!navigator.onLine)return;flushing=true;try{while(S.queue.length){const q=S.queue[0];const res=await rpc('submit_score',{p_device_id:S.device,p_score:Math.min(q.score,2000000),p_coins:Math.min(q.coins,5000)});if(res==='unregistered'){await rpc('register_username',{p_device_id:S.device,p_username:S.name});continue}S.queue.shift();save()}}catch(e){}flushing=false}
window.addEventListener('online',flushQueue);
let lbKind='score';
$('#tabScore').onclick=()=>{lbKind='score';loadLB()};$('#tabCoins').onclick=()=>{lbKind='coins';loadLB()};
async function loadLB(){$('#tabScore').classList.toggle('on',lbKind==='score');$('#tabCoins').classList.toggle('on',lbKind==='coins');const L=$('#lbList');L.innerHTML='<p style="text-align:center;opacity:.6">Loading…</p>';await flushQueue();
 try{const [rows,me]=await Promise.all([rpc('leaderboard',{p_kind:lbKind}),rpc('my_rank',{p_device_id:S.device,p_kind:lbKind})]);const m=me[0];
  $('#myRank').innerHTML=m?`You: <b>#${m.rank}</b> · ${m.username} · ${lbKind==='score'?'🏆 '+m.best_score.toLocaleString():'🪙 '+Number(m.total_coins_earned).toLocaleString()}`:(S.name?'Play a game to get ranked':'<button id="lbName">Set a username to join</button>');if($('#lbName'))$('#lbName').onclick=()=>askName();
  L.innerHTML=rows.length?rows.map((r,i)=>`<div class="lb${m&&r.username===m.username?' me':''}"><span class="rk">${['🥇','🥈','🥉'][i]||'#'+(i+1)}</span><span class="nm">${r.username.replace(/[<>&]/g,'')}</span><b>${lbKind==='score'?r.best_score.toLocaleString():'🪙'+Number(r.total_coins_earned).toLocaleString()}</b></div>`).join(''):'<p style="text-align:center;opacity:.6">No scores yet – be the first!</p>'}
 catch(e){L.innerHTML='<p style="text-align:center;opacity:.6">📡 Offline – leaderboard unavailable. Your scores are queued and will upload when you reconnect.</p>'}}
// ---------- boot ----------
go('menu',true);flushQueue();
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
