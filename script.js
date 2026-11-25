const $=id=>document.getElementById(id);

let complaints=JSON.parse(localStorage.getItem("nagrikComplaints")||"null")||[
{id:"NS-W1024",cat:"Water",issue:"Water Supply Issue",loc:"Naroda • Ahmedabad",date:"23 Sep 2026",status:"Pending"},
{id:"NS-E1023",cat:"Electricity",issue:"Power Outage",loc:"Odhav • Ahmedabad",date:"23 Sep 2026",status:"In Progress"},
{id:"NS-W1022",cat:"Water",issue:"Pipeline Leakage",loc:"Bapunagar • Ahmedabad",date:"22 Sep 2026",status:"Resolved"},
{id:"NS-E1021",cat:"Electricity",issue:"Street Light Problem",loc:"Maninagar • Ahmedabad",date:"21 Sep 2026",status:"Resolved"}
];

const bloodData={ "A+":14,"A-":3,"B+":18,"B-":4,"AB+":6,"AB-":2,"O+":21,"O-":5 };
const needs=[
["City Care Hospital","Naroda","O+",3,"Urgent"],
["Community Hospital","Naroda","B+",2,"High"],
["Ahmedabad General Hospital","Odhav","A+",4,"Urgent"],
["Civic Hospital","Maninagar","O-",1,"Normal"]
];

function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function save(){localStorage.setItem("nagrikComplaints",JSON.stringify(complaints));}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>t.classList.remove("show"),2600);}

// Notification center: alerts are stored locally and remain after refresh.
let notifications=JSON.parse(localStorage.getItem("nagrikNotifications")||"null")||[
  {id:1,title:"Welcome to Nagrik Sahayak",text:"Your civic notification center is ready. Complaint updates will appear here.",icon:"🔔",time:new Date().toISOString(),read:false}
];
function saveNotifications(){localStorage.setItem("nagrikNotifications",JSON.stringify(notifications));}
function timeAgo(iso){const diff=Math.max(0,Date.now()-new Date(iso).getTime()),min=Math.floor(diff/60000);if(min<1)return "Just now";if(min<60)return min+" min ago";const hr=Math.floor(min/60);if(hr<24)return hr+" hr ago";return Math.floor(hr/24)+" day ago";}
function renderNotifications(){
 const unread=notifications.filter(n=>!n.read).length;
 const badge=$("notifBadge");badge.textContent=unread>99?"99+":String(unread);badge.style.display=unread?"grid":"none";
 $("notifSummary").textContent=unread?unread+" unread notification"+(unread===1?"":"s"):"You're all caught up";
 $("notificationList").innerHTML=notifications.length?notifications.map(n=>`<div class="notification-item ${n.read?"":"unread"}" data-notif="${n.id}"><div class="notification-icon">${n.icon||"🔔"}</div><div class="notification-content"><b>${escapeHTML(n.title)}</b><p>${escapeHTML(n.text)}</p><time>${timeAgo(n.time)}</time></div></div>`).join(""):"<div class=\"notification-empty\">No notifications yet.</div>";
 document.querySelectorAll(".notification-item").forEach(el=>el.onclick=()=>{const n=notifications.find(x=>x.id===Number(el.dataset.notif));if(n){n.read=true;saveNotifications();renderNotifications();}if(n&&/complaint/i.test(n.title+n.text))page("complaints");});
}
function addNotification(title,text,icon="🔔"){notifications.unshift({id:Date.now()+Math.random(),title,text,icon,time:new Date().toISOString(),read:false});notifications=notifications.slice(0,30);saveNotifications();renderNotifications();}

function page(name){
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 $(name).classList.add("active");
 document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===name));
 window.scrollTo(0,0);
}

document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));

function statusClass(s){return s==="Resolved"?"resolved":s==="In Progress"?"progress":"pending";}

function renderComplaints(){
 const q=($("filter").value||"").toLowerCase(), s=$("status").value;
 const arr=complaints.filter(c=>(s==="All Status"||c.status===s)&&Object.values(c).join(" ").toLowerCase().includes(q));
 $("complaintTable").innerHTML=arr.length?arr.map(c=>`<tr><td><b>${c.id}</b></td><td>${c.cat}</td><td>${escapeHTML(c.issue)}</td><td>${escapeHTML(c.loc)}</td><td>${c.date}</td><td><span class="status ${statusClass(c.status)}">${c.status}</span></td></tr>`).join(""):`<tr><td colspan="6" style="text-align:center">No complaints found.</td></tr>`;
}

function renderAdmin(){
  const total=complaints.length;
  $("adminTotal").textContent=total;
  $("adminPending").textContent=complaints.filter(c=>c.status==="Pending").length;
  $("adminProgress").textContent=complaints.filter(c=>c.status==="In Progress").length;
  $("adminResolved").textContent=complaints.filter(c=>c.status==="Resolved").length;
  $("adminComplaintTable").innerHTML=complaints.length?complaints.map(c=>`<tr>
    <td><b>${escapeHTML(c.id)}</b></td><td>${escapeHTML(c.cat)}</td><td>${escapeHTML(c.issue)}</td>
    <td>${escapeHTML(c.loc)}</td><td>${escapeHTML(c.date)}</td>
    <td><select class="admin-status" data-id="${escapeHTML(c.id)}">
      <option ${c.status==="Pending"?"selected":""}>Pending</option>
      <option ${c.status==="In Progress"?"selected":""}>In Progress</option>
      <option ${c.status==="Resolved"?"selected":""}>Resolved</option>
    </select></td></tr>`).join(""):`<tr><td colspan="6" class="empty-cell">No complaints submitted yet.</td></tr>`;
}
renderComplaints();renderNotifications();renderAdmin();

async function pinLookup(pin, target, authorityType){
 pin=String(pin).replace(/\D/g,"");
 if(pin.length!==6){toast("Please enter a valid 6-digit pincode.");return;}
 target.result && ($(target.result).textContent="🔄 Finding location...");
 try{
   const r=await fetch("https://api.postalpincode.in/pincode/"+pin);
   const d=await r.json(), x=d?.[0];
   if(!x||x.Status!=="Success"||!x.PostOffice?.length) throw new Error();
   const p=x.PostOffice[0], area=x.PostOffice.slice(0,3).map(a=>a.Name).join(", ");
   if(target.area) $(target.area).value=area;
   if(target.district) $(target.district).value=p.District||"";
   if(target.state) $(target.state).value=p.State||"";
   if(target.authority) $(target.authority).value=authorityType==="water"?"Relevant Nagar Palika / Municipal Corporation / Gram Panchayat":"Relevant Electricity Distribution Authority";
   if(target.result) $(target.result).textContent="📍 "+area+" • "+p.District+", "+p.State;
   toast("Location found successfully.");
 }catch(e){
   if(target.result) $(target.result).textContent="⚠️ Pincode not found or location service unavailable.";
   toast("Could not fetch this pincode. Check internet connection.");
 }
}

function numericInput(id){
 $(id).addEventListener("input",e=>e.target.value=e.target.value.replace(/\D/g,"").slice(0,6));
}
["dashPin","waterPin","powerPin","bloodPin"].forEach(numericInput);

$("dashFind").onclick=()=>pinLookup($("dashPin").value,{result:"dashResult"});
$("dashPin").onkeydown=e=>{if(e.key==="Enter"){$("dashFind").click();}};
$("waterPin").oninput=()=>{if($("waterPin").value.length===6)pinLookup($("waterPin").value,{area:"waterArea",district:"waterDistrict",state:"waterState",authority:"waterAuthority"},"water");};
$("powerPin").oninput=()=>{if($("powerPin").value.length===6)pinLookup($("powerPin").value,{area:"powerArea",district:"powerDistrict",state:"powerState",authority:"powerAuthority"},"power");};
$("bloodFind").onclick=()=>{
 pinLookup($("bloodPin").value,{result:"bloodLocation"});
};
$("bloodPin").onkeydown=e=>{if(e.key==="Enter")$("bloodFind").click();};

function addComplaint(cat,issue,loc){
 const id="NS-"+(cat==="Water"?"W":"E")+Math.floor(1000+Math.random()*9000);
 complaints.unshift({id,cat,issue,loc:loc||"Location pending",date:new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),status:"Pending"});
 save();if($("recent"))renderRecent();renderComplaints();
 addNotification("Complaint submitted",`${cat} complaint ${id} has been submitted successfully. Current status: Pending.`,cat==="Water"?"💧":"⚡");
 return id;
}
$("waterForm").onsubmit=e=>{
 e.preventDefault();
 const id=addComplaint("Water",$("waterType").value,$("waterArea").value+" • "+($("waterDistrict").value||"Location pending"));
 e.target.reset();["waterArea","waterDistrict","waterState","waterAuthority"].forEach(x=>$(x).value="");
 toast("Complaint submitted. ID: "+id);page("complaints");
};
$("powerForm").onsubmit=e=>{
 e.preventDefault();
 const id=addComplaint("Electricity",$("powerType").value,$("powerArea").value+" • "+($("powerDistrict").value||"Location pending"));
 e.target.reset();["powerArea","powerDistrict","powerState","powerAuthority"].forEach(x=>$(x).value="");
 toast("Complaint submitted. ID: "+id);page("complaints");
};
$("donorForm").onsubmit=e=>{
 e.preventDefault();
 const donors=JSON.parse(localStorage.getItem("nagrikDonors")||"[]");
 donors.push({name:$("donorName").value,group:$("donorGroup").value,info:$("donorInfo").value,date:new Date().toISOString()});
 localStorage.setItem("nagrikDonors",JSON.stringify(donors));
 e.target.reset();addNotification("Blood donor registration","Your donor registration has been saved successfully.","🩸");toast("Thank you! Donor registration saved.");
};

$("bloodCards").innerHTML=Object.entries(bloodData).map(([g,n])=>`<div class="blood-card"><b>${g}</b><small>Available</small><strong>${n}</strong></div>`).join("");
$("requirements").innerHTML=needs.map(n=>`<div class="req"><div><b>${n[0]}</b><small>${n[1]} · ${n[2]} blood · ${n[4]}</small></div><strong class="${n[4]==="Urgent"?"urgent":""}">${n[3]} units</strong></div>`).join("");

$("filter").oninput=renderComplaints;$("status").onchange=renderComplaints;

const searchItems=[["Water Problem","water"],["Electricity Problem","electricity"],["Blood Donation","blood"],["Complaints","complaints"],["Reports","reports"]];
$("search").onfocus=()=>showSuggestions($("search").value);
$("search").oninput=e=>showSuggestions(e.target.value);
function showSuggestions(q){
 q=q.toLowerCase().trim();
 const arr=searchItems.filter(x=>x[0].toLowerCase().includes(q));
 $("suggestions").innerHTML=arr.map(x=>`<div class="suggestion" data-go="${x[1]}">⌕ ${x[0]}</div>`).join("");
 $("suggestions").classList.toggle("show",arr.length>0);
 document.querySelectorAll(".suggestion").forEach(x=>x.onclick=()=>{page(x.dataset.go);$("suggestions").classList.remove("show");$("search").value="";});
}
document.addEventListener("click",e=>{if(!e.target.closest(".search"))$("suggestions").classList.remove("show");});
$("search").onkeydown=e=>{if(e.key==="Enter"){const x=searchItems.find(x=>x[0].toLowerCase().includes($("search").value.toLowerCase()));if(x){page(x[1]);$("suggestions").classList.remove("show");}}};

const naas=$("naasPanel");
$("naasFloat").onclick=()=>naas.classList.add("open");
$("openNaas").onclick=()=>naas.classList.add("open");
$("closeNaas").onclick=()=>naas.classList.remove("open");
function chat(text,who){const d=document.createElement("div");d.className=who;d.textContent=text;$("chat").appendChild(d);$("chat").scrollTop=$("chat").scrollHeight;}
function reply(m){
 m=m.toLowerCase();
 if(m.includes("water"))return"Open Water Problem. Enter your pincode, select the issue and submit your complaint.";
 if(m.includes("electric"))return"Open Electricity Problem. Your location helps identify the relevant authority.";
 if(m.includes("blood"))return"Open Blood Network to see blood-group requirements or register as a donor.";
 if(m.includes("complaint"))return"Open Complaint Center to see your submitted complaint IDs and status.";
 return"I can help with Water, Electricity, Blood Donation or Complaints.";
}
function sendChat(){const v=$("chatInput").value.trim();if(!v)return;chat(v,"user");$("chatInput").value="";setTimeout(()=>chat(reply(v),"bot"),180);}
$("chatSend").onclick=sendChat;$("chatInput").onkeydown=e=>{if(e.key==="Enter")sendChat();};
$("bell").onclick=(e)=>{e.stopPropagation();$("notificationPanel").classList.toggle("open");renderNotifications();};
$("markAllRead").onclick=(e)=>{e.stopPropagation();notifications.forEach(n=>n.read=true);saveNotifications();renderNotifications();};
$("clearNotifications").onclick=(e)=>{e.stopPropagation();notifications=[];saveNotifications();renderNotifications();};
document.addEventListener("click",e=>{if(!e.target.closest(".notification-wrap"))$("notificationPanel").classList.remove("open");});

console.log("Nagrik Sahayak loaded successfully.");

// Login and role-based access (front-end demo authentication).
function applyLogin(role,email){
  sessionStorage.setItem("nagrikRole",role);
  sessionStorage.setItem("nagrikEmail",email);
  $("loginScreen").classList.add("hidden");
  $("mainApp").classList.add("app-visible");
  document.querySelectorAll(".admin-only").forEach(el=>el.hidden=role!=="admin");
  const profile=document.querySelector(".mini-profile");
  if(profile){
    profile.querySelector("b").textContent=role==="admin"?"Administrator":"Citizen";
    profile.querySelector("small").textContent=email;
    profile.querySelector(".avatar").textContent=role==="admin"?"A":"C";
  }
  renderAdmin();
  page("dashboard");
}
$("loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const email=$("loginEmail").value.trim();
  const password=$("loginPassword").value;
  const role=$("loginRole").value;
  if(role==="admin" && !(email==="admin@nagrik.local" && password==="admin123")){
    $("loginError").textContent="Invalid admin email or password. Use the demo credentials shown below.";
    return;
  }
  if(password.length<4){$("loginError").textContent="Please enter a password with at least 4 characters.";return;}
  $("loginError").textContent="";
  applyLogin(role,email);
});
$("logoutBtn").addEventListener("click",()=>{
  sessionStorage.removeItem("nagrikRole");
  sessionStorage.removeItem("nagrikEmail");
  $("mainApp").classList.remove("app-visible");
  $("loginScreen").classList.remove("hidden");
  $("loginForm").reset();
  $("loginError").textContent="";
});
$("adminComplaintTable").addEventListener("change",e=>{
  if(!e.target.matches(".admin-status"))return;
  const item=complaints.find(c=>c.id===e.target.dataset.id);
  if(!item)return;
  item.status=e.target.value;
  save();
  renderAdmin();
  renderComplaints();
  addNotification("Complaint status updated",`${item.id} is now marked as ${item.status}.`,"⚙️");
  toast("Complaint status updated.");
});
if(sessionStorage.getItem("nagrikRole")){
  applyLogin(sessionStorage.getItem("nagrikRole"),sessionStorage.getItem("nagrikEmail")||"");
}
