const challenges = [
  {game:"Call of Duty", type:"FPS", mode:"1 VS 1 • BO3", stake:10000, players:"Dark_01 vs ?", color:"red"},
  {game:"Free Fire", type:"FPS", mode:"2 VS 2 • BO1", stake:5000, players:"KingCOD vs ?", color:"green"},
  {game:"Fortnite", type:"FPS", mode:"Solo • BO1", stake:15000, players:"Shadow vs ?", color:"violet"},
  {game:"Tekken", type:"Combat", mode:"1 VS 1 • BO3", stake:8000, players:"RyuX vs ?", color:"red"},
  {game:"Football", type:"Football", mode:"1 VS 1 • Match", stake:12000, players:"Pro_10 vs ?", color:"blue"},
  {game:"NBA", type:"Basket", mode:"1 VS 1 • Match", stake:7000, players:"Hoops23 vs ?", color:"yellow"}
];

const STORE_KEY = "playbet_rewards_demo_v1";
const savedState = (()=>{try{return JSON.parse(localStorage.getItem(STORE_KEY)||"{}")}catch(e){return {}}})();
let balance = Number.isFinite(savedState.balance) ? savedState.balance : 50000;
let creatorEarnings = Number.isFinite(savedState.creatorEarnings) ? savedState.creatorEarnings : 0;
let registeredUsers = Number.isFinite(savedState.registeredUsers) ? savedState.registeredUsers : 0;
let lastDailyClaim = savedState.lastDailyClaim || "";
function saveRewardState(){try{localStorage.setItem(STORE_KEY,JSON.stringify({balance,creatorEarnings,registeredUsers,lastDailyClaim}))}catch(e){}}
function updateWallet(){
  const small=document.getElementById("balance"), large=document.getElementById("balanceLarge");
  if(small)small.textContent=format(balance); if(large)large.textContent=format(balance);
  const earnings=document.getElementById("creatorEarnings"), count=document.getElementById("registeredCount");
  if(earnings)earnings.textContent=format(creatorEarnings)+" PX";
  if(count)count.textContent=Math.min(registeredUsers,4)+" / 4 premiers";
  const today=new Date().toISOString().slice(0,10), btn=document.getElementById("dailyBonusBtn"), msg=document.getElementById("dailyBonusMessage");
  if(btn&&msg){const claimed=lastDailyClaim===today;btn.disabled=claimed;btn.textContent=claimed?"✓ Bonus déjà récupéré aujourd'hui":"🎁 Récupérer mes 2 000 PX";msg.textContent=claimed?"Reviens demain pour ton prochain bonus.":"Ton bonus quotidien est prêt.";}
}
function claimDailyBonus(){
  const today=new Date().toISOString().slice(0,10);
  if(lastDailyClaim===today){alert("Tu as déjà récupéré ton bonus aujourd'hui.");return;}
  balance+=2000;lastDailyClaim=today;saveRewardState();updateWallet();alert("Bonus quotidien de 2 000 PX ajouté !");
}
function simulateNewUser(){
  registeredUsers++;
  const bonus=registeredUsers<=4?30000:10000;
  saveRewardState();updateWallet();
  alert("Inscription de démonstration n°"+registeredUsers+" : bonus simulé de "+format(bonus)+" PX. Ce bouton ne crée pas un vrai compte.");
}
function simulateReward(){
  const reward=10000, fee=Math.round(reward*0.05);
  creatorEarnings+=fee;balance+=fee;saveRewardState();updateWallet();
  alert("Récompense simulée : "+format(reward)+" PX. Part du créateur (5 %) : +"+format(fee)+" PX.");
}


function format(n){ return new Intl.NumberFormat("fr-FR").format(n); }

function renderChallenges(list=challenges){
  const grid=document.getElementById("challengeGrid");
  grid.innerHTML=list.map((c,i)=>`
    <article class="challenge">
      <div class="challenge-banner ${c.game==='Call of Duty'?'cod-banner':''}" ${c.game==='Call of Duty'?`style="background-image:linear-gradient(180deg,rgba(5,7,13,.08),rgba(5,7,13,.78)),url('assets/cod-mobile-playbet.png')"`:''}><span>${c.game}</span></div>
      <div class="challenge-body">
        <span class="tag">🟢 DISPONIBLE • ${c.type}</span>
        <h3>${c.mode}</h3>
        <div class="meta"><span>${c.players}</span><span class="px">${format(c.stake)} PX</span></div>
        <button class="btn btn-red" onclick="joinChallenge(${c.stake})">Rejoindre</button>
      </div>
    </article>`).join("");
}

function filterGame(type,btn){
  document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  renderChallenges(type==="Tous"?challenges:challenges.filter(c=>c.type===type));
}

function openModal(){document.getElementById("modal").classList.add("open")}
function closeModal(){document.getElementById("modal").classList.remove("open")}

function createChallenge(){
  const stake=Number(document.getElementById("stake").value);
  if(!stake || stake<100){alert("Choisis une mise d'au moins 100 PX.");return;}
  if(stake>balance){alert("Crédits insuffisants.");return;}
  balance-=stake;
  updateWallet();
  closeModal();
  alert("Défi créé en mode démo ! " + format(stake) + " PX ont été engagés.");
}

function joinChallenge(stake, game="Call of Duty", mode="1 VS 1 • BO3", creator="Dark_01"){
  if(stake>balance){alert("Crédits insuffisants pour rejoindre ce défi.");return;}
  balance-=stake;
  updateWallet();
  openMatchRoom({stake,game,mode,creator,opponent:"Vous"});
}


const games = [
  {name:"Call of Duty", icon:"🎯", type:"FPS", color:"red", image:"assets/cod-mobile-playbet.png", desc:"Combat tactique et affrontements rapides.", modes:["1 VS 1","2 VS 2","3 VS 3","4 VS 4"]},
  {name:"Free Fire", icon:"🔥", type:"Battle Royale", color:"green", desc:"Survie, duel et action mobile.", modes:["1 VS 1","2 VS 2","Squad","Battle Royale"]},
  {name:"Fortnite", icon:"🛡️", type:"Battle Royale", color:"violet", desc:"Construction, stratégie et élimination.", modes:["Solo","Duo","Squad","1 VS 1"]},
  {name:"Tekken", icon:"🥊", type:"Combat", color:"red", desc:"Duel de combattants en face-à-face.", modes:["1 VS 1","BO3","BO5","Tournoi"]},
  {name:"Mortal Kombat", icon:"⚔️", type:"Combat", color:"orange", desc:"Affrontements directs et compétitifs.", modes:["1 VS 1","BO3","BO5","Tournoi"]},
  {name:"EA Sports FC", icon:"⚽", type:"Football", color:"blue", desc:"Matchs de football entre joueurs.", modes:["1 VS 1","2 VS 2","Match","Tournoi"]},
  {name:"NBA 2K", icon:"🏀", type:"Basket", color:"cyan", desc:"Défis basket en face-à-face.", modes:["1 VS 1","2 VS 2","Match","Tournoi"]}
];

function renderGames(){
  const grid=document.getElementById("gamesGrid");
  if(!grid)return;
  grid.innerHTML=games.map((g,i)=>`
    <article class="game-card ${g.color}" onclick="openGameProfile(${i})">
      <div class="game-cover" ${g.image?`style="background-image:linear-gradient(180deg,rgba(5,7,13,.08),rgba(5,7,13,.9)),url('${g.image}')"`:``}><span class="game-icon">${g.image?"":""}${g.icon}</span><span class="game-badge">${g.type.toUpperCase()}</span></div>
      <div class="game-body"><h3>${g.name}</h3><p>${g.desc}</p><div class="game-actions"><span class="game-modes">${g.modes.slice(0,3).join(" • ")}</span><span class="game-arrow">›</span></div></div>
    </article>`).join("");
}
function openGameProfile(index){
  const g=games[index], box=document.getElementById("gameProfile");
  box.style.display="block";
  box.innerHTML=`<div class="game-profile-box">
    <div class="profile-visual game-card ${g.color}" ${g.image?`style="background-image:linear-gradient(180deg,rgba(5,7,13,.05),rgba(5,7,13,.9)),url('${g.image}')"`:``}><span class="big-icon">${g.image?"":""}${g.icon}</span><div><p class="eyebrow">FICHE DU JEU • ${g.type.toUpperCase()}</p><h2>${g.name}</h2><p>${g.desc}</p></div></div>
    <div class="profile-details"><p class="eyebrow">MODES DISPONIBLES</p><h3>Choisis ton format</h3><div class="mode-list">${g.modes.map(m=>`<div class="mode-chip"><b>${m}</b><span>Défis disponibles</span></div>`).join("")}</div><div class="profile-actions"><button class="btn btn-red" onclick="startGameChallenge('${g.name.replace(/'/g,"\\'")}')">⚔️ Créer un défi</button><button class="btn btn-outline" onclick="showGameChallenges('${g.name.replace(/'/g,"\\'")}')">🎮 Voir les défis</button></div></div>
  </div>`;
  box.scrollIntoView({behavior:"smooth",block:"start"});
}
function startGameChallenge(game){
  document.getElementById("game").value=game;
  openModal();
}
function showGameChallenges(game){
  const type=games.find(g=>g.name===game)?.type;
  document.getElementById("defis").scrollIntoView({behavior:"smooth"});
  setTimeout(()=>{
    const btn=[...document.querySelectorAll(".filter")].find(b=>b.textContent.trim()===type);
    if(btn)filterGame(type,btn); else renderChallenges(challenges.filter(c=>c.game===game));
  },400);
}
renderGames();

renderChallenges();
updateWallet();
function toggleMenu(){document.getElementById('mobileDrawer').classList.toggle('open');document.getElementById('drawerOverlay').classList.toggle('open')}
document.querySelectorAll('.mobile-tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.mobile-tab').forEach(x=>x.classList.remove('active'));tab.classList.add('active')}));

let countdownTimer=null;
function openMatchRoom(data={}){
  const matchGame = (data.game||"CALL OF DUTY").toUpperCase();
  document.getElementById("matchGame").textContent=matchGame;
  const matchVisual=document.getElementById("matchGameVisual");
  if(matchVisual){
    const isCOD=String(data.game||"Call of Duty").toLowerCase()==="call of duty";
    matchVisual.classList.toggle("cod-match-visual",isCOD);
    matchVisual.style.backgroundImage=isCOD?"linear-gradient(90deg,rgba(5,7,13,.18),rgba(5,7,13,.78)),url('assets/cod-mobile-playbet.png')":"";
  }
  document.getElementById("matchMode").textContent=data.mode||"1 VS 1 • BO3";
  document.getElementById("playerOne").textContent=data.creator||"Dark_01";
  document.getElementById("playerTwo").textContent=data.opponent||"Vous";
  document.getElementById("matchStake").textContent=format(data.stake||1000)+" PX";
  document.getElementById("matchPot").textContent=format((data.stake||1000)*2)+" PX";
  document.getElementById("matchCode").textContent="PX-"+Math.random().toString(36).substring(2,6).toUpperCase()+Math.floor(10+Math.random()*89);
  document.getElementById("matchStatus").textContent="EN ATTENTE";
  document.getElementById("matchProgress").textContent="En attente du lancement";
  document.getElementById("opponentState").textContent="PRÊT ✓";
  document.getElementById("countdown").textContent="--:--";
  const btn=document.getElementById("launchBtn"); btn.disabled=false; btn.textContent="⚡ Lancer la partie";
  document.getElementById("matchRoom").classList.add("open");
}
function closeMatchRoom(){
  clearInterval(countdownTimer); clearInterval(matchPoll);
  document.getElementById("matchRoom").classList.remove("open");
}
function launchMatch(){
  const btn=document.getElementById("launchBtn");
  btn.disabled=true; btn.textContent="MATCH EN COURS...";
  document.getElementById("matchStatus").textContent="LANCEMENT";
  document.getElementById("matchProgress").textContent="Préparation de la partie privée";
  let n=5; document.getElementById("countdown").textContent="00:0"+n;
  clearInterval(countdownTimer);
  countdownTimer=setInterval(()=>{
    n--; document.getElementById("countdown").textContent="00:0"+Math.max(n,0);
    if(n<=0){
      clearInterval(countdownTimer);
      document.getElementById("countdown").textContent="GO!";
      document.getElementById("matchStatus").textContent="EN COURS";
      document.getElementById("matchProgress").textContent="Les joueurs peuvent démarrer";
      btn.textContent="🎮 Partie lancée";
    }
  },1000);
}
function copyMatchCode(){
  const code=document.getElementById("matchCode").textContent;
  if(navigator.clipboard) navigator.clipboard.writeText(code);
  const b=document.querySelector(".match-code button"); const old=b.textContent; b.textContent="Copié ✓"; setTimeout(()=>b.textContent=old,1200);
}

// ===== PLAYBET BACKEND V4 =====
const API_BASE = '';
let apiToken = localStorage.getItem('playbet_token') || '';
let currentUser = null;
let authMode = 'login';
async function api(path, options={}){
  const headers={'Content-Type':'application/json',...(options.headers||{})};
  if(apiToken) headers.Authorization='Bearer '+apiToken;
  const r=await fetch(API_BASE+path,{...options,headers});
  const data=await r.json().catch(()=>({error:'Réponse serveur invalide.'}));
  if(!r.ok) throw new Error(data.error||'Erreur');
  return data;
}
function openAuth(){document.getElementById('authModal').classList.add('open');setAuthMode(currentUser?'login':'login');}
function closeAuth(){document.getElementById('authModal').classList.remove('open');}
function setAuthMode(mode){authMode=mode;document.getElementById('authTitle').textContent=mode==='login'?'Connexion':'Créer un compte';document.getElementById('authSubmit').textContent=mode==='login'?'Se connecter':'Créer mon compte';document.querySelectorAll('.auth-tabs button').forEach((b,i)=>b.classList.toggle('active',(mode==='login'?i===0:i===1)));document.getElementById('authMessage').textContent='';}
function setUser(u){currentUser=u;balance=u.balance;updateWallet();const b=document.getElementById('accountBtn');if(b)b.textContent=u.pseudo+' • '+format(u.balance)+' PX';}
async function submitAuth(){const pseudo=document.getElementById('authPseudo').value.trim(),password=document.getElementById('authPassword').value;const msg=document.getElementById('authMessage');try{const d=await api(authMode==='login'?'/api/login':'/api/register',{method:'POST',body:JSON.stringify({pseudo,password})});apiToken=d.token;localStorage.setItem('playbet_token',apiToken);setUser(d.user);msg.textContent=d.message||'OK';closeAuth();await loadServerChallenges();alert(authMode==='register'?'Bienvenue sur PLAYBET !':'Connexion réussie.');}catch(e){msg.textContent=e.message;}}
async function restoreSession(){if(!apiToken){openAuth();return false}try{const d=await api('/api/me');setUser(d.user);await loadServerChallenges();return true}catch{localStorage.removeItem('playbet_token');apiToken='';openAuth();return false}}
async function claimDailyBonus(){try{const d=await api('/api/daily-bonus',{method:'POST'});setUser(d.user);document.getElementById('dailyBonusMessage').textContent=d.message;document.getElementById('dailyBonusBtn').disabled=true;alert(d.message)}catch(e){alert(e.message)}}
async function createChallenge(){if(!currentUser){openAuth();return}const stake=Number(document.getElementById('stake').value),game=document.getElementById('game').value;const mode=document.querySelector('#modal select:nth-of-type(2)')?.value||'1 VS 1';try{const d=await api('/api/challenges',{method:'POST',body:JSON.stringify({game,mode,stake})});setUser(d.user);closeModal();await loadServerChallenges();openMatchRoom(d.challenge);startMatchPolling(d.challenge.id);alert('Défi créé : '+d.challenge.id+' • Code '+d.challenge.privateCode)}catch(e){alert(e.message)}}
async function joinServerChallenge(matchId){try{const d=await api('/api/challenges/'+matchId+'/join',{method:'POST'});setUser(d.user);await loadServerChallenges();openMatchRoom(d.challenge);startMatchPolling(d.challenge.id);alert('Match confirmé : '+d.challenge.id)}catch(e){alert(e.message)}}
async function launchServerMatch(matchId){try{const d=await api('/api/challenges/'+matchId+'/launch',{method:'POST'});document.getElementById('matchStatus').textContent='EN COURS';document.getElementById('matchProgress').textContent='Les joueurs peuvent démarrer';launchMatchVisualOnly();startMatchPolling(matchId)}catch(e){alert(e.message)}}
function launchMatchVisualOnly(){const btn=document.getElementById('launchBtn');btn.disabled=true;btn.textContent='MATCH EN COURS...';let n=5;document.getElementById('countdown').textContent='00:0'+n;clearInterval(countdownTimer);countdownTimer=setInterval(()=>{n--;document.getElementById('countdown').textContent='00:0'+Math.max(n,0);if(n<=0){clearInterval(countdownTimer);document.getElementById('countdown').textContent='GO!';btn.textContent='🎮 Partie lancée';}},1000)}
async function loadServerChallenges(){try{const d=await api('/api/challenges');const mapped=d.challenges.map(c=>({game:c.game,type:games.find(g=>g.name===c.game)?.type||'Gaming',mode:c.mode,stake:c.stake,players:c.creator+' vs '+(c.opponent||'?'),color:'red',serverId:c.id,server:c}));renderChallenges(mapped);window.serverChallenges=d.challenges}catch(e){console.warn(e.message)}}
// Override challenge card rendering with real server join actions when available.
const originalRenderChallenges=renderChallenges;
renderChallenges=function(list=challenges){const grid=document.getElementById('challengeGrid');if(!grid)return;grid.innerHTML=list.map(c=>`<article class="challenge"><div class="challenge-banner">${c.game}</div><div class="challenge-body"><span class="tag">${c.server?.status==='READY'?'🟡 CONFIRMÉ':'🟢 DISPONIBLE'} • ${c.type}</span><h3>${c.mode}</h3><div class="meta"><span>${c.players}</span><span class="px">${format(c.stake)} PX chacun</span></div><button class="btn btn-red" onclick="${c.serverId?`joinServerChallenge('${c.serverId}')`:`joinChallenge(${c.stake})`}">${c.serverId?'Rejoindre le match':'Rejoindre'}</button></div></article>`).join('')}
const originalOpenMatchRoom=openMatchRoom;
openMatchRoom=function(data={}){originalOpenMatchRoom(data);if(data.id||data.serverId){const c=data.id?data:window.serverChallenges?.find(x=>x.id===data.serverId||x.id===data.id);if(c){document.getElementById('matchGame').textContent=c.game.toUpperCase();document.getElementById('matchMode').textContent=c.mode;document.getElementById('playerOne').textContent=c.creator;document.getElementById('playerTwo').textContent=c.opponent||'En attente';document.getElementById('matchStake').textContent=format(c.stake)+' PX';document.getElementById('matchPot').textContent=format(c.pot)+' PX';document.getElementById('matchCode').textContent=c.privateCode;document.getElementById('launchBtn').onclick=()=>launchServerMatch(c.id);document.getElementById('opponentState').textContent=c.opponent?'PRÊT ✓':'EN ATTENTE';}}}
window.addEventListener('load',()=>restoreSession());


// ===== PLAYBET MATCH CENTER V5 =====
let activeMatchId=null;
let matchPoll=null;
function startMatchPolling(matchId){
  activeMatchId=matchId; clearInterval(matchPoll);
  refreshMatch(matchId); matchPoll=setInterval(()=>refreshMatch(matchId),2000);
}
async function refreshMatch(matchId){
  try{const d=await api('/api/challenges/'+matchId); const c=d.challenge;
    document.getElementById('matchGame').textContent=c.game.toUpperCase();
    document.getElementById('matchMode').textContent=c.mode;
    document.getElementById('playerOne').textContent=c.creator;
    document.getElementById('playerTwo').textContent=c.opponent||'En attente...';
    document.getElementById('matchStake').textContent=format(c.stake)+' PX';
    document.getElementById('matchPot').textContent=format(c.pot)+' PX';
    document.getElementById('matchCode').textContent=c.privateCode;
    document.getElementById('opponentState').textContent=c.opponent?'PRÊT ✓':'EN ATTENTE';
    const labels={OPEN:'EN ATTENTE',READY:'CONFIRMÉ',LIVE:'EN COURS',RESULT_PENDING:'RÉSULTAT À CONFIRMER',FINISHED:'TERMINÉ'};
    document.getElementById('matchStatus').textContent=labels[c.status]||c.status;
    document.getElementById('matchProgress').textContent=c.status==='OPEN'?'En attente du deuxième joueur':c.status==='READY'?'Les deux joueurs sont prêts':c.status==='LIVE'?'Partie en cours':c.status==='RESULT_PENDING'?'Résultat en attente de confirmation':'Match terminé';
    const launch=document.getElementById('launchBtn');
    launch.disabled=!(c.status==='READY' && (c.creatorId===currentUser?.id));
    launch.textContent=c.status==='LIVE'?'🎮 Partie en cours':c.status==='FINISHED'?'✓ Match terminé':'⚡ Lancer la partie';
    if(c.status==='RESULT_PENDING' && c.result && c.result.reportedBy!==currentUser?.id){
      launch.disabled=false; launch.textContent='🏆 Confirmer le résultat'; launch.onclick=()=>confirmServerResult(c.id);
    } else if(c.status==='READY'){ launch.onclick=()=>launchServerMatch(c.id); }
    if(c.status==='LIVE' && currentUser){
      launch.disabled=false; launch.textContent='🏆 Déclarer le résultat'; launch.onclick=()=>promptResult(c);
    }
  }catch(e){console.warn(e.message)}
}
function promptResult(c){
  const winner=prompt('Entre le pseudo du gagnant :\n'+c.creator+'\n'+c.opponent);
  if(!winner)return; const winnerId=winner.trim().toLowerCase()===c.creator.toLowerCase()?c.creatorId:winner.trim().toLowerCase()===c.opponent.toLowerCase()?c.opponentId:null;
  if(!winnerId)return alert('Pseudo non reconnu.'); submitServerResult(c.id,winnerId);
}
async function submitServerResult(matchId,winnerId){try{const d=await api('/api/challenges/'+matchId+'/result',{method:'POST',body:JSON.stringify({winnerId})});alert(d.message);await refreshMatch(matchId)}catch(e){alert(e.message)}}
async function confirmServerResult(matchId){try{const d=await api('/api/challenges/'+matchId+'/confirm',{method:'POST'});setUser(d.user);alert(d.message);await refreshMatch(matchId);await loadServerChallenges()}catch(e){alert(e.message)}}

// ===== PLAYBET V6 : RESULTATS, PREUVES & LITIGES =====
function showResultPanel(show=true){const p=document.getElementById('resultPanel');if(p)p.style.display=show?'block':'none';}
function setResultButtonNames(c){
  const b1=document.getElementById('winnerOneBtn'),b2=document.getElementById('winnerTwoBtn');
  if(b1)b1.textContent='🏆 '+c.creator+' gagne';
  if(b2)b2.textContent='🏆 '+(c.opponent||'Joueur 2')+' gagne';
}
async function declareWinnerFromUI(side){
  if(!activeMatchId)return;
  const d=await api('/api/challenges/'+activeMatchId); const c=d.challenge;
  const winnerId=side==='creator'?c.creatorId:c.opponentId;
  if(!winnerId)return alert('Le deuxième joueur n’est pas encore présent.');
  await submitServerResult(activeMatchId,winnerId);
}
async function addEvidenceUI(){
  if(!activeMatchId)return;
  const el=document.getElementById('evidenceText'),text=(el?.value||'').trim();
  if(!text)return alert('Décris la preuve avant de l’ajouter.');
  try{const d=await api('/api/challenges/'+activeMatchId+'/evidence',{method:'POST',body:JSON.stringify({text})});el.value='';alert(d.message);await refreshMatch(activeMatchId);}catch(e){alert(e.message)}
}
async function openDisputeUI(){
  if(!activeMatchId)return;
  const reason=prompt('Pourquoi contestes-tu le résultat ?'); if(!reason)return;
  try{const evidenceText=(document.getElementById('evidenceText')?.value||'').trim();const d=await api('/api/challenges/'+activeMatchId+'/dispute',{method:'POST',body:JSON.stringify({reason,evidence:evidenceText?[evidenceText]:[]})});alert(d.message);await refreshMatch(activeMatchId);}catch(e){alert(e.message)}
}

const refreshMatchV6=refreshMatch;
refreshMatch=async function(matchId){
  await refreshMatchV6(matchId);
  try{
    const d=await api('/api/challenges/'+matchId),c=d.challenge;
    setResultButtonNames(c);
    const panel=document.getElementById('resultPanel'),state=document.getElementById('resultState'),help=document.getElementById('resultHelp'),dispute=document.getElementById('disputeBox');
    if(!panel)return;
    showResultPanel(['LIVE','RESULT_PENDING','DISPUTE','FINISHED','CANCELLED'].includes(c.status));
    if(c.status==='LIVE'){
      state.textContent='PARTIE EN COURS'; help.textContent='Quand la partie est terminée, déclare le joueur gagnant.'; dispute.style.display='none';
    } else if(c.status==='RESULT_PENDING'){
      const mine=c.result?.reportedBy===currentUser?.id;
      state.textContent=mine?'EN ATTENTE':'À CONFIRMER'; help.textContent=mine?'Ton résultat a été envoyé. L’autre joueur doit confirmer ou contester.':'Vérifie le résultat puis confirme ou conteste.'; dispute.style.display=mine?'none':'block';
      document.getElementById('winnerOneBtn').disabled=true;document.getElementById('winnerTwoBtn').disabled=true;
    } else if(c.status==='DISPUTE'){
      state.textContent='🚨 LITIGE'; help.textContent='Les PX restent bloqués. Un administrateur doit prendre une décision.'; dispute.style.display='none';
      document.getElementById('winnerOneBtn').disabled=true;document.getElementById('winnerTwoBtn').disabled=true;
    } else if(c.status==='FINISHED'){
      state.textContent='TERMINÉ'; help.textContent=c.payout?'Récompense distribuée : '+format(c.payout.prize)+' PX.':'Match terminé.'; dispute.style.display='none';
      document.getElementById('winnerOneBtn').disabled=true;document.getElementById('winnerTwoBtn').disabled=true;
    } else if(c.status==='CANCELLED'){
      state.textContent='ANNULÉ'; help.textContent='Les mises ont été remboursées.'; dispute.style.display='none';
    }
  }catch(e){console.warn(e.message)}
};

function openAdminPanel(){document.getElementById('adminPanel').style.display='grid';loadAdminDisputes();}
function closeAdminPanel(){document.getElementById('adminPanel').style.display='none';}
async function loadAdminDisputes(){
  const box=document.getElementById('adminDisputes'); if(!box)return;
  try{const d=await api('/api/admin/disputes');
    if(!d.disputes.length){box.innerHTML='<p class="result-help">Aucun litige ouvert.</p>';return;}
    box.innerHTML=d.disputes.map(c=>`<article class="dispute-card"><h3>${c.game} • ${c.id}</h3><p><b>${c.creator}</b> 🆚 <b>${c.opponent}</b> — pot ${format(c.pot)} PX</p><p>Résultat déclaré : <b>${c.result?.winnerId===c.creatorId?c.creator:c.opponent}</b></p><p>Motif : ${escapeHtml(c.dispute?.reason||'Non précisé')}</p>${(c.evidence||[]).map(e=>`<div class="evidence-item">${escapeHtml(e.pseudo)} : ${escapeHtml(e.text)}</div>`).join('')}<div class="admin-actions"><button class="btn btn-red" onclick="resolveDispute('${c.id}','${c.creatorId}')">🏆 Donner à ${escapeAttr(c.creator)}</button><button class="btn btn-outline" onclick="resolveDispute('${c.id}','${c.opponentId}')">🏆 Donner à ${escapeAttr(c.opponent)}</button><button class="btn btn-outline" onclick="resolveDispute('${c.id}','CANCEL')">↩️ Annuler / rembourser</button></div></article>`).join('');
  }catch(e){box.innerHTML='<p class="result-help">'+escapeHtml(e.message)+'</p>';}
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function escapeAttr(s){return escapeHtml(s).replace(/`/g,'&#96;');}
async function resolveDispute(matchId,winnerId){try{const d=await api('/api/admin/disputes/'+matchId+'/resolve',{method:'POST',body:JSON.stringify({winnerId})});alert(d.message);await loadAdminDisputes();if(activeMatchId===matchId)await refreshMatch(matchId);await restoreSession();}catch(e){alert(e.message)}}

// Ajoute un accès administrateur au compte créateur.
const oldSetUserV6=setUser;
setUser=function(u){oldSetUserV6(u);const existing=document.getElementById('adminOpenBtn');if(u&&(u.role==='creator'||u.role==='admin')){if(!existing){const b=document.createElement('button');b.id='adminOpenBtn';b.className='btn btn-outline';b.textContent='🛡️ Litiges';b.onclick=openAdminPanel;document.querySelector('.top-actions')?.appendChild(b);}}else existing?.remove();};
