import { supabase } from "./supabase.js";
import { qty, escapeHtml } from "./utils.js";
const $=s=>document.querySelector(s), content=$("#content");
let page="items", items=[], purchases=[], recipes=[], recipeLines=[], orders=[], orderLines=[], operations=[], ledger=[];
const status=$("#connectionStatus"), dialog=$("#dialog"), form=$("#form"), title=$("#dialogTitle"), body=$("#formBody"), msg=$("#formMessage");

const pages={
 items:["Item Dashboard","Master items used across the core workflow.","+ Add Item"],
 purchases:["Purchase","Receive stock and record cost per base unit.","+ Add Purchase"],
 recipes:["Recipes","Define production / packaging output and its components.","+ Add Recipe"],
 orders:["Orders","Order only sale-enabled items; issue them to production / packaging.","+ Add Order"],
 operations:["Production / Packaging","Issue ingredients from active recipes and record used, return, damage and closing.","+ Record Operation"],
 inventory:["Inventory","Current balance and valuation from the inventory ledger.","Refresh"]
};
function message(t,c=""){msg.textContent=t;msg.className="message "+c}
function setSignedIn(v){$("#authView").classList.toggle("hidden",v);$("#mainView").classList.toggle("hidden",!v);$("#logoutBtn").classList.toggle("hidden",!v)}
async function loadAll(){
 status.textContent="Loading…";
 const qs=[
  supabase.from("items").select("*").order("name"),
  supabase.from("purchases").select("*").order("purchase_date",{ascending:false}),
  supabase.from("recipes").select("*").order("created_at",{ascending:false}),
  supabase.from("recipe_lines").select("*"),
  supabase.from("orders").select("*").order("order_date",{ascending:false}),
  supabase.from("order_lines").select("*"),
  supabase.from("daily_operations").select("*").order("operation_date",{ascending:false}),
  supabase.from("inventory_ledger").select("*").order("event_date",{ascending:false})
 ];
 const r=await Promise.all(qs); const bad=r.find(x=>x.error);
 if(bad){status.textContent="Database error";status.className="status danger-text";console.error(bad.error);renderError(bad.error.message);return}
 [items,purchases,recipes,recipeLines,orders,orderLines,operations,ledger]=r.map(x=>x.data||[]);
 status.textContent="Supabase connected";status.className="status success";render();
}
const itemName=id=>items.find(x=>x.id===id)?.name||"Unknown";
const recipeName=id=>{let r=recipes.find(x=>x.id===id);return r?`${itemName(r.item_id)} · ${r.recipe_type} v${r.version}`:"Unknown"};
const money=n=>new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
function renderError(e){content.innerHTML=`<div class="card"><strong>Could not load module data</strong><p class="muted">${escapeHtml(e)}</p><button id="retry">Retry</button></div>`;$("#retry").onclick=loadAll}
function render(){
 $("#pageTitle").textContent=pages[page][0];$("#pageSub").textContent=pages[page][1];$("#primaryAction").textContent=pages[page][2];
 document.querySelectorAll("#tabs button").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 ({items:renderItems,purchases:renderPurchases,recipes:renderRecipes,orders:renderOrders,operations:renderOperations,inventory:renderInventory}[page])();
}
function table(headers,rows){return `<div class="table-card"><table class="table"><thead><tr>${headers.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.join("")||`<tr><td colspan="${headers.length}" class="empty">No records yet.</td></tr>`}</tbody></table></div>`}
function toolbar(search=true){return search?`<div class="toolbar"><input id="search" placeholder="Search…"><button id="reload">Refresh</button></div>`:""}

function renderItems(){
 const active=items.filter(x=>x.active).length,sale=items.filter(x=>x.sale_enabled&&x.active).length,prod=items.filter(x=>x.production_enabled&&x.active).length,pack=items.filter(x=>x.packaging_enabled&&x.active).length;
 content.innerHTML=`<div class="stats"><div class="stat"><strong>${items.length}</strong><span>Total</span></div><div class="stat"><strong>${active}</strong><span>Active</span></div><div class="stat"><strong>${sale}</strong><span>Sale enabled</span></div><div class="stat"><strong>${prod+pack}</strong><span>Production / Packaging</span></div></div>${toolbar()}<div id="itemTable"></div>`;
 const draw=()=>{let q=$("#search").value.toLowerCase();let a=items.filter(x=>[x.name,x.code,x.category].some(v=>String(v||"").toLowerCase().includes(q)));$("#itemTable").innerHTML=table(["Item","Code","Category","Unit","Flags","Min","Status","Action"],a.map(x=>`<tr><td><strong>${escapeHtml(x.name)}</strong></td><td>${escapeHtml(x.code||"—")}</td><td>${escapeHtml(x.category||"—")}</td><td>${x.purchase_unit} → ${x.base_unit}<br><span class="muted">×${qty(x.unit_factor_to_base)}</span></td><td><span class="badge ${x.sale_enabled?"on":"off"}">Sale</span><span class="badge ${x.production_enabled?"on":"off"}">Prod</span><span class="badge ${x.packaging_enabled?"on":"off"}">Pack</span></td><td>${qty(x.min_stock)}</td><td>${x.active?"Active":"Inactive"}</td><td><button data-edit-item="${x.id}">Edit</button> <button data-toggle-item="${x.id}">${x.active?"Deactivate":"Activate"}</button></td></tr>`));};
	draw();$("#search").oninput=draw;$("#reload").onclick=loadAll;
}
function renderPurchases(){
 const total=purchases.reduce((s,x)=>s+Number(x.total_cost),0), confirmed=purchases.filter(x=>x.confirmed).length;
 content.innerHTML=`<div class="stats"><div class="stat"><strong>${purchases.length}</strong><span>Purchase records</span></div><div class="stat"><strong>${confirmed}</strong><span>Confirmed</span></div><div class="stat"><strong>${money(total)}</strong><span>Total purchase value</span></div><div class="stat"><strong>${money(purchases.filter(x=>x.confirmed).reduce((s,x)=>s+Number(x.total_cost),0))}</strong><span>Confirmed value</span></div></div>${toolbar()}<div id="purchaseTable"></div>`;
 const draw=()=>{let q=$("#search").value.toLowerCase();let a=purchases.filter(x=>itemName(x.item_id).toLowerCase().includes(q)||String(x.supplier||"").toLowerCase().includes(q));$("#purchaseTable").innerHTML=table(["Date","Item","Qty","Base Qty","Total","Cost/Base","Supplier","Status","Action"],a.map(x=>`<tr><td>${x.purchase_date}</td><td>${escapeHtml(itemName(x.item_id))}</td><td>${qty(x.quantity)} ${x.purchase_unit}</td><td>${qty(x.base_quantity)} ${items.find(i=>i.id===x.item_id)?.base_unit||""}</td><td>${money(x.total_cost)}</td><td>${money(x.cost_per_base_unit)}</td><td>${escapeHtml(x.supplier||"—")}</td><td>${x.confirmed?'<span class="badge on">Confirmed</span>':'<span class="badge off">Draft</span>'}</td><td>${x.confirmed?"—":`<button data-confirm-purchase="${x.id}">Confirm</button>`}</td></tr>`));};draw();$("#search").oninput=draw;$("#reload").onclick=loadAll;
}
function renderRecipes(){
 content.innerHTML=`${toolbar()}<div id="recipeTable"></div>`;let draw=()=>{$("#recipeTable").innerHTML=table(["Output Item","Type","Version","Status","Components","Action"],recipes.map(r=>{let ls=recipeLines.filter(l=>l.recipe_id===r.id);return `<tr><td>${escapeHtml(itemName(r.item_id))}</td><td>${r.recipe_type}</td><td>${r.version}</td><td>${r.active?"Active":"Inactive"}</td><td>${ls.length}</td><td><button data-edit-recipe="${r.id}">Edit</button></td></tr>`}))};draw();$("#search").oninput=()=>{};$("#reload").onclick=loadAll;
}
function renderOrders(){
 content.innerHTML=`${toolbar()}<div id="orderTable"></div>`;let draw=()=>{$("#orderTable").innerHTML=table(["Date","Order No","Status","Items","Action"],orders.map(o=>{let ls=orderLines.filter(l=>l.order_id===o.id);return `<tr><td>${o.order_date}</td><td>${escapeHtml(o.order_no||"—")}</td><td><span class="badge ${o.status==="completed"?"on":""}">${o.status}</span></td><td>${ls.map(l=>`${escapeHtml(itemName(l.item_id))} × ${qty(l.quantity)}`).join("<br>")}</td><td>${o.status==="pending"?`<button data-issue-order="${o.id}">Issue</button>`:"—"}</td></tr>`}))};draw();$("#reload").onclick=loadAll;
}
function renderOperations(){
 content.innerHTML=`${toolbar()}<div id="opTable"></div>`;let draw=()=>{$("#opTable").innerHTML=table(["Date","Item","Type","Opening","Issued","Used","Return","Damage","Closing"],operations.map(o=>`<tr><td>${o.operation_date}</td><td>${escapeHtml(itemName(o.item_id))}</td><td>${o.operation_type}</td><td>${qty(o.opening_qty)}</td><td>${qty(o.issued_qty)}</td><td>${qty(o.used_qty)}</td><td>${qty(o.return_qty)}</td><td>${qty(o.damage_qty)}</td><td>${qty(o.closing_qty)}</td></tr>`))};draw();$("#reload").onclick=loadAll;
}
function renderInventory(){
 const map={};ledger.forEach(l=>{if(!map[l.item_id])map[l.item_id]={qty:0,value:0};map[l.item_id].qty+=Number(l.qty_delta);map[l.item_id].value+=Number(l.value_delta)});
 content.innerHTML=table(["Item","Base Unit","Current Qty","Current Value","Avg Cost/Base"],items.filter(i=>map[i.id]).map(i=>{let a=map[i.id],avg=a.qty? a.value/a.qty:0;return `<tr><td>${escapeHtml(i.name)}</td><td>${i.base_unit}</td><td>${qty(a.qty)}</td><td>${money(a.value)}</td><td>${money(avg)}</td></tr>`}));
}
function openDialog(t,html,save){title.textContent=t;body.innerHTML=html;message("");form.onsubmit=async e=>{e.preventDefault();await save()};dialog.showModal()}
function itemOptions(filter=()=>true){return items.filter(x=>x.active&&filter(x)).map(x=>`<option value="${x.id}">${escapeHtml(x.name)} (${x.base_unit})</option>`).join("")}
function openItem(id=null){
 let x=id&&items.find(i=>i.id===id);openDialog(id?"Edit Item":"Add Item",`<div class="form-grid"><label>Name*<input id="f_name" required value="${escapeHtml(x?.name||"")}"></label><label>Code<input id="f_code" value="${escapeHtml(x?.code||"")}"></label><label>Category<input id="f_cat" value="${escapeHtml(x?.category||"")}"></label><label>Base Unit<select id="f_base"><option ${x?.base_unit==="g"?"selected":""}>g</option><option ${x?.base_unit==="pcs"?"selected":""}>pcs</option></select></label><label>Purchase Unit<select id="f_pu"><option>g</option><option>kg</option><option>pcs</option><option>box</option><option>pack</option></select></label><label>Unit → Base Factor<input id="f_factor" type="number" step="0.000001" min="0.000001" value="${x?.unit_factor_to_base||1}"></label><label>Minimum Stock<input id="f_min" type="number" min="0" value="${x?.min_stock||0}"></label></div><div class="checks"><label><input id="f_sale" type="checkbox" ${x?.sale_enabled?"checked":""}> Sale</label><label><input id="f_prod" type="checkbox" ${x?.production_enabled?"checked":""}> Production</label><label><input id="f_pack" type="checkbox" ${x?.packaging_enabled?"checked":""}> Packaging</label><label><input id="f_active" type="checkbox" ${x?x.active?"checked":"":"checked"}> Active</label></div>`,async()=>{let p={name:$("#f_name").value.trim(),code:$("#f_code").value.trim()||null,category:$("#f_cat").value.trim()||null,base_unit:$("#f_base").value,purchase_unit:$("#f_pu").value,unit_factor_to_base:Number($("#f_factor").value),min_stock:Number($("#f_min").value)||0,sale_enabled:$("#f_sale").checked,production_enabled:$("#f_prod").checked,packaging_enabled:$("#f_pack").checked,active:$("#f_active").checked,updated_at:new Date().toISOString()};let r=id?await supabase.from("items").update(p).eq("id",id):await supabase.from("items").insert(p);if(r.error){message(r.error.message,"error");return}dialog.close();await loadAll()})
}
function openPurchase(){
 openDialog("Add Purchase",`<div class="form-grid"><label>Date<input id="p_date" type="date" value="${new Date().toISOString().slice(0,10)}" required></label><label>Item<select id="p_item" required>${itemOptions()}</select></label><label>Purchase Qty<input id="p_qty" type="number" min="0.000001" step="0.000001" required></label><label>Purchase Unit<select id="p_unit"><option>kg</option><option>g</option><option>pcs</option><option>box</option><option>pack</option></select></label><label>Total Cost (MMK)<input id="p_cost" type="number" min="0" step="0.01" required></label><label>Supplier<input id="p_supplier"></label></div><p id="calc" class="note"></p><label>Notes<textarea id="p_notes"></textarea></label>`,async()=>{let it=items.find(i=>i.id===$("#p_item").value),q=Number($("#p_qty").value),unit=$("#p_unit").value,cost=Number($("#p_cost").value);let factor=unit===it.base_unit?1:unit==="kg"&&it.base_unit==="g"?1000:unit==="g"&&it.base_unit==="kg"?0.001:unit==="pcs"&&it.base_unit==="pcs"?1:unit==="box"&&it.base_unit==="pcs"?it.unit_factor_to_base:unit==="pack"&&it.base_unit==="pcs"?it.unit_factor_to_base:null;if(factor===null){message("This purchase unit needs an item-specific conversion factor or matching base unit.","error");return}let base=q*factor,cpu=base?cost/base:0;let r=await supabase.from("purchases").insert({purchase_date:$("#p_date").value,item_id:it.id,quantity:q,purchase_unit:unit,base_quantity:base,total_cost:cost,cost_per_base_unit:cpu,supplier:$("#p_supplier").value.trim()||null,notes:$("#p_notes").value.trim()||null,created_by:(await supabase.auth.getUser()).data.user?.id});if(r.error){message(r.error.message,"error");return}dialog.close();await loadAll()});setTimeout(()=>{let update=()=>{let it=items.find(i=>i.id===$("#p_item").value),q=Number($("#p_qty").value),u=$("#p_unit").value,c=Number($("#p_cost").value),f=u===it.base_unit?1:u==="kg"&&it.base_unit==="g"?1000:u==="g"&&it.base_unit==="kg"?0.001:u==="pcs"&&it.base_unit==="pcs"?1:u==="box"||u==="pack"?it.unit_factor_to_base:null;if(f){let b=q*f;$("#calc").textContent=`Base quantity: ${qty(b)} ${it.base_unit} · Cost: ${money(b?c/b:0)} MMK / ${it.base_unit}`}};["p_item","p_qty","p_unit","p_cost"].forEach(id=>$("#"+id).addEventListener("input",update));update()},0)
}
async function confirmPurchase(id){
 const p=purchases.find(x=>x.id===id);if(!p||p.confirmed)return;
 const user=(await supabase.auth.getUser()).data.user;
 const r1=await supabase.from("purchases").update({confirmed:true,applied:true}).eq("id",id);
 if(r1.error){alert(r1.error.message);return}
 const r2=await supabase.from("inventory_ledger").insert({event_date:p.purchase_date,item_id:p.item_id,source_type:"purchase",source_id:p.id,qty_delta:p.base_quantity,unit_cost:p.cost_per_base_unit,value_delta:p.total_cost,created_by:user?.id});
 if(r2.error){await supabase.from("purchases").update({confirmed:false,applied:false}).eq("id",id);alert("Purchase confirmation failed: "+r2.error.message);return}
 await loadAll();
}
function openRecipe(id=null){
 let r=id&&recipes.find(x=>x.id===id), ls=r?recipeLines.filter(l=>l.recipe_id===id):[];
 const comps=()=>ls.map((l,i)=>`<div class="grid3 comp" data-i="${i}"><select class="c_item">${itemOptions(x=>x.id!==r?.item_id)}</select><input class="c_qty" type="number" min="0.000001" step="0.000001" value="${l.qty_per_output}"><button type="button" class="remove">Remove</button></div>`).join("");
 openDialog(id?"Edit Recipe":"Add Recipe",`<div class="form-grid"><label>Output Item<select id="r_item">${itemOptions(x=>x.production_enabled||x.packaging_enabled)}</select></label><label>Recipe Type<select id="r_type"><option>production</option><option>packaging</option></select></label></div><div class="note">Quantity below is component base-unit quantity required per 1 base-unit of output.</div><div id="components">${comps()}</div><button type="button" id="addComp">+ Component</button>`,async()=>{let output=$("#r_item").value,type=$("#r_type").value;let payload={item_id:output,recipe_type:type,version:r?.version||1,active:true};let rr=id?await supabase.from("recipes").update(payload).eq("id",id).select().single():await supabase.from("recipes").insert(payload).select().single();if(rr.error){message(rr.error.message,"error");return}let rid=id?id:rr.data.id;if(id)await supabase.from("recipe_lines").delete().eq("recipe_id",rid);let rows=[...document.querySelectorAll(".comp")].map(c=>({recipe_id:rid,component_item_id:c.querySelector(".c_item").value,qty_per_output:Number(c.querySelector(".c_qty").value)})).filter(x=>x.qty_per_output>0);if(rows.length){let lr=await supabase.from("recipe_lines").insert(rows);if(lr.error){message(lr.error.message,"error");return}}dialog.close();await loadAll()});setTimeout(()=>{$("#addComp").onclick=()=>{$("#components").insertAdjacentHTML("beforeend",`<div class="grid3 comp"><select class="c_item">${itemOptions()}</select><input class="c_qty" type="number" min="0.000001" step="0.000001"><button type="button" class="remove">Remove</button></div>`);bindRemove()};bindRemove();function bindRemove(){document.querySelectorAll(".remove").forEach(b=>b.onclick=()=>b.parentElement.remove())}},0)
}
function openOrder(){
 const saleItems=items.filter(x=>x.active&&x.sale_enabled);
 openDialog("Add Order",`<div class="form-grid"><label>Date<input id="o_date" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label>Order No<input id="o_no" placeholder="ORD-001"></label></div><div id="olines"></div><button type="button" id="addLine">+ Item</button><label>Notes<textarea id="o_notes"></textarea></label>`,async()=>{let rr=await supabase.from("orders").insert({order_date:$("#o_date").value,order_no:$("#o_no").value.trim()||null,notes:$("#o_notes").value.trim()||null,created_by:(await supabase.auth.getUser()).data.user?.id}).select().single();if(rr.error){message(rr.error.message,"error");return}let rows=[...document.querySelectorAll(".oline")].map(x=>({order_id:rr.data.id,item_id:x.querySelector("select").value,quantity:Number(x.querySelector("input").value)})).filter(x=>x.quantity>0);if(!rows.length){await supabase.from("orders").delete().eq("id",rr.data.id);message("Add at least one item.","error");return}let lr=await supabase.from("order_lines").insert(rows);if(lr.error){message(lr.error.message,"error");return}dialog.close();await loadAll()});setTimeout(()=>{$("#addLine").onclick=()=>{$("#olines").insertAdjacentHTML("beforeend",`<div class="grid2 oline"><select>${saleItems.map(x=>`<option value="${x.id}">${escapeHtml(x.name)}</option>`).join("")}</select><input type="number" min="0.000001" step="0.000001" placeholder="Qty"></div>`)};$("#addLine").click()},0)
}
async function issueOrder(id){
 const o=orders.find(x=>x.id===id);if(!o)return;
 const lines=orderLines.filter(l=>l.order_id===id);
 if(!lines.length)return;
 for(const l of lines){
   const out=items.find(i=>i.id===l.item_id); if(!out)continue;
   const recipe=recipes.find(r=>r.item_id===out.id&&r.active&&r.recipe_type===(out.packaging_enabled?"packaging":"production"));
   if(!recipe){alert(`No active recipe for ${out.name}`);return}
   const comps=recipeLines.filter(x=>x.recipe_id===recipe.id);
   for(const c of comps){
     const issued=Number(c.qty_per_output)*Number(l.quantity);
     const op=await supabase.from("daily_operations").upsert({operation_date:o.order_date,item_id:c.component_item_id,operation_type:recipe.recipe_type,issued_qty:issued,opening_qty:0,in_qty:0,return_qty:0,damage_qty:0,used_qty:0,closing_qty:0,used_manual:false},{onConflict:"operation_date,item_id,operation_type"}).select().single();
     if(op.error){alert(op.error.message);return}
     const costRow=await supabase.from("item_weighted_average_cost").select("weighted_avg_cost").eq("item_id",c.component_item_id).maybeSingle();
     const cpu=Number(costRow.data?.weighted_avg_cost||0);
     const led=await supabase.from("inventory_ledger").insert({event_date:o.order_date,item_id:c.component_item_id,source_type:"order_issue",source_id:o.id,qty_delta:-issued,unit_cost:cpu,value_delta:-(issued*cpu),created_by:(await supabase.auth.getUser()).data.user?.id});
     if(led.error){alert(led.error.message);return}
   }
 }
 const up=await supabase.from("orders").update({status:"issued"}).eq("id",id);if(up.error)alert(up.error.message);else await loadAll();
}
function openOperation(){
 openDialog("Record Production / Packaging Operation",`<div class="form-grid"><label>Date<input id="d_date" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label>Item<select id="d_item">${itemOptions()}</select></label><label>Type<select id="d_type"><option>production</option><option>packaging</option></select></label><label>Used<input id="d_used" type="number" min="0" value="0"></label><label>Return<input id="d_return" type="number" min="0" value="0"></label><label>Damage<input id="d_damage" type="number" min="0" value="0"></label><label>Closing<input id="d_close" type="number" min="0" value="0"></label></div>`,async()=>{let date=$("#d_date").value,it=$("#d_item").value,type=$("#d_type").value,used=Number($("#d_used").value)||0,ret=Number($("#d_return").value)||0,dam=Number($("#d_damage").value)||0,closing=Number($("#d_close").value)||0;let r=await supabase.from("daily_operations").upsert({operation_date:date,item_id:it,operation_type:type,opening_qty:0,in_qty:0,issued_qty:0,return_qty:ret,damage_qty:dam,used_qty:used,closing_qty:closing,used_manual:true},{onConflict:"operation_date,item_id,operation_type"});if(r.error){message(r.error.message,"error");return}dialog.close();await loadAll()})
}
$("#loginForm").onsubmit=async e=>{e.preventDefault();$("#authMessage").textContent="Signing in…";let r=await supabase.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});if(r.error){$("#authMessage").textContent=r.error.message;return}setSignedIn(true);await loadAll()};
$("#logoutBtn").onclick=async()=>{await supabase.auth.signOut();setSignedIn(false)};
$("#tabs").onclick=e=>{let b=e.target.closest("[data-page]");if(b){page=b.dataset.page;render()}};
$("#primaryAction").onclick=()=>({items:()=>openItem(),purchases:openPurchase,recipes:openRecipe,orders:openOrder,operations:openOperation,inventory:loadAll}[page]());
$("#closeDialog").onclick=$("#cancelDialog").onclick=()=>dialog.close();
content.onclick=async e=>{let a=e.target.closest("button");if(!a)return;if(a.dataset.editItem)openItem(a.dataset.editItem);if(a.dataset.toggleItem){let x=items.find(i=>i.id===a.dataset.toggleItem);await supabase.from("items").update({active:!x.active,updated_at:new Date().toISOString()}).eq("id",x.id);loadAll()}if(a.dataset.confirmPurchase)confirmPurchase(a.dataset.confirmPurchase);if(a.dataset.editRecipe)openRecipe(a.dataset.editRecipe);if(a.dataset.issueOrder)issueOrder(a.dataset.issueOrder)};
supabase.auth.onAuthStateChange((_e,s)=>{setSignedIn(!!s);if(s)loadAll()});
const {data:{session}}=await supabase.auth.getSession();setSignedIn(!!session);if(session)loadAll();
