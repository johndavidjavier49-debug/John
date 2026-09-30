const CATS=[["quiz","Quiz","Short quizzes I have taken."],["longquiz","Long Quiz","Longer quizzes covering full lessons."],["midterms","Midterms","Midterm exams and results."],["finals","Finals","Final exams and results."],["activity","Activity","Classroom and take-home activities."],["project","Project","Projects I built and presented."]];
const $=s=>document.querySelector(s);
/* ---------- storage (IndexedDB, memory fallback) ---------- */
let db=null;const mem={files:[],meta:{}};
function open(){return new Promise(r=>{try{const q=indexedDB.open("portfolio",1);
q.onupgradeneeded=()=>{q.result.createObjectStore("files",{keyPath:"id"});q.result.createObjectStore("meta")};
q.onsuccess=()=>{db=q.result;r()};q.onerror=()=>r()}catch(e){r()}})}
const tx=(s,m="readonly")=>db.transaction(s,m).objectStore(s);
const req=q=>new Promise((res,rej)=>{q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
async function allFiles(){try{return db?await req(tx("files").getAll()):mem.files}catch(e){return mem.files}}
async function putFile(f){try{db?await req(tx("files","readwrite").put(f)):mem.files.push(f)}catch(e){mem.files.push(f)}}
async function delFile(id){try{db?await req(tx("files","readwrite").delete(id)):mem.files=mem.files.filter(f=>f.id!==id)}catch(e){}}
async function setMeta(k,v){try{db?await req(tx("meta","readwrite").put(v,k)):mem.meta[k]=v}catch(e){mem.meta[k]=v}}
async function getMeta(k){try{return db?await req(tx("meta").get(k)):mem.meta[k]}catch(e){return mem.meta[k]}}
/* ---------- build sections + nav ---------- */
const host=$("#sections"),menu=$("#menu");
CATS.forEach(([id,title,desc])=>{
menu.insertAdjacentHTML("beforeend",`<li><a href="#${id}">${title}</a></li>`);
host.insertAdjacentHTML("beforeend",`<section class="blk rv" id="${id}"><h2>${title}</h2><p class="sub">${desc}</p>
<label class="drop" data-c="${id}"><input type="file" multiple hidden><div><b>Upload pictures or files</b><br>Drag and drop here or click to choose. You can add many at once.</div></label>
<div class="grid" id="g-${id}"></div></section>`)});
const size=n=>n>1e6?(n/1e6).toFixed(1)+" MB":Math.max(1,Math.round(n/1e3))+" KB";
const urls=[];
async function render(){
urls.forEach(URL.revokeObjectURL);urls.length=0;
const files=pub()?SITE.files.map((x,i)=>({...x,id:i,cloud:true,pub:true,url:x.path})):[...await allFiles(),...await cloudFiles()].sort((a,b)=>a.id-b.id);
CATS.forEach(([id])=>{
const g=$("#g-"+id),list=files.filter(f=>f.cat===id);g.innerHTML="";
if(!list.length){g.innerHTML='<p class="empty">Nothing here yet. Upload your first file.</p>';return}
list.forEach((f,i)=>{
const u=f.cloud?f.url:URL.createObjectURL(f.blob);if(!f.cloud)urls.push(u);
const img=f.type.startsWith("image/");
const ext=(f.name.split(".").pop()||"file").slice(0,4).toUpperCase();
const el=document.createElement("div");el.className="item";el.style.setProperty("--i",i);
el.innerHTML=`<div class="thumb">${img?`<img src="${u}" alt="">`:`<span class="ext">${ext}</span>`}</div>
<div class="meta"><div title="${f.name.replace(/"/g,"")}">${f.name.replace(/</g,"&lt;")}</div><small>${size(f.size)}${f.pub?"":", "+(f.cloud?"saved online":"this device only")}</small></div>
<div class="acts">${img?'<button class="view">View</button>':`<a href="${u}" target="_blank" rel="noopener">Open</a>`}<a href="${u}" download="${f.name.replace(/"/g,"")}">Save</a><button class="del">Delete</button></div>`;
if(img)el.querySelector(".thumb").onclick=el.querySelector(".view").onclick=()=>{$("#lb img").src=u;$("#lb").classList.add("show")};
el.querySelector(".del").onclick=async()=>{if(confirm("Delete this file?")){f.cloud?await delCloud(f):await delFile(f.id);render()}};
g.appendChild(el)})});stats(files)}
function stats(f){[["s1",f.length],["s2",f.filter(x=>x.type.startsWith("image/")).length],["s3",f.filter(x=>!x.type.startsWith("image/")).length]].forEach(([id,to])=>{const el=$("#"+id),from=+el.textContent,t0=performance.now();(function s(t){const k=Math.min(1,(t-t0)/800);el.textContent=Math.round(from+(to-from)*k);if(k<1)requestAnimationFrame(s)})(t0)})}
let tt;function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("show"),2200)}
const TXT={csv:"text/csv",md:"text/markdown",json:"application/json",txt:"text/plain"};
const uptype=f=>{const t=TXT[f.name.split(".").pop().toLowerCase()];return t?{type:t}:undefined};
const rec=(id,cat,f)=>({id,cat,name:f.name,type:f.type||"",size:f.size});
async function cloudFiles(){if(!cdb)return[];try{const q=await cdb.collection("files").get();return q.docs.map(d=>d.data()).filter(Boolean).map(d=>({...d,cloud:true,url:"/_blob/"+d.asset}))}catch(e){return[]}}
async function delCloud(f){try{await cdb.doc("files/"+f.id).delete();if(cas)await cas.delete(f.asset)}catch(e){}}
async function add(cat,files){
let n=0,local=0;
for(const f of files){const id=Date.now()*1000+(n++)+Math.floor(Math.random()*500);let ok=false;
if(cdb&&cas){try{const a=await cas.upload(f,uptype(f));await cdb.doc("files/"+id).set({...rec(id,cat,f),asset:a.id});ok=true}catch(e){}}
if(!ok){local++;await putFile({...rec(id,cat,f),blob:f})}}
await render();
toast(local?local+(local>1?" files":" file")+" saved on this device only. Convert Word, PowerPoint or Excel files to PDF to save online.":files.length+(files.length>1?" files":" file")+" saved online")}
document.querySelectorAll(".drop").forEach(d=>{
const inp=d.querySelector("input"),c=d.dataset.c;
inp.onchange=()=>{add(c,[...inp.files]);inp.value=""};
["dragenter","dragover"].forEach(e=>d.addEventListener(e,x=>{x.preventDefault();d.classList.add("over")}));
["dragleave","drop"].forEach(e=>d.addEventListener(e,x=>{x.preventDefault();d.classList.remove("over")}));
d.addEventListener("drop",x=>add(c,[...x.dataTransfer.files]))});
$("#lb").onclick=()=>$("#lb").classList.remove("show");
addEventListener("keydown",e=>{if(e.key==="Escape")$("#lb").classList.remove("show")});
/* ---------- profile photo + editable text ---------- */
function setPic(u){const p=$("#pic");p.querySelector("img")?.remove();const i=document.createElement("img");i.alt="Profile photo";i.src=u;p.appendChild(i)}
async function showPic(){const b=await getMeta("pic");if(b)setPic(URL.createObjectURL(b))}
/* ---------- permanent cloud save (db + assets), local copy kept as backup ---------- */
let cdb=null,cas=null,prof={},pt;
const pref=()=>cdb.doc("profile/main");
function saveProf(k,v){prof[k]=v;if(!cdb)return;clearTimeout(pt);pt=setTimeout(()=>pref().set(prof).then(()=>toast("Profile saved")).catch(()=>toast("Could not save online. Kept on this device.")),700)}
async function cloud(){try{
if(!window.claude)return;
cdb=await claude.use("db");cas=await claude.use("assets");if(!cdb)return;
const s=await pref().get();
if(s.exists){prof={...s.data()};
document.querySelectorAll("[data-k]").forEach(el=>{if(prof[el.dataset.k])el.textContent=prof[el.dataset.k]});
if(prof.pic)setPic("/_blob/"+prof.pic)}
else{document.querySelectorAll("[data-k]").forEach(el=>prof[el.dataset.k]=el.textContent);
const b=await getMeta("pic");if(b&&cas){const a=await cas.upload(b);prof.pic=a.id}
await pref().set(prof);toast("Profile saved online")}
if(cas){for(const f of await allFiles()){if(!f.blob)continue;try{const a=await cas.upload(f.blob,uptype(f));await cdb.doc("files/"+f.id).set({...rec(f.id,f.cat,f),asset:a.id});await delFile(f.id)}catch(x){}}}
render()
}catch(e){console.warn("Cloud save unavailable",e)}}
$("#picIn").onchange=async e=>{const f=e.target.files[0];if(!f)return;await setMeta("pic",f);setPic(URL.createObjectURL(f));
if(cdb&&cas){try{const a=await cas.upload(f);saveProf("pic",a.id)}catch(x){toast("Photo kept on this device only")}}};
$("#pic").onkeydown=e=>{if(e.key==="Enter")$("#picIn").click()};
document.querySelectorAll("[data-k]").forEach(el=>{
el.addEventListener("input",()=>{setMeta("t-"+el.dataset.k,el.textContent);saveProf(el.dataset.k,el.textContent)});
el.addEventListener("keydown",e=>{if(e.key==="Enter"&&el.tagName!=="P"){e.preventDefault();el.blur()}})});
async function loadText(){for(const el of document.querySelectorAll("[data-k]")){const v=await getMeta("t-"+el.dataset.k);if(v)el.textContent=v}}
/* ---------- animation: typing, particles, reveal, active nav ---------- */
const words=["I build things for the web.","I keep every quiz, exam and project here.","Welcome to my portfolio."];
let wi=0,ci=0,del=false;
(function tick(){const t=$("#type"),w=words[wi];t.textContent=w.slice(0,ci);
if(!del&&ci===w.length){del=true;return setTimeout(tick,1600)}
if(del&&ci===0){del=false;wi=(wi+1)%words.length}
ci+=del?-1:1;setTimeout(tick,del?25:55)})();
const cv=$("#fx"),cx=cv.getContext("2d");let P=[],mx=-999,my=-999;
function size2(){cv.width=cv.offsetWidth;cv.height=cv.offsetHeight;P=Array.from({length:Math.min(70,cv.width/16)},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5,r:Math.random()*2+1}))}
size2();addEventListener("resize",size2);
const still=matchMedia("(prefers-reduced-motion:reduce)").matches;
(function loop(){cx.clearRect(0,0,cv.width,cv.height);const R=cv.getBoundingClientRect();
P.forEach((p,i)=>{if(!still){p.x+=p.vx;p.y+=p.vy}
const dx=p.x-(mx-R.left),dy=p.y-(my-R.top),dd=Math.hypot(dx,dy);
if(dd>0&&dd<160){if(!still&&dd<110){p.x+=dx/dd*1.5;p.y+=dy/dd*1.5}cx.strokeStyle="rgba(76,201,255,"+(1-dd/160)+")";cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(mx-R.left,my-R.top);cx.stroke()}
if(p.x<0||p.x>cv.width)p.vx*=-1;if(p.y<0||p.y>cv.height)p.vy*=-1;
cx.fillStyle="#4cc9ff";cx.beginPath();cx.arc(p.x,p.y,p.r,0,7);cx.fill();
for(let j=i+1;j<P.length;j++){const d=Math.hypot(p.x-P[j].x,p.y-P[j].y);
if(d<120){cx.strokeStyle=`rgba(47,107,255,${1-d/120})`;cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(P[j].x,P[j].y);cx.stroke()}}});
requestAnimationFrame(loop)})();
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("in")}),{threshold:.08});
document.querySelectorAll(".rv").forEach(s=>io.observe(s));
const links=[...menu.querySelectorAll("a")];
const so=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+e.target.id))}),{rootMargin:"-45% 0px -50% 0px"});
document.querySelectorAll("header,section").forEach(s=>so.observe(s));
addEventListener("scroll",()=>{$("#bar").style.width=scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)*100+"%"},{passive:true});
addEventListener("pointermove",e=>{mx=e.clientX;my=e.clientY;const g=$("#glow");g.style.left=mx+"px";g.style.top=my+"px"});
host.addEventListener("pointermove",e=>{const it=e.target.closest(".item");if(!it)return;const b=it.getBoundingClientRect();it.style.setProperty("--ry",((e.clientX-b.left)/b.width-.5)*14+"deg");it.style.setProperty("--rx",-((e.clientY-b.top)/b.height-.5)*14+"deg")});
host.addEventListener("mouseout",e=>{const it=e.target.closest(".item");if(it&&!it.contains(e.relatedTarget)){it.style.setProperty("--rx","0deg");it.style.setProperty("--ry","0deg")}});
/* ---------- public site mode: visitors see content.json + uploads/ read-only ---------- */
let SITE=null;
const pub=()=>SITE&&!/[?&]admin/.test(location.search);
async function loadSite(){try{const r=await fetch("content.json",{cache:"no-store"});if(r.ok)SITE=await r.json()}catch(e){}}
function applyPub(){document.body.classList.add("pub");const p=SITE.profile||{};
document.querySelectorAll("[data-k]").forEach(el=>{if(p[el.dataset.k])el.textContent=p[el.dataset.k];el.removeAttribute("contenteditable")});
if(p.pic)setPic(p.pic);else{$("#pic").style.display="none";$(".about").style.gridTemplateColumns="1fr"}}
$("#exp").onclick=async()=>{
if(!window.JSZip)return toast("Export needs an internet connection");
const z=new JSZip(),up=z.folder("uploads"),out=[],profile={};
for(const f of (await allFiles()).sort((a,b)=>a.id-b.id)){const nm=f.id+"-"+f.name.replace(/[^\w.\-]+/g,"_");up.file(nm,f.blob);out.push({cat:f.cat,name:f.name,type:f.type,size:f.size,path:"uploads/"+nm})}
document.querySelectorAll("[data-k]").forEach(el=>profile[el.dataset.k]=el.textContent);
const pic=await getMeta("pic");if(pic){const n="profile-photo."+((pic.type.split("/")[1]||"jpg").replace("jpeg","jpg"));up.file(n,pic);profile.pic="uploads/"+n}
z.file("content.json",JSON.stringify({profile,files:out},null,1));
const a=document.createElement("a");a.href=URL.createObjectURL(await z.generateAsync({type:"blob"}));a.download="portfolio-content.zip";a.click();
toast("Exported. Unzip it next to index.html, then publish the folder.")};
Promise.all([open(),loadSite()]).then(async()=>{if(pub()){applyPub();render();return}await loadText();await showPic();render();cloud()});
