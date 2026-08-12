import { supabase } from "./supabase.js";
import { qty, escapeHtml } from "./utils.js";

const $=s=>document.querySelector(s);
const els={
  authView:$("#authView"),mainView:$("#mainView"),bottomNav:$("#bottomNav"),logout:$("#logoutBtn"),
  status:$("#connectionStatus"),login:$("#loginForm"),authMessage:$("#authMessage"),
  search:$("#searchInput"),filter:$("#statusFilter"),refresh:$("#refreshBtn"),
  stats:$("#stats"),table:$("#itemsTable"),dialog:$("#itemDialog"),form:$("#itemForm"),
  dialogTitle:$("#dialogTitle"),formMessage:$("#formMessage")
};
let items=[];
let editingId=null;

function showMessage(el,text,type=""){el.textContent=text;el.className=`message ${type}`}

function setSignedIn(signedIn){
  els.authView.classList.toggle("hidden",signedIn);
  els.mainView.classList.toggle("hidden",!signedIn);
  els.bottomNav.classList.toggle("hidden",!signedIn);
  els.logout.classList.toggle("hidden",!signedIn);
}

async function loadSession(){
  const {data:{session}}=await supabase.auth.getSession();
  setSignedIn(!!session);
  if(session) await loadItems();
  else els.status.textContent="Sign in required";
}

async function loadItems(){
  els.status.textContent="Loading…";
  const {data,error}=await supabase.from("items").select("*").order("active",{ascending:false}).order("name");
  if(error){
    els.status.textContent="Database error";
    els.status.className="status danger-text";
    els.table.innerHTML=`<div class="empty"><strong>Could not load items</strong><p class="muted">${escapeHtml(error.message)}</p></div>`;
    return;
  }
  items=data||[];
  els.status.textContent="Supabase connected";
  els.status.className="status success";
  render();
}

function render(){
  const q=els.search.value.trim().toLowerCase();
  const f=els.filter.value;
  let list=items.filter(x=>{
    const matches=!q || [x.name,x.code,x.category].some(v=>String(v||"").toLowerCase().includes(q));
    const matchesFilter=f==="all" || (f==="active"&&x.active) || (f==="inactive"&&!x.active) || (f==="sale"&&x.sale_enabled) || (f==="production"&&x.production_enabled) || (f==="packaging"&&x.packaging_enabled);
    return matches&&matchesFilter;
  });
  const active=items.filter(x=>x.active).length;
  const sale=items.filter(x=>x.sale_enabled&&x.active).length;
  const production=items.filter(x=>x.production_enabled&&x.active).length;
  els.stats.innerHTML=[
    ["Total Items",items.length],["Active",active],["Sale Enabled",sale],["Production Enabled",production]
  ].map(([a,b])=>`<div class="stat"><strong>${b}</strong><span>${a}</span></div>`).join("");

  if(!list.length){els.table.innerHTML=`<div class="empty"><strong>No items found</strong><p class="muted">Add an item or change the filter.</p></div>`;return;}
  els.table.innerHTML=`<table class="table"><thead><tr>
    <th>Item</th><th>Code</th><th>Category</th><th>Units</th><th>Flags</th><th>Min Stock</th><th>Status</th><th>Action</th>
  </tr></thead><tbody>${list.map(x=>`<tr>
    <td><strong>${escapeHtml(x.name)}</strong></td>
    <td>${escapeHtml(x.code||"—")}</td>
    <td>${escapeHtml(x.category||"—")}</td>
    <td>${escapeHtml(x.purchase_unit)} → ${escapeHtml(x.base_unit)}<br><span class="muted">× ${qty(x.unit_factor_to_base)}</span></td>
    <td>
      <span class="badge ${x.sale_enabled?"on":"off"}">Sale ${x.sale_enabled?"ON":"OFF"}</span>
      <span class="badge ${x.production_enabled?"on":"off"}">Prod ${x.production_enabled?"ON":"OFF"}</span>
      <span class="badge ${x.packaging_enabled?"on":"off"}">Pack ${x.packaging_enabled?"ON":"OFF"}</span>
    </td>
    <td>${qty(x.min_stock)} ${escapeHtml(x.base_unit)}</td>
    <td><span class="badge ${x.active?"on":"off"}">${x.active?"Active":"Inactive"}</span></td>
    <td><div class="actions"><button data-edit="${x.id}">Edit</button><button class="danger" data-toggle="${x.id}">${x.active?"Deactivate":"Activate"}</button></div></td>
  </tr>`).join("")}</tbody></table>`;
}

function resetForm(){
  editingId=null;els.form.reset();$("#itemId").value="";
  $("#unitFactor").value="1";$("#minStock").value="0";$("#active").checked=true;
  els.dialogTitle.textContent="Add Item";showMessage(els.formMessage,"");
}
function fillForm(x){
  editingId=x.id;els.dialogTitle.textContent="Edit Item";
  $("#itemId").value=x.id;$("#itemName").value=x.name||"";$("#itemCode").value=x.code||"";
  $("#itemCategory").value=x.category||"";$("#baseUnit").value=x.base_unit;
  $("#purchaseUnit").value=x.purchase_unit;$("#unitFactor").value=x.unit_factor_to_base;
  $("#minStock").value=x.min_stock;$("#saleEnabled").checked=x.sale_enabled;
  $("#productionEnabled").checked=x.production_enabled;$("#packagingEnabled").checked=x.packaging_enabled;$("#active").checked=x.active;
  showMessage(els.formMessage,"");els.dialog.showModal();
}

async function saveItem(e){
  e.preventDefault();
  showMessage(els.formMessage,"Saving…");
  const payload={
    name:$("#itemName").value.trim(),code:$("#itemCode").value.trim()||null,category:$("#itemCategory").value.trim()||null,
    base_unit:$("#baseUnit").value,purchase_unit:$("#purchaseUnit").value,
    unit_factor_to_base:Number($("#unitFactor").value),min_stock:Number($("#minStock").value)||0,
    sale_enabled:$("#saleEnabled").checked,production_enabled:$("#productionEnabled").checked,
    packaging_enabled:$("#packagingEnabled").checked,active:$("#active").checked,updated_at:new Date().toISOString()
  };
  if(!payload.name || payload.unit_factor_to_base<=0){showMessage(els.formMessage,"Name and a valid conversion factor are required.","error");return;}
  let result;
  if(editingId) result=await supabase.from("items").update(payload).eq("id",editingId).select().single();
  else result=await supabase.from("items").insert(payload).select().single();
  if(result.error){showMessage(els.formMessage,result.error.message,"error");return;}
  els.dialog.close();await loadItems();
}

async function toggleItem(id){
  const x=items.find(i=>i.id===id);if(!x)return;
  const {error}=await supabase.from("items").update({active:!x.active,updated_at:new Date().toISOString()}).eq("id",id);
  if(error){alert(error.message);return;} await loadItems();
}

els.login.addEventListener("submit",async e=>{
  e.preventDefault();showMessage(els.authMessage,"Signing in…");
  const {error}=await supabase.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});
  if(error){showMessage(els.authMessage,error.message,"error");return;}
  showMessage(els.authMessage,"Signed in.","ok");await loadSession();
});
els.logout.addEventListener("click",async()=>{await supabase.auth.signOut();items=[];setSignedIn(false);});
els.refresh.addEventListener("click",loadItems);els.search.addEventListener("input",render);els.filter.addEventListener("change",render);
$("#addItemBtn").addEventListener("click",()=>{resetForm();els.dialog.showModal();});
$("#closeDialog").addEventListener("click",()=>els.dialog.close());$("#cancelBtn").addEventListener("click",()=>els.dialog.close());
els.form.addEventListener("submit",saveItem);
els.table.addEventListener("click",e=>{
  const edit=e.target.closest("[data-edit]");if(edit){const x=items.find(i=>i.id===edit.dataset.edit);if(x)fillForm(x);return;}
  const tog=e.target.closest("[data-toggle]");if(tog)toggleItem(tog.dataset.toggle);
});
document.addEventListener("click",e=>{
  const v=e.target.closest("[data-view]")?.dataset.view;
  if(v==="more") alert("More menu: Item Dashboard is already open as a dedicated page.");
  if(v && v!=="more" && v!=="dashboard" && v!=="purchases" && v!=="orders" && v!=="sales") return;
});
supabase.auth.onAuthStateChange((_event,session)=>{setSignedIn(!!session);if(session)loadItems();});
loadSession();
