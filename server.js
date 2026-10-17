const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DB_FILE = path.join(ROOT, 'data.json');

const games = ['Call of Duty','Free Fire','Fortnite','Tekken','Mortal Kombat','EA Sports FC','NBA 2K'];
function load(){ try{return JSON.parse(fs.readFileSync(DB_FILE,'utf8'));}catch{return {users:[],sessions:{},challenges:[],transactions:[],creatorEarnings:0,firstFour:0};} }
let db=load();
function save(){fs.writeFileSync(DB_FILE, JSON.stringify(db,null,2));}
function hash(p){return crypto.createHash('sha256').update(p).digest('hex');}
function token(){return crypto.randomBytes(24).toString('hex');}
function id(prefix){return prefix+'-'+crypto.randomBytes(3).toString('hex').toUpperCase();}
function json(res,status,obj){const body=JSON.stringify(obj);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET,POST,OPTIONS'});res.end(body);}
function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>s+=c);req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}})});}
function auth(req){const h=req.headers.authorization||'';const t=h.startsWith('Bearer ')?h.slice(7):null;const uid=t&&db.sessions[t];return uid?db.users.find(u=>u.id===uid):null;}
function safe(u){return {id:u.id,pseudo:u.pseudo,balance:u.balance,role:u.role,wins:u.wins,losses:u.losses,createdAt:u.createdAt};}
function addTx(userId,type,amount,meta={}){db.transactions.push({id:id('TX'),userId,type,amount,meta,createdAt:new Date().toISOString()});}
function grantWelcome(u){
  // Le compte créateur est distinct du programme des 4 premiers joueurs.
  if(db.users.length===0){u.role='creator';u.balance+=50000;addTx(u.id,'CREATOR_INITIAL',50000);}
  else {let bonus=10000; if(db.firstFour<4){bonus=30000;db.firstFour++;} u.balance+=bonus;addTx(u.id,'WELCOME',bonus);}
}
function route(req,res){
 if(req.method==='OPTIONS')return json(res,204,{});
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')) return api(req,res,url);
 let file=url.pathname==='/'?'/index.html':url.pathname; const fp=path.join(ROOT,file); if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory())return json(res,404,{error:'Not found'});
 const ext=path.extname(fp);const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'});fs.createReadStream(fp).pipe(res);
}
async function api(req,res,url){
 try{
  if(req.method==='POST'&&url.pathname==='/api/register'){
   const b=await body(req); if(!b.pseudo||!b.password||b.password.length<6)return json(res,400,{error:'Pseudo et mot de passe (6 caractères minimum) requis.'});
   if(db.users.some(u=>u.pseudo.toLowerCase()===b.pseudo.toLowerCase()))return json(res,409,{error:'Ce pseudo existe déjà.'});
   const u={id:id('USR'),pseudo:b.pseudo.trim(),password:hash(b.password),balance:0,role:'player',wins:0,losses:0,createdAt:new Date().toISOString(),lastDaily:null};grantWelcome(u);db.users.push(u);const t=token();db.sessions[t]=u.id;save();return json(res,201,{user:safe(u),token:t,message:'Compte créé.'});
  }
  if(req.method==='POST'&&url.pathname==='/api/login'){
   const b=await body(req);const u=db.users.find(x=>x.pseudo.toLowerCase()===String(b.pseudo||'').toLowerCase()&&x.password===hash(String(b.password||'')));if(!u)return json(res,401,{error:'Identifiants incorrects.'});const t=token();db.sessions[t]=u.id;save();return json(res,200,{user:safe(u),token:t});
  }
  const u=auth(req); if(!u)return json(res,401,{error:'Connexion requise.'});
  if(req.method==='GET'&&url.pathname==='/api/me')return json(res,200,{user:safe(u)});
  if(req.method==='POST'&&url.pathname==='/api/daily-bonus'){
   const today=new Date().toISOString().slice(0,10);if(u.lastDaily===today)return json(res,409,{error:'Bonus déjà récupéré aujourd’hui.',user:safe(u)});u.balance+=2000;u.lastDaily=today;addTx(u.id,'DAILY_BONUS',2000);save();return json(res,200,{user:safe(u),message:'2 000 PX ajoutés.'});
  }
  if(req.method==='GET'&&url.pathname==='/api/challenges')return json(res,200,{challenges:db.challenges.filter(c=>c.status==='OPEN').map(c=>({...c}))});
  if(req.method==='POST'&&url.pathname==='/api/challenges'){
   const b=await body(req);const stake=Number(b.stake);if(!games.includes(b.game)||!stake||stake<100)return json(res,400,{error:'Jeu ou mise invalide.'});if(u.balance<stake)return json(res,400,{error:'PX insuffisants.'});
   u.balance-=stake;const c={id:id('MATCH'),game:b.game,mode:b.mode||'1 VS 1',stake,creatorId:u.id,creator:u.pseudo,opponentId:null,opponent:null,pot:stake,status:'OPEN',privateCode:id('COD'),createdAt:new Date().toISOString()};db.challenges.unshift(c);addTx(u.id,'STAKE_LOCK',-stake,{matchId:c.id});save();return json(res,201,{user:safe(u),challenge:c});
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/challenges/')&&url.pathname.endsWith('/join')){
   const matchId=url.pathname.split('/')[3],c=db.challenges.find(x=>x.id===matchId);if(!c)return json(res,404,{error:'Match introuvable.'});if(c.creatorId===u.id)return json(res,400,{error:'Tu ne peux pas rejoindre ton propre défi.'});if(c.status!=='OPEN')return json(res,409,{error:'Ce défi n’est plus disponible.'});if(u.balance<c.stake)return json(res,400,{error:'PX insuffisants.'});u.balance-=c.stake;c.opponentId=u.id;c.opponent=u.pseudo;c.pot=c.stake*2;c.status='READY';addTx(u.id,'STAKE_LOCK',-c.stake,{matchId:c.id});save();return json(res,200,{user:safe(u),challenge:c});
  }
  if(req.method==='GET'&&url.pathname.startsWith('/api/challenges/')){
   const matchId=url.pathname.split('/')[3]; const c=db.challenges.find(x=>x.id===matchId);
   if(!c)return json(res,404,{error:'Match introuvable.'});
   if(c.creatorId!==u.id&&c.opponentId!==u.id)return json(res,403,{error:'Accès refusé.'});
   return json(res,200,{challenge:c,user:safe(u)});
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/challenges/')&&url.pathname.endsWith('/launch')){
   const matchId=url.pathname.split('/')[3],c=db.challenges.find(x=>x.id===matchId);if(!c)return json(res,404,{error:'Match introuvable.'});if(c.creatorId!==u.id&&c.opponentId!==u.id)return json(res,403,{error:'Accès refusé.'});if(c.status!=='READY')return json(res,409,{error:'Les deux joueurs doivent être présents.'});c.status='LIVE';c.startedAt=new Date().toISOString();save();return json(res,200,{challenge:c});
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/challenges/')&&url.pathname.endsWith('/result')){
   const matchId=url.pathname.split('/')[3],c=db.challenges.find(x=>x.id===matchId); if(!c)return json(res,404,{error:'Match introuvable.'});
   if(c.creatorId!==u.id&&c.opponentId!==u.id)return json(res,403,{error:'Accès refusé.'});
   if(c.status!=='LIVE')return json(res,409,{error:'Le match doit être en cours.'});
   const b=await body(req); const winnerId=b.winnerId;
   if(winnerId!==c.creatorId&&winnerId!==c.opponentId)return json(res,400,{error:'Gagnant invalide.'});
   c.result={winnerId,reportedBy:u.id,reportedAt:new Date().toISOString()}; c.status='RESULT_PENDING'; save();
   return json(res,200,{challenge:c,message:'Résultat enregistré. En attente de confirmation.'});
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/challenges/')&&url.pathname.endsWith('/dispute')){
   const matchId=url.pathname.split('/')[3],c=db.challenges.find(x=>x.id===matchId); if(!c)return json(res,404,{error:'Match introuvable.'});
   if(c.creatorId!==u.id&&c.opponentId!==u.id)return json(res,403,{error:'Accès refusé.'});
   if(c.status!=='RESULT_PENDING'||!c.result)return json(res,409,{error:'Le match ne peut pas être contesté maintenant.'});
   if(c.result.reportedBy===u.id)return json(res,409,{error:'Le joueur qui a déclaré le résultat ne peut pas le contester lui-même.'});
   const b=await body(req);
   if(c.dispute)return json(res,409,{error:'Ce match est déjà en litige.'});
   c.dispute={openedBy:u.id,reason:String(b.reason||'Résultat contesté').slice(0,1000),evidence:Array.isArray(b.evidence)?b.evidence.slice(0,5):[],openedAt:new Date().toISOString(),status:'OPEN'};
   c.status='DISPUTE'; save();
   return json(res,200,{challenge:c,message:'Litige ouvert. Les PX restent bloqués jusqu’à décision.'});
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/challenges/')&&url.pathname.endsWith('/evidence')){
   const matchId=url.pathname.split('/')[3],c=db.challenges.find(x=>x.id===matchId); if(!c)return json(res,404,{error:'Match introuvable.'});
   if(c.creatorId!==u.id&&c.opponentId!==u.id)return json(res,403,{error:'Accès refusé.'});
   const b=await body(req); const text=String(b.text||'').trim();
   if(!text)return json(res,400,{error:'Ajoute une description de la preuve.'});
   c.evidence=c.evidence||[]; c.evidence.push({id:id('EV'),userId:u.id,pseudo:u.pseudo,text:text.slice(0,1500),createdAt:new Date().toISOString()}); save();
   return json(res,200,{challenge:c,message:'Preuve ajoutée.'});
  }
  if(req.method==='GET'&&url.pathname==='/api/admin/disputes'){
   if(u.role!=='creator'&&u.role!=='admin')return json(res,403,{error:'Accès administrateur requis.'});
   return json(res,200,{disputes:db.challenges.filter(c=>c.status==='DISPUTE')});
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/admin/disputes/')&&url.pathname.endsWith('/resolve')){
   if(u.role!=='creator'&&u.role!=='admin')return json(res,403,{error:'Accès administrateur requis.'});
   const matchId=url.pathname.split('/')[4],c=db.challenges.find(x=>x.id===matchId); if(!c)return json(res,404,{error:'Match introuvable.'});
   if(c.status!=='DISPUTE')return json(res,409,{error:'Ce match n’est pas en litige.'});
   const b=await body(req),winnerId=b.winnerId;
   if(winnerId!=='CANCEL'&&winnerId!==c.creatorId&&winnerId!==c.opponentId)return json(res,400,{error:'Décision invalide.'});
   if(winnerId==='CANCEL'){
     for(const uid of [c.creatorId,c.opponentId]){const pl=db.users.find(x=>x.id===uid);if(pl){pl.balance+=c.stake;addTx(uid,'STAKE_REFUND',c.stake,{matchId:c.id,reason:'Litige annulé'});}}
     c.status='CANCELLED'; c.resolution={type:'CANCEL',by:u.id,at:new Date().toISOString()};
   } else {
     const winner=db.users.find(x=>x.id===winnerId); const loserId=winnerId===c.creatorId?c.opponentId:c.creatorId; const loser=db.users.find(x=>x.id===loserId);
     const fee=Math.round(c.pot*0.05),prize=c.pot-fee;
     if(winner){winner.balance+=prize;winner.wins++;addTx(winner.id,'MATCH_REWARD',prize,{matchId:c.id,pot:c.pot,fee,dispute:true});}
     if(loser){loser.losses++;}
     db.creatorEarnings=(db.creatorEarnings||0)+fee; c.status='FINISHED'; c.finishedAt=new Date().toISOString(); c.payout={winnerId,prize,creatorFee:fee,dispute:true}; c.resolution={type:'WINNER',by:u.id,at:new Date().toISOString()};
   }
   if(c.dispute)c.dispute.status='RESOLVED'; save(); return json(res,200,{challenge:c,message:'Litige résolu.'});
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/challenges/')&&url.pathname.endsWith('/confirm')){
   const matchId=url.pathname.split('/')[3],c=db.challenges.find(x=>x.id===matchId); if(!c)return json(res,404,{error:'Match introuvable.'});
   if(c.creatorId!==u.id&&c.opponentId!==u.id)return json(res,403,{error:'Accès refusé.'});
   if(c.status!=='RESULT_PENDING'||!c.result)return json(res,409,{error:'Aucun résultat à confirmer.'});
   if(c.result.reportedBy===u.id)return json(res,409,{error:'L’autre joueur doit confirmer le résultat.'});
   const winner=db.users.find(x=>x.id===c.result.winnerId); const loserId=c.result.winnerId===c.creatorId?c.opponentId:c.creatorId; const loser=db.users.find(x=>x.id===loserId);
   const fee=Math.round(c.pot*0.05); const prize=c.pot-fee;
   if(winner){winner.balance+=prize;winner.wins++;addTx(winner.id,'MATCH_REWARD',prize,{matchId:c.id,pot:c.pot,fee});}
   if(loser){loser.losses++;}
   db.creatorEarnings=(db.creatorEarnings||0)+fee; c.status='FINISHED'; c.finishedAt=new Date().toISOString(); c.payout={winnerId:c.result.winnerId,prize,creatorFee:fee}; save();
   return json(res,200,{challenge:c,user:safe(u),message:'Résultat confirmé et récompense distribuée.'});
  }
  if(req.method==='GET'&&url.pathname==='/api/transactions')return json(res,200,{transactions:db.transactions.filter(t=>t.userId===u.id).slice(-50).reverse()});
  return json(res,404,{error:'API introuvable.'});
 }catch(e){console.error(e);return json(res,500,{error:'Erreur serveur.'});}
}
if(!fs.existsSync(DB_FILE))save();
http.createServer(route).listen(PORT,()=>console.log(`PLAYBET backend: http://localhost:${PORT}`));
