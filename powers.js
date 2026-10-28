// 100 power-ups. t:true = needs a target cell; passive:true = auto-applies when won.
const N=8;
const inB=(r,c)=>r>=0&&c>=0&&r<N&&c<N;
const all=()=>{const a=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)a.push([r,c]);return a};
const filled=G=>all().filter(([r,c])=>G.grid[r][c]>=0);
const empty=G=>all().filter(([r,c])=>G.grid[r][c]<0);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const area=(r,c,rad)=>{const o=[];for(let i=-rad;i<=rad;i++)for(let j=-rad;j<=rad;j++)if(inB(r+i,c+j))o.push([r+i,c+j]);return o};
const rowC=r=>[...Array(N)].map((_,c)=>[r,c]);
const colC=c=>[...Array(N)].map((_,r)=>[r,c]);
const rowCount=(G,r)=>G.grid[r].filter(v=>v>=0).length;
const colCount=(G,c)=>G.grid.filter(row=>row[c]>=0).length;
const best=(arr,f)=>arr.reduce((b,x)=>f(x)>f(b)?x:b);
const idx=[...Array(N).keys()];
function gravity(G,dr,dc){ // slide all blocks toward a side
  const g=G.grid;
  for(let k=0;k<N;k++){
    const line=idx.map(i=>dr?[i,k]:[k,i]);
    if(dr>0||dc>0)line.reverse();
    const vals=line.map(([r,c])=>g[r][c]).filter(v=>v>=0);
    line.forEach(([r,c],i)=>g[r][c]=i<vals.length?vals[i]:-1);
  }
  G.after();
}
function transform(G,f){const o=G.grid.map(r=>r.slice());for(let r=0;r<N;r++)for(let c=0;c<N;c++){const[a,b]=f(r,c);G.grid[a][b]=o[r][c]}G.after()}
const P=[];
const add=(id,icon,name,rarity,desc,run,o={})=>P.push(Object.assign({id,icon,name,rarity,desc,run},o));
// --- Targeted destruction (20)
add('bomb','💣','Bomb','common','Blast a 3×3 area.',(G,r,c)=>G.clear(area(r,c,1)),{t:1});
add('megabomb','🧨','Mega Bomb','rare','Blast a 5×5 area.',(G,r,c)=>G.clear(area(r,c,2)),{t:1});
add('rowblast','➖','Row Blaster','common','Clear a whole row.',(G,r)=>G.clear(rowC(r)),{t:1});
add('colblast','➕','Column Blaster','common','Clear a whole column.',(G,r,c)=>G.clear(colC(c)),{t:1});
add('cross','✝️','Cross Strike','uncommon','Clear a row and column through a cell.',(G,r,c)=>G.clear([...rowC(r),...colC(c)]),{t:1});
add('laser','🔦','Diagonal Laser','uncommon','Clear both diagonals through a cell.',(G,r,c)=>G.clear(all().filter(([a,b])=>a-b===r-c||a+b===r+c)),{t:1});
add('zap','⚡','Zap','common','Delete a single block.',(G,r,c)=>G.clear([[r,c]]),{t:1});
add('ring','⭕','Ring Blast','common','Clear the 8 cells around a cell.',(G,r,c)=>G.clear(area(r,c,1).filter(([a,b])=>a!==r||b!==c)),{t:1});
add('colourwipe','🎨','Colour Wipe','uncommon','Clear every block of the tapped colour.',(G,r,c)=>{const v=G.grid[r][c];G.clear(v<0?[]:filled(G).filter(([a,b])=>G.grid[a][b]===v))},{t:1});
add('plus','🌟','Star Burst','uncommon','Clear a plus shape of radius 2.',(G,r,c)=>G.clear(all().filter(([a,b])=>(a===r&&Math.abs(b-c)<=2)||(b===c&&Math.abs(a-r)<=2))),{t:1});
add('xbomb','❌','X Bomb','uncommon','Clear an X shape of radius 2.',(G,r,c)=>G.clear(all().filter(([a,b])=>Math.abs(a-r)===Math.abs(b-c)&&Math.abs(a-r)<=2)),{t:1});
add('vortex','🌀','Vortex','rare','Clear a diamond of radius 2.',(G,r,c)=>G.clear(all().filter(([a,b])=>Math.abs(a-r)+Math.abs(b-c)<=2)),{t:1});
add('knight','♞','Knight Strike','common','Clear the cell and every knight-move cell from it.',(G,r,c)=>G.clear([[r,c],...[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].map(([a,b])=>[r+a,c+b]).filter(([a,b])=>inB(a,b))]),{t:1});
add('quadrant','🔲','Quadrant Purge','rare','Clear the 4×4 quarter containing a cell.',(G,r,c)=>{const R=r<4?0:4,C=c<4?0:4;G.clear(all().filter(([a,b])=>a>=R&&a<R+4&&b>=C&&b<C+4))},{t:1});
add('tworows','〰️','Twin Rows','uncommon','Clear the tapped row and the one below it.',(G,r)=>G.clear([...rowC(r),...rowC(Math.min(r+1,N-1)===r?r-1:r+1)]),{t:1});
add('twocols','⏸️','Twin Columns','uncommon','Clear the tapped column and the one beside it.',(G,r,c)=>G.clear([...colC(c),...colC(c+1<N?c+1:c-1)]),{t:1});
add('fillcell','🧱','Brick','common','Place a single block on any empty cell.',(G,r,c)=>{if(G.grid[r][c]<0)G.fill([[r,c]])},{t:1});
add('rowfill','📏','Row Completer','rare','Fill every gap in a row (it then clears!).',(G,r)=>G.fill(rowC(r).filter(([a,b])=>G.grid[a][b]<0)),{t:1});
add('colfill','📐','Column Completer','rare','Fill every gap in a column (it then clears!).',(G,r,c)=>G.fill(colC(c).filter(([a,b])=>G.grid[a][b]<0)),{t:1});
add('paint','🖌️','Paint Bucket','common','Recolour a connected group to gold and gain 10 pts per block.',(G,r,c)=>{const v=G.grid[r][c];if(v<0)return;const seen=new Set,st=[[r,c]];let n=0;while(st.length){const[a,b]=st.pop(),k=a*N+b;if(seen.has(k)||!inB(a,b)||G.grid[a][b]!==v)continue;seen.add(k);G.grid[a][b]=1;n++;st.push([a+1,b],[a-1,b],[a,b+1],[a,b-1])}G.addScore(n*10);G.after()},{t:1});
// --- Board-wide (27)
add('gravdown','⬇️','Gravity Down','uncommon','All blocks fall to the bottom.',G=>gravity(G,1,0));
add('gravup','⬆️','Anti-Gravity','uncommon','All blocks float to the top.',G=>gravity(G,-1,0));
add('gravleft','⬅️','West Wind','uncommon','All blocks slide left.',G=>gravity(G,0,-1));
add('gravright','➡️','East Wind','uncommon','All blocks slide right.',G=>gravity(G,0,1));
add('quake','🌋','Earthquake','common','Destroy 8 random blocks.',G=>G.clear(shuffle(filled(G)).slice(0,8)));
add('meteor','☄️','Meteor Shower','uncommon','Destroy 15 random blocks.',G=>G.clear(shuffle(filled(G)).slice(0,15)));
add('mirrorb','🪞','Mirror Board','common','Flip the board left-to-right.',G=>transform(G,(r,c)=>[r,N-1-c]));
add('flipb','🔃','Flip Board','common','Flip the board upside down.',G=>transform(G,(r,c)=>[N-1-r,c]));
add('rotb','🔄','Rotate Board','common','Rotate the whole board 90°.',G=>transform(G,(r,c)=>[c,N-1-r]));
add('shuffleb','🎲','Board Shuffle','uncommon','Scatter every block to random cells.',G=>{const v=filled(G).map(([r,c])=>G.grid[r][c]);all().forEach(([r,c])=>G.grid[r][c]=-1);shuffle(all()).slice(0,v.length).forEach(([r,c],i)=>G.grid[r][c]=v[i]);G.after()});
add('edge','🖼️','Edge Sweep','rare','Clear the whole outer border.',G=>G.clear(all().filter(([r,c])=>r%7===0||c%7===0)));
add('core','🎯','Core Purge','rare','Clear the centre 4×4.',G=>G.clear(all().filter(([r,c])=>r>1&&r<6&&c>1&&c<6)));
add('corners','📦','Corner Clean','uncommon','Clear all four 3×3 corners.',G=>G.clear(all().filter(([r,c])=>(r<3||r>4)&&(c<3||c>4))));
add('checker','🏁','Checkerboard','rare','Clear every other cell, chessboard style.',G=>G.clear(all().filter(([r,c])=>(r+c)%2===0)));
add('toprows','🔝','Sky Clear','uncommon','Clear the top 2 rows.',G=>G.clear([...rowC(0),...rowC(1)]));
add('botrows','🕳️','Floor Clear','uncommon','Clear the bottom 2 rows.',G=>G.clear([...rowC(6),...rowC(7)]));
add('lonely','🧹','Tidy Up','common','Remove blocks with no neighbours.',G=>G.clear(filled(G).filter(([r,c])=>![[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>inB(r+a,c+b)&&G.grid[r+a][c+b]>=0))));
add('majority','🌈','Majority Wipe','rare','Clear the most common colour.',G=>{const cnt={};filled(G).forEach(([r,c])=>cnt[G.grid[r][c]]=(cnt[G.grid[r][c]]||0)+1);const k=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];if(k!==undefined)G.clear(filled(G).filter(([r,c])=>G.grid[r][c]==k))});
add('unify','🦄','Unify','common','Turn every block the same colour (+5 pts each).',G=>{const f=filled(G);f.forEach(([r,c])=>G.grid[r][c]=4);G.addScore(f.length*5);G.after()});
add('fullrow','📊','Fullest Row','common','Clear the most filled row.',G=>G.clear(rowC(best(idx,r=>rowCount(G,r)))));
add('fullcol','📈','Fullest Column','common','Clear the most filled column.',G=>G.clear(colC(best(idx,c=>colCount(G,c)))));
add('holefill','🩹','Patch Holes','uncommon','Fill every empty cell that is boxed in.',G=>G.fill(empty(G).filter(([r,c])=>[[1,0],[-1,0],[0,1],[0,-1]].every(([a,b])=>!inB(r+a,c+b)||G.grid[r+a][c+b]>=0))));
add('randrow','🎳','Lucky Row','common','Clear a random non-empty row.',G=>{const o=idx.filter(r=>rowCount(G,r));if(o.length)G.clear(rowC(o[Math.random()*o.length|0]))});
add('randcol','🎟️','Lucky Column','common','Clear a random non-empty column.',G=>{const o=idx.filter(c=>colCount(G,c));if(o.length)G.clear(colC(o[Math.random()*o.length|0]))});
add('snap','🫰','The Snap','epic','Half of all blocks vanish.',G=>{const f=shuffle(filled(G));G.clear(f.slice(0,Math.ceil(f.length/2)))});
add('lightning','🌩️','Lightning','uncommon','Clear one random row and one random column.',G=>G.clear([...rowC(Math.random()*N|0),...colC(Math.random()*N|0)]));
add('diagpurge','✖️','Grand Diagonals','uncommon','Clear both corner-to-corner diagonals.',G=>G.clear(all().filter(([r,c])=>r===c||r+c===N-1)));
// --- Piece manipulation (15)
add('reroll','🔁','Reroll','common','Deal 3 brand new pieces.',G=>G.setPieces(()=>G.randPiece()));
add('rotp','↩️','Rotate Pieces','common','Rotate all offered pieces 90°.',G=>G.mapPieces(p=>G.rot(p)));
add('mirrorp','↔️','Mirror Pieces','common','Mirror all offered pieces.',G=>G.mapPieces(p=>G.mir(p)));
add('shrink','🔬','Shrink Ray','uncommon','Every offered piece loses a block.',G=>G.mapPieces(p=>p.cells.length>1?G.norm({cells:p.cells.slice(0,-1).filter((x,i,a)=>true),color:p.color}):p));
add('single','▪️','Pixel Deal','rare','Replace all pieces with single blocks.',G=>G.setPieces(()=>G.shape('1')));
add('domino','🁢','Domino Deal','uncommon','Replace all pieces with dominoes.',G=>G.setPieces(()=>G.shape(Math.random()<.5?'2h':'2v')));
add('mini','🐭','Mini Deal','common','Deal 3 pieces of 3 blocks or fewer.',G=>G.setPieces(()=>G.randPiece(3)));
add('refill','📥','Refill','common','Instantly refill used piece slots.',G=>G.setPieces((p)=>p||G.randPiece(),true));
add('lines','📍','Line Deal','uncommon','Deal three straight lines.',G=>G.setPieces(()=>G.shape(['3h','3v','4h','4v'][Math.random()*4|0])));
add('squares','🟦','Square Deal','common','Deal three 2×2 squares.',G=>G.setPieces(()=>G.shape('sq2')));
add('luckydeal','🍀','Lucky Deal','rare','Deal pieces that are guaranteed to fit.',G=>G.setPieces(()=>{for(let i=0;i<60;i++){const p=G.randPiece();if(G.fits(p))return p}return G.shape('1')}));
add('pocket','👝','Pocket Block','common','Swap the biggest piece for a single block.',G=>{let bi=-1;G.pieces.forEach((p,i)=>{if(p&&(bi<0||p.cells.length>G.pieces[bi].cells.length))bi=i});if(bi<0)bi=0;G.pieces[bi]=G.shape('1');G.after()});
add('wild','🃏','Wildcard','rare','Swap the hardest piece for the best-fitting one.',G=>{const bad=G.pieces.findIndex(p=>!p||!G.fits(p));const i=bad<0?0:bad;const opts=G.allShapes().filter(p=>G.fits(p)).sort((a,b)=>b.cells.length-a.cells.length);G.pieces[i]=opts[0]||G.shape('1');G.after()});
add('rainbowp','🎆','Prism Pieces','common','Pieces turn rainbow: +15 pts per block placed for 20s.',G=>G.timed('prism',20));
// --- Time (10)
add('t15','⏱️','+15 Seconds','common','Add 15 seconds.',G=>G.addTime(15));
add('t30','⏰','+30 Seconds','uncommon','Add 30 seconds.',G=>G.addTime(30));
add('t60','🕰️','+60 Seconds','rare','Add a full minute.',G=>G.addTime(60));
add('freeze10','🧊','Freeze 10s','common','Stop the clock for 10 seconds.',G=>G.timed('freeze',10));
add('freeze20','❄️','Deep Freeze','uncommon','Stop the clock for 20 seconds.',G=>G.timed('freeze',20));
add('freeze30','🥶','Ice Age','rare','Stop the clock for 30 seconds.',G=>G.timed('freeze',30));
add('slow','🐢','Slow Motion','common','Clock runs at half speed for 40s.',G=>G.timed('slow',40));
add('t45','⌛','Rewind Clock','uncommon','Add 45 seconds.',G=>G.addTime(45));
add('secondwind','💨','Second Wind','uncommon','+90s if under a minute left, otherwise +20s.',G=>G.addTime(G.timeLeft<60000?90:20));
add('chrono','🔮','Chrono Bank','rare','+1 second per block on the board.',G=>G.addTime(filled(G).length));
// --- Score (13)
add('x2','✌️','Double Points','common','x2 score for 30s.',G=>G.timed('x2',30));
add('x3','🔥','Triple Points','uncommon','x3 score for 20s.',G=>G.timed('x3',20));
add('x5','💥','Penta Points','epic','x5 score for 12s.',G=>G.timed('x5',12));
add('p500','💰','Cash Stack','common','+500 points.',G=>G.addScore(500,true));
add('p1000','💎','Gem Hoard','uncommon','+1000 points.',G=>G.addScore(1000,true));
add('jackpot','🎰','Jackpot','rare','+100 to 5000 random points.',G=>G.addScore(100+(Math.random()*4900|0),true));
add('x10next','🔟','Mega Clear','rare','Your next line clear scores x10.',G=>{G.flags.x10=1});
add('streak3','📶','Streak Boost','uncommon','+3 to your combo streak.',G=>{G.streak+=3;G.after()});
add('placebonus','🏗️','Builder Bonus','common','+10 pts per block placed for 30s.',G=>G.timed('builder',30));
add('cellscore','🧮','Block Tax','common','+20 pts per block on the board.',G=>G.addScore(filled(G).length*20,true));
add('interest','🏦','Interest','rare','+10% of your score.',G=>G.addScore(Math.floor(G.score*.1),true));
add('coins','🪙','Coin Purse','uncommon','+25 coins.',G=>G.addCoins(25));
add('coinrain','🤑','Coin Rain','epic','+100 coins.',G=>G.addCoins(100));
// --- Utility & specials (15)
add('undo','⏪','Undo','uncommon','Take back your last placement.',G=>G.undo());
add('ghost','👻','Ghost Placement','rare','Next piece can be placed over blocks (overwrites them).',G=>{G.flags.ghost=1;G.after()});
add('magnet','🧲','Magnet','uncommon','Auto-place a piece in its best spot.',G=>G.autoPlace());
add('autopilot','🤖','Autopilot','epic','Auto-place every placeable piece.',G=>{for(let i=0;i<3;i++)G.autoPlace()});
add('hint','💡','Hint','common','Highlight the best move for 6s.',G=>G.hint());
add('echo','🔊','Echo','rare','Copy a random power-up in your inventory.',G=>{const o=G.inv.filter(x=>x!=='echo');G.award(o.length?o[Math.random()*o.length|0]:'bomb',true)});
add('mystery','🎁','Mystery Box','uncommon','Triggers a random power-up instantly.',G=>{const o=P.filter(p=>!p.t&&!p.passive&&p.id!=='mystery'&&p.id!=='echo');G.run(o[Math.random()*o.length|0].id)});
add('overclock','🚀','Overclock','epic','Freeze the clock and x2 score for 15s.',G=>{G.timed('freeze',15);G.timed('x2',15)});
add('nova','☀️','Supernova','legendary','Clear the ENTIRE board.',G=>G.clear(filled(G)));
add('fortune','🏺','Fortune','legendary','Gain 3 random power-ups.',G=>{for(let i=0;i<3;i++)G.award(null,true)});
// passives
add('shield','🛡️','Shield','rare','Passive: if you get stuck, pieces are rerolled once.',G=>{G.flags.shield=(G.flags.shield||0)+1},{passive:1});
add('phoenix','🐦‍🔥','Phoenix','epic','Passive: when time runs out, revive with +30s once.',G=>{G.flags.phoenix=(G.flags.phoenix||0)+1},{passive:1});
add('charm','🧿','Lucky Charm','uncommon','Passive: next 3 power-ups are Rare or better.',G=>{G.flags.charm=(G.flags.charm||0)+3},{passive:1});
add('double','👯','Double Drop','rare','Passive: next line clear awards double power-ups.',G=>{G.flags.double=1},{passive:1});
add('chain','⛓️','Chain Reaction','rare','Passive: next line clear also clears a random extra row.',G=>{G.flags.chain=1},{passive:1});
add('golden','👑','Golden Touch','legendary','Passive: +50% score on all line clears for the rest of the game.',G=>{G.flags.golden=(G.flags.golden||0)+1},{passive:1});
window.POWERS=P;window.PW=Object.fromEntries(P.map(p=>[p.id,p]));
