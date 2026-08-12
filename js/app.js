import { supabase } from "./supabase.js";
import { qty, escapeHtml } from "./utils.js";

const $=s=>document.querySelector(s);
const content=$("#content"), status=$("#connectionStatus"), dialog=$("#dialog"), form=$("#form"), title=$("#dialogTitle"), body=$("#formBody"), msg=$("#formMessage");
let page="dashboard";
let items=[], purchases=[], recipes=[], recipeLines=[], orders=[], orderLines=[], operations=[], sales=[], saleLines=[], ledger=[];
let lang=localStorage.getItem("bakery_lang")||"my";

const T={
 en:{dashboard:"Dashboard",dashboardSub:"Business overview and monthly valuation.",items:"Item Dashboard",itemsSub:"Master items used across the ERP.",purchases:"Purchase",purchasesSub:"Receive stock and record base-unit cost.",recipes:"Recipe",recipesSub:"Production and packaging recipes.",orders:"Order",ordersSub:"Sale-enabled items flow into orders.",production:"Production",productionSub:"Production table — Issue, Return, Used, Damage, Closing.",packaging:"Packaging",packagingSub:"Packaging table — Issue, Return, Used, Damage, Closing.",sales:"Sale",salesSub:"Record sales and compare revenue.",reports:"Reports",reportsSub:"Purchase, Sale, Used, Damage and Closing values.",more:"More",moreSub:"Open modules as dedicated pages.",addItem:"+ Add Item",addPurchase:"+ Add Purchase",addRecipe:"+ Add Recipe",addOrder:"+ Add Order",addSale:"+ Add Sale",refresh:"Refresh",signIn:"Sign in",authRequired:"Supabase Auth account required.",email:"Email",password:"Password",save:"Save",cancel:"Cancel",total:"Total",active:"Active",saleEnabled:"Sale Enabled",productionEnabled:"Production Enabled",packagingEnabled:"Packaging Enabled",purchaseValue:"Purchase Value",confirmed:"Confirmed",draft:"Draft",autoIssue:"Auto Issue",saveRow:"Save Row",manual:"Manual",auto:"Auto",issue:"Issued",returned:"Return",used:"Used",damage:"Damage",closing:"Closing",opening:"Opening",inQty:"In",status:"Status",date:"Date",item:"Item",type:"Type",order:"Order",revenue:"Sale Revenue",usedValue:"Used Total Value",damageValue:"Damage Total Value",closingValue:"Closing Total Value",purchaseTotal:"Purchase Total Value",avgCost:"Weighted Avg Cost",language:"Language",itemDashboard:"Item Dashboard",productionPage:"Production Page",packagingPage:"Packaging Page",salePage:"Sale Page",reportPage:"Reports Page",open:"Open",noRecords:"No records yet.",confirmedOnly:"Confirmed purchases",saleItemsOnly:"Sale-enabled items only",orderIssued:"Order issued",noRecipe:"No active recipe found.",issuedAutoNote:"Issued is auto-calculated from Order + active Recipe. You can manually edit it before saving.",monthly:"Monthly",from:"From",to:"To"},
 my:{dashboard:"Dashboard",dashboardSub:"လုပ်ငန်းအခြေအနေနှင့် လစဉ်တန်ဖိုးများ",items:"Item Dashboard",itemsSub:"ERP တစ်ခုလုံးမှာ အသုံးပြုမည့် Item များ",purchases:"Purchase",purchasesSub:"ပစ္စည်းဝယ်ယူမှုနှင့် 1 g / 1 pcs ကုန်ကျစရိတ်",recipes:"Recipe",recipesSub:"Production နှင့် Packaging Recipe များ",orders:"Order",ordersSub:"Sale အတွက်ဖွင့်ထားသော Item များဖြင့် Order တင်ခြင်း",production:"Production",productionSub:"Production Table — Issue, Return, Used, Damage, Closing",packaging:"Packaging",packagingSub:"Packaging Table — Issue, Return, Used, Damage, Closing",sales:"Sale",salesSub:"Sale မှတ်တမ်းနှင့် ဝင်ငွေ",reports:"Reports",reportsSub:"Purchase, Sale, Used, Damage, Closing တန်ဖိုးများ",more:"More",moreSub:"Module များကို Page သီးသန့်ဖြင့်ဖွင့်ရန်",addItem:"+ Item ထည့်မည်",addPurchase:"+ Purchase ထည့်မည်",addRecipe:"+ Recipe ထည့်မည်",addOrder:"+ Order ထည့်မည်",addSale:"+ Sale ထည့်မည်",refresh:"ပြန်တင်မည်",signIn:"ဝင်မည်",authRequired:"Supabase Auth Account လိုအပ်ပါသည်",email:"Email",password:"Password",save:"သိမ်းမည်",cancel:"ပယ်ဖျက်မည်",total:"စုစုပေါင်း",active:"အသုံးပြုနေ",saleEnabled:"Sale ဖွင့်ထား",productionEnabled:"Production ဖွင့်ထား",packagingEnabled:"Packaging ဖွင့်ထား",purchaseValue:"ဝယ်ယူတန်ဖိုး",confirmed:"အတည်ပြု",draft:"မအတည်ပြုသေး",autoIssue:"Issue Auto တွက်မည်",saveRow:"Row သိမ်းမည်",manual:"Manual",auto:"Auto",issue:"Issued",returned:"Return",used:"Used",damage:"Damage",closing:"Closing",opening:"Opening",inQty:"In",status:"အခြေအနေ",date:"ရက်စွဲ",item:"ပစ္စည်း",type:"အမျိုးအစား",order:"Order",revenue:"Sale ဝင်ငွေ",usedValue:"Used စုစုပေါင်းတန်ဖိုး",damageValue:"Damage စုစုပေါင်းတန်ဖိုး",closingValue:"Closing စုစုပေါင်းတန်ဖိုး",purchaseTotal:"Purchase စုစုပေါင်းတန်ဖိုး",avgCost:"ပျမ်းမျှကုန်ကျစရိတ်",language:"ဘာသာစကား",itemDashboard:"Item Dashboard",productionPage:"Production Page",packagingPage:"Packaging Page",salePage:"Sale Page",reportPage:"Reports Page",open:"ဖွင့်မည်",noRecords:"မှတ်တမ်းမရှိသေးပါ",confirmedOnly:"အတည်ပြုပြီး Purchase များ",saleItemsOnly:"Sale ဖွင့်ထားသော Item များသာ",orderIssued:"Order ကို Issue လုပ်ပြီးပါပြီ",noRecipe:"Active Recipe မတွေ့ပါ",issuedAutoNote:"Issued ကို Order + Active Recipe အတိုင်း Auto တွက်ပေးထားပါသည်။ Save မလုပ်ခင် Manual ပြင်နိုင်ပါသည်။",monthly:"လ",from:"မှ",to:"အထိ"}
};
const t=k=>T[lang][k]||T.en[k]||k;
const money=n=>new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
const itemName=id=>items.find(x=>x.id===id)?.name||"Unknown";
const baseUnit=id=>items.find(x=>x.id===id)?.base_unit||"";
const userId=async()=> (await supabase.auth.getUser()).data.user?.id;

function setSignedIn(v){$("#authView").classList.toggle("hidden",v);$("#mainView").classList.toggle("hidden",!v);$("#logoutBtn").classList.toggle("hidden",!v)}
function message(text="",cls=""){msg.textContent=text;msg.className=`message ${cls}`}
function table(headers,rows){return `<div class="table-card"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")||`<tr><td colspan="${headers.length}" class="empty">${t("noRecords")}</td></tr>`}</tbody></table></div>`}
function toolbar(){return `<div class="toolbar"><input id="search" placeholder="${lang==="my"?"ရှာရန်…":"Search…"}"><button id="reload">${t("refresh")}</button></div>`}
function itemOptions(filter=()=>true){return items.filter(x=>x.active&&filter(x)).map(x=>`<option value="${x.id}">${escapeHtml(x.name)} (${x.base_unit})</option>`).join("")}

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
  supabase.from("sales").select("*").order("sale_date",{ascending:false}),
  supabase.from("sale_lines").select("*"),
  supabase.from("inventory_ledger").select("*").order("event_date",{ascending:false})
 ];
 const r=await Promise.all(qs), bad=r.find(x=>x.error);
 if(bad){status.textContent="Database error";status.className="status danger-text";renderError(bad.error.message);return}
 [items,purchases,recipes,recipeLines,orders,orderLines,operations,sales,saleLines,ledger]=r.map(x=>x.data||[]);
 status.textContent="Supabase connected";status.className="status success";render();
}
function renderError(e){content.innerHTML=`<div class="card"><strong>Database error</strong><p class="muted">${escapeHtml(e)}</p><button id="retry">${t("refresh")}</button></div>`;$("#retry").onclick=loadAll}

const pageMeta={
 dashboard:["dashboard","dashboardSub",""],
 items:["items","itemsSub","addItem"],
 purchases:["purchases","purchasesSub","addPurchase"],
 recipes:["recipes","recipesSub","addRecipe"],
 orders:["orders","ordersSub","addOrder"],
 production:["production","productionSub","autoIssue"],
 packaging:["packaging","packagingSub","autoIssue"],
 sales:["sales","salesSub","addSale"],
 reports:["reports","reportsSub","refresh"],
 more:["more","moreSub",""]
};
function render(){
 const [a,b,c]=pageMeta[page];$("#pageTitle").textContent=t(a);$("#pageSub").textContent=t(b);
 $("#primaryAction").textContent=c?t(c):"";
 $("#primaryAction").classList.toggle("hidden",!c);
 document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 const fn={dashboard:renderDashboard,items:renderItems,purchases:renderPurchases,recipes:renderRecipes,orders:renderOrders,production:()=>renderOperations("production"),packaging:()=>renderOperations("packaging"),sales:renderSales,reports:renderReports,more:renderMore}[page];
 fn();
}

function renderDashboard(){
 const purchase=purchases.filter(x=>x.confirmed).reduce((s,x)=>s+Number(x.total_cost),0);
 const revenue=sales.reduce((s,x)=>s+Number(x.total_amount),0);
 const used=operations.reduce((s,x)=>s+Number(x.used_qty)*avgCost(x.item_id),0);
 const damage=operations.reduce((s,x)=>s+Number(x.damage_qty)*avgCost(x.item_id),0);
 const closing=operations.reduce((s,x)=>s+Number(x.closing_qty)*avgCost(x.item_id),0);
 content.innerHTML=`<div class="kpi-grid">
 <div class="kpi-card"><strong>${money(purchase)}</strong><span>${t("purchaseTotal")}</span></div>
 <div class="kpi-card"><strong>${money(revenue)}</strong><span>${t("revenue")}</span></div>
 <div class="kpi-card"><strong>${money(used)}</strong><span>${t("usedValue")}</span></div>
 <div class="kpi-card"><strong>${money(damage)}</strong><span>${t("damageValue")}</span></div>
 </div>
 <div class="report-grid" style="margin-top:12px">
 <div class="card"><h3>${t("closingValue")}</h3><div class="kpi">${money(closing)} MMK</div><p class="muted">${lang==="my"?"Production + Packaging Closing Qty × Weighted Average Cost":"Production + Packaging closing quantity × weighted average cost"}</p></div>
 <div class="card"><h3>${lang==="my"?"Order / Sale အခြေအနေ":"Order / Sale Status"}</h3><p>${orders.length} Orders · ${sales.length} Sales</p><p>${operations.filter(x=>x.operation_type==="production").length} Production rows · ${operations.filter(x=>x.operation_type==="packaging").length} Packaging rows</p></div>
 </div>`;
}
function avgCost(itemId){
 const ps=purchases.filter(x=>x.item_id===itemId&&x.confirmed);
 const q=ps.reduce((s,x)=>s+Number(x.base_quantity),0),v=ps.reduce((s,x)=>s+Number(x.total_cost),0);
 return q?v/q:0;
}

function renderItems(){
 const a=items.filter(x=>x.active);
 content.innerHTML=`<div class="stats"><div class="stat"><strong>${items.length}</strong><span>${t("total")}</span></div><div class="stat"><strong>${a.length}</strong><span>${t("active")}</span></div><div class="stat"><strong>${items.filter(x=>x.sale_enabled&&x.active).length}</strong><span>${t("saleEnabled")}</span></div><div class="stat"><strong>${items.filter(x=>x.production_enabled&&x.active).length}/${items.filter(x=>x.packaging_enabled&&x.active).length}</strong><span>Production / Packaging</span></div></div>${toolbar()}<div id="itemTable"></div>`;
 const draw=()=>{let q=$("#search").value.toLowerCase();let arr=items.filter(x=>[x.name,x.code,x.category].some(v=>String(v||"").toLowerCase().includes(q)));$("#itemTable").innerHTML=table(["Item","Code","Category","Unit","Flags","Status","Action"],arr.map(x=>`<tr><td><strong>${escapeHtml(x.name)}</strong></td><td>${escapeHtml(x.code||"—")}</td><td>${escapeHtml(x.category||"—")}</td><td>${x.purchase_unit} → ${x.base_unit}<br>×${qty(x.unit_factor_to_base)}</td><td><span class="badge ${x.sale_enabled?"on":"off"}">Sale</span><span class="badge ${x.production_enabled?"on":"off"}">Prod</span><span class="badge ${x.packaging_enabled?"on":"off"}">Pack</span></td><td>${x.active?"Active":"Inactive"}</td><td><button data-edit-item="${x.id}">Edit</button> <button data-toggle-item="${x.id}">${x.active?"Deactivate":"Activate"}</button></td></tr>`))};draw();$("#search").oninput=draw;$("#reload").onclick=loadAll;
}
function renderPurchases(){
 content.innerHTML=`<div class="stats"><div class="stat"><strong>${purchases.length}</strong><span>${t("total")}</span></div><div class="stat"><strong>${purchases.filter(x=>x.confirmed).length}</strong><span>${t("confirmed")}</span></div><div class="stat"><strong>${money(purchases.reduce((s,x)=>s+Number(x.total_cost),0))}</strong><span>${t("purchaseValue")}</span></div><div class="stat"><strong>${money(purchases.filter(x=>x.confirmed).reduce((s,x)=>s+Number(x.total_cost),0))}</strong><span>${t("confirmedOnly")}</span></div></div>${toolbar()}<div id="purchaseTable"></div>`;
 const draw=()=>{let q=$("#search").value.toLowerCase();let arr=purchases.filter(x=>itemName(x.item_id).toLowerCase().includes(q)||String(x.supplier||"").toLowerCase().includes(q));$("#purchaseTable").innerHTML=table(["Date","Item","Qty","Base Qty","Total","Cost/Base","Supplier","Status","Action"],arr.map(x=>`<tr><td>${x.purchase_date}</td><td>${escapeHtml(itemName(x.item_id))}</td><td>${qty(x.quantity)} ${x.purchase_unit}</td><td>${qty(x.base_quantity)} ${baseUnit(x.item_id)}</td><td>${money(x.total_cost)} MMK</td><td>${money(x.cost_per_base_unit)} / ${baseUnit(x.item_id)}</td><td>${escapeHtml(x.supplier||"—")}</td><td>${x.confirmed?'<span class="badge on">Confirmed</span>':'<span class="badge off">Draft</span>'}</td><td>${x.confirmed?"—":`<button data-confirm-purchase="${x.id}">Confirm</button>`}</td></tr>`))};draw();$("#search").oninput=draw;$("#reload").onclick=loadAll;
}
function renderRecipes(){
 content.innerHTML=`${toolbar()}<div id="recipeTable"></div>`;const draw=()=>{$("#recipeTable").innerHTML=table(["Output Item","Type","Version","Components","Status","Action"],recipes.map(r=>`<tr><td>${escapeHtml(itemName(r.item_id))}</td><td>${r.recipe_type}</td><td>${r.version}</td><td>${recipeLines.filter(l=>l.recipe_id===r.id).length}</td><td>${r.active?"Active":"Inactive"}</td><td><button data-edit-recipe="${r.id}">Edit</button></td></tr>`))};draw();$("#reload").onclick=loadAll;
}
function renderOrders(){
 const saleItems=items.filter(x=>x.active&&x.sale_enabled);
 content.innerHTML=`<div class="note">${t("saleItemsOnly")}: ${saleItems.length}</div>${toolbar()}<div id="orderTable"></div>`;
 const draw=()=>{$("#orderTable").innerHTML=table(["Date","Order No","Status","Items","Action"],orders.map(o=>{let ls=orderLines.filter(l=>l.order_id===o.id);return `<tr><td>${o.order_date}</td><td>${escapeHtml(o.order_no||"—")}</td><td><span class="badge">${o.status}</span></td><td>${ls.map(l=>`${escapeHtml(itemName(l.item_id))} × ${qty(l.quantity)}`).join("<br>")}</td><td>${o.status==="pending"?`<button data-issue-order="${o.id}">Issue</button>`:"—"}</td></tr>`}))};draw();$("#reload").onclick=loadAll;
}

function operationRows(type){
 return operations.filter(x=>x.operation_type===type);
}
function autoIssuedForDate(type,date,itemId){
 let total=0;
 for(const o of orders.filter(x=>x.order_date===date && x.status!=="cancelled")){
   for(const l of orderLines.filter(z=>z.order_id===o.id)){
     const out=items.find(i=>i.id===l.item_id); if(!out) continue;
     const recipesFor=recipes.filter(r=>r.item_id===out.id&&r.active&&r.recipe_type===type);
     for(const r of recipesFor){
       for(const line of recipeLines.filter(z=>z.recipe_id===r.id&&z.component_item_id===itemId)){
         total += Number(l.quantity)*Number(line.qty_per_output);
       }
     }
   }
 }
 return total;
}
function renderOperations(type){
 const titleKey=type==="production"?"production":"packaging";
 content.innerHTML=`<div class="note">${t("issuedAutoNote")}</div><div class="toolbar"><input id="opDate" type="date" value="${new Date().toISOString().slice(0,10)}"><button id="autoIssueAll">${t("autoIssue")}</button><button id="reload">${t("refresh")}</button></div><div id="opTable"></div>`;
 const draw=()=>{
   const date=$("#opDate").value;
   const arr=operationRows(type).filter(x=>x.operation_date===date);
   const componentItems=items.filter(i=>i.active && (i.production_enabled||i.packaging_enabled));
   const map=new Map(arr.map(x=>[x.item_id,x]));
   componentItems.forEach(i=>{if(!map.has(i.id)){const auto=autoIssuedForDate(type,date,i.id);if(auto>0)map.set(i.id,{id:null,operation_date:date,item_id:i.id,operation_type:type,opening_qty:0,in_qty:0,issued_qty:auto,return_qty:0,damage_qty:0,used_qty:0,closing_qty:0,used_manual:false,virtual:true})}});
   const rows=[...map.values()];
   $("#opTable").innerHTML=table(["Date","Item","Opening","In","Issued","Return","Used","Damage","Closing","Mode","Action"],rows.map(x=>{
     const close=Math.max(0,Number(x.opening_qty)+Number(x.in_qty)-Number(x.issued_qty)+Number(x.return_qty)-Number(x.used_qty)-Number(x.damage_qty));
     return `<tr data-op-row="${x.id||"new-"+x.item_id}">
       <td>${x.operation_date}</td><td><strong>${escapeHtml(itemName(x.item_id))}</strong> ${x.virtual?'<span class="badge on">Auto</span>':''}</td>
       <td><input data-k="opening_qty" value="${qty(x.opening_qty)}" type="number" min="0" step="0.000001"></td>
       <td><input data-k="in_qty" value="${qty(x.in_qty)}" type="number" min="0" step="0.000001"></td>
       <td><input data-k="issued_qty" value="${qty(x.issued_qty)}" type="number" min="0" step="0.000001"></td>
       <td><input data-k="return_qty" value="${qty(x.return_qty)}" type="number" min="0" step="0.000001"></td>
       <td><input data-k="used_qty" value="${qty(x.used_qty)}" type="number" min="0" step="0.000001"></td>
       <td><input data-k="damage_qty" value="${qty(x.damage_qty)}" type="number" min="0" step="0.000001"></td>
       <td class="close-cell">${qty(close)}</td>
       <td>${x.used_manual?'<span class="badge">Manual</span>':'<span class="badge on">Auto/Normal</span>'}</td>
       <td><button data-save-op="1" data-item="${x.item_id}">${t("saveRow")}</button></td>
     </tr>`}));
   $("#opTable").querySelectorAll("tr[data-op-row]").forEach(tr=>tr.querySelectorAll("input").forEach(inp=>inp.addEventListener("input",()=>{const v=k=>Number(tr.querySelector(`[data-k="${k}"]`).value)||0;tr.querySelector(".close-cell").textContent=qty(Math.max(0,v("opening_qty")+v("in_qty")-v("issued_qty")+v("return_qty")-v("used_qty")-v("damage_qty")))})));
 };
 draw();
 $("#opDate").onchange=draw;$("#reload").onclick=loadAll;
 $("#autoIssueAll").onclick=async()=>{const date=$("#opDate").value;const components=items.filter(i=>i.active);for(const i of components){const auto=autoIssuedForDate(type,date,i.id);if(auto<=0)continue;const existing=operations.find(x=>x.operation_date===date&&x.item_id===i.id&&x.operation_type===type);if(existing){await supabase.from("daily_operations").update({issued_qty:auto,used_manual:false}).eq("id",existing.id)}else{await supabase.from("daily_operations").insert({operation_date:date,item_id:i.id,operation_type:type,opening_qty:0,in_qty:0,issued_qty:auto,return_qty:0,damage_qty:0,used_qty:0,closing_qty:0,used_manual:false})}}await loadAll()};
}
async async function saveOperationRow(btn){
 const tr=btn.closest("tr"), itemId=btn.dataset.item, type=page, date=$("#opDate").value;
 const n=k=>Number(tr.querySelector(`[data-k="${k}"]`).value)||0;
 const payload={operation_date:date,item_id:itemId,operation_type:type,opening_qty:n("opening_qty"),in_qty:n("in_qty"),issued_qty:n("issued_qty"),return_qty:n("return_qty"),damage_qty:n("damage_qty"),used_qty:n("used_qty"),closing_qty:Math.max(0,n("opening_qty")+n("in_qty")-n("issued_qty")+n("return_qty")-n("used_qty")-n("damage_qty")),used_manual:true};
 const r=await supabase.from("daily_operations").upsert(payload,{onConflict:"operation_date,item_id,operation_type"});
 if(r.error)alert(r.error.message);else await loadAll();
}

function renderSales(){
 content.innerHTML=`${toolbar()}<div id="saleTable"></div>`;
 const draw=()=>{$("#saleTable").innerHTML=table(["Date","Shop","Items","Total Amount","Action"],sales.map(s=>`<tr><td>${s.sale_date}</td><td>${escapeHtml(s.shop_name||"—")}</td><td>${saleLines.filter(l=>l.sale_id===s.id).map(l=>`${escapeHtml(itemName(l.item_id))} × ${qty(l.quantity)} @ ${money(l.unit_price)}`).join("<br>")}</td><td>${money(s.total_amount)} MMK</td><td><button data-edit-sale="${s.id}">Edit</button></td></tr>`))};draw();$("#reload").onclick=loadAll;
}
function renderReports(){
 const purchase=purchases.filter(x=>x.confirmed).reduce((s,x)=>s+Number(x.total_cost),0), revenue=sales.reduce((s,x)=>s+Number(x.total_amount),0);
 const used=operations.reduce((s,x)=>s+Number(x.used_qty)*avgCost(x.item_id),0), damage=operations.reduce((s,x)=>s+Number(x.damage_qty)*avgCost(x.item_id),0), closing=operations.reduce((s,x)=>s+Number(x.closing_qty)*avgCost(x.item_id),0);
 content.innerHTML=`<div class="kpi-grid"><div class="kpi-card"><strong>${money(purchase)}</strong><span>${t("purchaseTotal")}</span></div><div class="kpi-card"><strong>${money(revenue)}</strong><span>${t("revenue")}</span></div><div class="kpi-card"><strong>${money(used)}</strong><span>${t("usedValue")}</span></div><div class="kpi-card"><strong>${money(damage)}</strong><span>${t("damageValue")}</span></div></div><div class="report-grid" style="margin-top:12px"><div class="card"><h3>${t("closingValue")}</h3><strong>${money(closing)} MMK</strong></div><div class="card"><h3>${t("revenue")}-${t("purchaseValue")}</h3><strong>${money(revenue-purchase)} MMK</strong><p class="muted">${lang==="my"?"ရိုးရိုး နှိုင်းယှဉ်ချက် — Profit မဟုတ်ပါ":"Simple comparison — not a profit calculation"}</p></div></div>${toolbar()}<div id="reportTable"></div>`;
 const draw=()=>{$("#reportTable").innerHTML=table(["Item","Avg Cost/Base","Used Qty","Used Value","Damage Qty","Damage Value","Closing Qty","Closing Value"],items.map(i=>{const ops=operations.filter(o=>o.item_id===i.id),uc=ops.reduce((s,o)=>s+Number(o.used_qty),0),dc=ops.reduce((s,o)=>s+Number(o.damage_qty),0),cc=ops.reduce((s,o)=>s+Number(o.closing_qty),0),a=avgCost(i.id);return `<tr><td>${escapeHtml(i.name)}</td><td>${money(a)}</td><td>${qty(uc)} ${i.base_unit}</td><td>${money(uc*a)}</td><td>${qty(dc)} ${i.base_unit}</td><td>${money(dc*a)}</td><td>${qty(cc)} ${i.base_unit}</td><td>${money(cc*a)}</td></tr>`}))};draw();$("#reload").onclick=loadAll;
}
function renderMore(){
 content.innerHTML=`<div class="more-grid">
 <div class="more-card"><h3>${t("itemDashboard")}</h3><p class="muted">${t("itemsSub")}</p><button data-goto="items">${t("open")}</button></div>
 <div class="more-card"><h3>${t("productionPage")}</h3><p class="muted">${t("productionSub")}</p><button data-goto="production">${t("open")}</button></div>
 <div class="more-card"><h3>${t("packagingPage")}</h3><p class="muted">${t("packagingSub")}</p><button data-goto="packaging">${t("open")}</button></div>
 <div class="more-card"><h3>${t("salePage")}</h3><p class="muted">${t("salesSub")}</p><button data-goto="sales">${t("open")}</button></div>
 <div class="more-card"><h3>${t("reportPage")}</h3><p class="muted">${t("reportsSub")}</p><button data-goto="reports">${t("open")}</button></div>
 </div>`;
}

function openDialog(tt,html,save){title.textContent=tt;body.innerHTML=html;message("");form.onsubmit=async e=>{e.preventDefault();await save()};dialog.showModal()}
function openItem(id=null){
 const x=id&&items.find(i=>i.id===id);
 openDialog(id?"Edit Item":"Add Item",`<div class="form-grid"><label>Name*<input id="f_name" required value="${escapeHtml(x?.name||"")}"></label><label>Code<input id="f_code" value="${escapeHtml(x?.code||"")}"></label><label>Category<input id="f_cat" value="${escapeHtml(x?.category||"")}"></label><label>Base Unit<select id="f_base"><option ${x?.base_unit==="g"?"selected":""}>g</option><option ${x?.base_unit==="pcs"?"selected":""}>pcs</option></select></label><label>Purchase Unit<select id="f_pu"><option>g</option><option>kg</option><option>pcs</option><option>box</option><option>pack</option></select></label><label>Unit → Base Factor<input id="f_factor" type="number" min="0.000001" step="0.000001" value="${x?.unit_factor_to_base||1}"></label><label>Minimum Stock<input id="f_min" type="number" min="0" value="${x?.min_stock||0}"></label></div><div class="checks"><label><input id="f_sale" type="checkbox" ${x?.sale_enabled?"checked":""}> Sale</label><label><input id="f_prod" type="checkbox" ${x?.production_enabled?"checked":""}> Production</label><label><input id="f_pack" type="checkbox" ${x?.packaging_enabled?"checked":""}> Packaging</label><label><input id="f_active" type="checkbox" ${x?x.active?"checked":"":"checked"}> Active</label></div>`,async()=>{const p={name:$("#f_name").value.trim(),code:$("#f_code").value.trim()||null,category:$("#f_cat").value.trim()||null,base_unit:$("#f_base").value,purchase_unit:$("#f_pu").value,unit_factor_to_base:Number($("#f_factor").value),min_stock:Number($("#f_min").value)||0,sale_enabled:$("#f_sale").checked,production_enabled:$("#f_prod").checked,packaging_enabled:$("#f_pack").checked,active:$("#f_active").checked,updated_at:new Date().toISOString()};const r=id?await supabase.from("items").update(p).eq("id",id):await supabase.from("items").insert(p);if(r.error){message(r.error.message,"error");return}dialog.close();await loadAll()});
}
function openPurchase(){
 openDialog(t("addPurchase"),`<div class="form-grid"><label>Date<input id="p_date" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label>Item<select id="p_item">${itemOptions()}</select></label><label>Qty<input id="p_qty" type="number" min="0.000001" step="0.000001"></label><label>Purchase Unit<select id="p_unit"><option>kg</option><option>g</option><option>pcs</option><option>box</option><option>pack</option></select></label><label>Total Cost (MMK)<input id="p_cost" type="number" min="0" step="0.01"></label><label>Supplier<input id="p_supplier"></label></div><p id="calc" class="note"></p><label>Notes<textarea id="p_notes"></textarea></label>`,async()=>{const it=items.find(i=>i.id===$("#p_item").value),q=Number($("#p_qty").value),u=$("#p_unit").value,c=Number($("#p_cost").value),factor=unitFactor(it,u);if(!it||!q||factor===null){message("Invalid item / unit conversion.","error");return}const base=q*factor,cpu=base?c/base:0;const r=await supabase.from("purchases").insert({purchase_date:$("#p_date").value,item_id:it.id,quantity:q,purchase_unit:u,base_quantity:base,total_cost:c,cost_per_base_unit:cpu,supplier:$("#p_supplier").value.trim()||null,notes:$("#p_notes").value.trim()||null,created_by:await userId()});if(r.error){message(r.error.message,"error");return}dialog.close();await loadAll()});
 setTimeout(()=>{const update=()=>{const it=items.find(i=>i.id===$("#p_item").value),q=Number($("#p_qty").value),u=$("#p_unit").value,c=Number($("#p_cost").value),f=it?unitFactor(it,u):null;if(f!==null){const b=q*f;$("#calc").textContent=`${qty(b)} ${it.base_unit} · ${money(b?c/b:0)} MMK / ${it.base_unit}`}};["p_item","p_qty","p_unit","p_cost"].forEach(id=>$("#"+id).addEventListener("input",update));update()},0)
}
function unitFactor(it,u){if(!it)return null;if(u===it.base_unit)return 1;if(u==="kg"&&it.base_unit==="g")return 1000;if(u==="g"&&it.base_unit==="g")return 1;if((u==="box"||u==="pack")&&it.base_unit==="pcs")return Number(it.unit_factor_to_base)||null;if(u==="pcs"&&it.base_unit==="pcs")return 1;return null}
async async function confirmPurchase(id){const p=purchases.find(x=>x.id===id);if(!p||p.confirmed)return;const r=await supabase.from("purchases").update({confirmed:true,applied:true}).eq("id",id);if(r.error){alert(r.error.message);return}const led=await supabase.from("inventory_ledger").insert({event_date:p.purchase_date,item_id:p.item_id,source_type:"purchase",source_id:p.id,qty_delta:p.base_quantity,unit_cost:p.cost_per_base_unit,value_delta:p.total_cost,created_by:await userId()});if(led.error){await supabase.from("purchases").update({confirmed:false,applied:false}).eq("id",id);alert(led.error.message);return}await loadAll()}

function openRecipe(id=null){
 const r=id&&recipes.find(x=>x.id===id), ls=r?recipeLines.filter(l=>l.recipe_id===id):[];
 openDialog(id?"Edit Recipe":t("addRecipe"),`<div class="form-grid"><label>Output Item<select id="r_item">${itemOptions(x=>x.production_enabled||x.packaging_enabled)}</select></label><label>Type<select id="r_type"><option value="production">production</option><option value="packaging">packaging</option></select></label></div><p class="note">qty_per_output = component base-unit quantity per 1 output base unit.</p><div id="components">${ls.map(l=>`<div class="grid3 comp"><select class="c_item">${itemOptions(x=>x.id!==r?.item_id)}</select><input class="c_qty" type="number" value="${l.qty_per_output}" min="0" step="0.000001"><button type="button" class="remove">Remove</button></div>`).join("")}</div><button type="button" id="addComp">+ Component</button>`,async()=>{const payload={item_id:$("#r_item").value,recipe_type:$("#r_type").value,version:r?.version||1,active:true};const rr=id?await supabase.from("recipes").update(payload).eq("id",id).select().single():await supabase.from("recipes").insert(payload).select().single();if(rr.error){message(rr.error.message,"error");return}const rid=id?rr.data.id:rr.data.id;if(id)await supabase.from("recipe_lines").delete().eq("recipe_id",rid);const rows=[...document.querySelectorAll(".comp")].map(c=>({recipe_id:rid,component_item_id:c.querySelector(".c_item").value,qty_per_output:Number(c.querySelector(".c_qty").value)})).filter(x=>x.qty_per_output>0);if(rows.length){const lr=await supabase.from("recipe_lines").insert(rows);if(lr.error){message(lr.error.message,"error");return}}dialog.close();await loadAll()});
 setTimeout(()=>{$("#addComp").onclick=()=>{$("#components").insertAdjacentHTML("beforeend",`<div class="grid3 comp"><select class="c_item">${itemOptions()}</select><input class="c_qty" type="number" min="0" step="0.000001"><button type="button" class="remove">Remove</button></div>`);bind()};bind();function bind(){document.querySelectorAll(".remove").forEach(b=>b.onclick=()=>b.parentElement.remove())}},0)
}

function openOrder(){
 const saleItems=items.filter(x=>x.active&&x.sale_enabled);
 openDialog(t("addOrder"),`<div class="form-grid"><label>Date<input id="o_date" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label>Order No<input id="o_no"></label></div><div id="olines"></div><button type="button" id="addLine">+ Item</button><label>Notes<textarea id="o_notes"></textarea></label>`,async()=>{const rr=await supabase.from("orders").insert({order_date:$("#o_date").value,order_no:$("#o_no").value.trim()||null,notes:$("#o_notes").value.trim()||null,created_by:await userId()}).select().single();if(rr.error){message(rr.error.message,"error");return}const rows=[...document.querySelectorAll(".oline")].map(x=>({order_id:rr.data.id,item_id:x.querySelector("select").value,quantity:Number(x.querySelector("input").value)})).filter(x=>x.quantity>0);if(!rows.length){await supabase.from("orders").delete().eq("id",rr.data.id);message("Add at least one item.","error");return}const lr=await supabase.from("order_lines").insert(rows);if(lr.error){message(lr.error.message,"error");return}dialog.close();await loadAll()});setTimeout(()=>{$("#addLine").onclick=()=>{$("#olines").insertAdjacentHTML("beforeend",`<div class="grid2 oline"><select>${saleItems.map(x=>`<option value="${x.id}">${escapeHtml(x.name)}</option>`).join("")}</select><input type="number" min="0.000001" step="0.000001" placeholder="Qty"></div>`)};$("#addLine").click()},0)
}
async async function issueOrder(id){
 const o=orders.find(x=>x.id===id), lines=orderLines.filter(l=>l.order_id===id); if(!o||!lines.length)return;
 const types=new Set();
 for(const l of lines){const out=items.find(i=>i.id===l.item_id);if(!out)continue;if(out.production_enabled)types.add("production");if(out.packaging_enabled)types.add("packaging");}
 for(const type of types){for(const l of lines){const out=items.find(i=>i.id===l.item_id);if(!out)continue;const recipe=recipes.find(r=>r.item_id===out.id&&r.active&&r.recipe_type===type);if(!recipe)continue;for(const c of recipeLines.filter(x=>x.recipe_id===recipe.id)){const issued=Number(c.qty_per_output)*Number(l.quantity);const existing=operations.find(x=>x.operation_date===o.order_date&&x.item_id===c.component_item_id&&x.operation_type===type);const payload={operation_date:o.order_date,item_id:c.component_item_id,operation_type:type,opening_qty:existing?.opening_qty||0,in_qty:existing?.in_qty||0,issued_qty:Number(existing?.issued_qty||0)+issued,return_qty:existing?.return_qty||0,damage_qty:existing?.damage_qty||0,used_qty:existing?.used_qty||0,closing_qty:existing?.closing_qty||0,used_manual:false};const r=await supabase.from("daily_operations").upsert(payload,{onConflict:"operation_date,item_id,operation_type"});if(r.error){alert(r.error.message);return}}}}
 const r=await supabase.from("orders").update({status:"issued"}).eq("id",id);if(r.error)alert(r.error.message);else await loadAll();
}

function openSale(id=null){
 const s=id&&sales.find(x=>x.id===id), ls=s?saleLines.filter(l=>l.sale_id===id):[];
 openDialog(id?"Edit Sale":t("addSale"),`<div class="form-grid"><label>Date<input id="s_date" type="date" value="${s?.sale_date||new Date().toISOString().slice(0,10)}"></label><label>Shop<input id="s_shop" value="${escapeHtml(s?.shop_name||"")}"></label></div><div id="slines">${ls.map(l=>`<div class="grid3 sline"><select>${items.filter(x=>x.active&&x.sale_enabled).map(x=>`<option value="${x.id}" ${x.id===l.item_id?"selected":""}>${escapeHtml(x.name)}</option>`).join("")}</select><input class="s_qty" type="number" min="0" step="0.000001" value="${l.quantity}"><input class="s_price" type="number" min="0" step="0.01" value="${l.unit_price}"></div>`).join("")}</div><button type="button" id="addSaleLine">+ Item</button>`,async()=>{let sid=s?.id;if(sid){await supabase.from("sale_lines").delete().eq("sale_id",sid);const up=await supabase.from("sales").update({sale_date:$("#s_date").value,shop_name:$("#s_shop").value.trim()||null,total_amount:0}).eq("id",sid);if(up.error){message(up.error.message,"error");return}}else{const rr=await supabase.from("sales").insert({sale_date:$("#s_date").value,shop_name:$("#s_shop").value.trim()||null,total_amount:0,created_by:await userId()}).select().single();if(rr.error){message(rr.error.message,"error");return}sid=rr.data.id}const rows=[...document.querySelectorAll(".sline")].map(x=>({sale_id:sid,item_id:x.querySelector("select").value,quantity:Number(x.querySelector(".s_qty").value),unit_price:Number(x.querySelector(".s_price").value)})).filter(x=>x.quantity>0);if(!rows.length){message("Add at least one sale item.","error");return}const lr=await supabase.from("sale_lines").insert(rows);if(lr.error){message(lr.error.message,"error");return}const total=rows.reduce((a,x)=>a+x.quantity*x.unit_price,0);const up2=await supabase.from("sales").update({total_amount:total}).eq("id",sid);if(up2.error){message(up2.error.message,"error");return}dialog.close();await loadAll()});
 setTimeout(()=>{$("#addSaleLine").onclick=()=>{$("#slines").insertAdjacentHTML("beforeend",`<div class="grid3 sline"><select>${items.filter(x=>x.active&&x.sale_enabled).map(x=>`<option value="${x.id}">${escapeHtml(x.name)}</option>`).join("")}</select><input class="s_qty" type="number" min="0" step="0.000001"><input class="s_price" type="number" min="0" step="0.01"></div>`) }},0)
}

function renderSales(){
 content.innerHTML=`${toolbar()}<div id="saleTable"></div>`;const draw=()=>{$("#saleTable").innerHTML=table(["Date","Shop","Items","Total Amount","Action"],sales.map(s=>`<tr><td>${s.sale_date}</td><td>${escapeHtml(s.shop_name||"—")}</td><td>${saleLines.filter(l=>l.sale_id===s.id).map(l=>`${escapeHtml(itemName(l.item_id))} × ${qty(l.quantity)} @ ${money(l.unit_price)}`).join("<br>")}</td><td>${money(s.total_amount)} MMK</td><td><button data-edit-sale="${s.id}">Edit</button></td></tr>`))};draw();$("#reload").onclick=loadAll;
}
function renderReports(){
 const purchase=purchases.filter(x=>x.confirmed).reduce((s,x)=>s+Number(x.total_cost),0), revenue=sales.reduce((s,x)=>s+Number(x.total_amount),0);
 const used=operations.reduce((s,x)=>s+Number(x.used_qty)*avgCost(x.item_id),0), damage=operations.reduce((s,x)=>s+Number(x.damage_qty)*avgCost(x.item_id),0), closing=operations.reduce((s,x)=>s+Number(x.closing_qty)*avgCost(x.item_id),0);
 content.innerHTML=`<div class="kpi-grid"><div class="kpi-card"><strong>${money(purchase)}</strong><span>${t("purchaseTotal")}</span></div><div class="kpi-card"><strong>${money(revenue)}</strong><span>${t("revenue")}</span></div><div class="kpi-card"><strong>${money(used)}</strong><span>${t("usedValue")}</span></div><div class="kpi-card"><strong>${money(damage)}</strong><span>${t("damageValue")}</span></div></div><div class="report-grid" style="margin-top:12px"><div class="card"><h3>${t("closingValue")}</h3><strong>${money(closing)} MMK</strong></div><div class="card"><h3>${t("revenue")}-${t("purchaseValue")}</h3><strong>${money(revenue-purchase)} MMK</strong><p class="muted">${lang==="my"?"ရိုးရိုးနှိုင်းယှဉ်ချက် — Profit မဟုတ်ပါ":"Simple comparison — not a profit calculation"}</p></div></div>${toolbar()}<div id="reportTable"></div>`;
 const draw=()=>{$("#reportTable").innerHTML=table(["Item","Avg Cost/Base","Used Qty","Used Value","Damage Qty","Damage Value","Closing Qty","Closing Value"],items.map(i=>{const ops=operations.filter(o=>o.item_id===i.id),uc=ops.reduce((s,o)=>s+Number(o.used_qty),0),dc=ops.reduce((s,o)=>s+Number(o.damage_qty),0),cc=ops.reduce((s,o)=>s+Number(o.closing_qty),0),a=avgCost(i.id);return `<tr><td>${escapeHtml(i.name)}</td><td>${money(a)}</td><td>${qty(uc)} ${i.base_unit}</td><td>${money(uc*a)}</td><td>${qty(dc)} ${i.base_unit}</td><td>${money(dc*a)}</td><td>${qty(cc)} ${i.base_unit}</td><td>${money(cc*a)}</td></tr>`}))};draw();$("#reload").onclick=loadAll;
}
function renderMore(){
 content.innerHTML=`<div class="more-grid">
 <div class="more-card"><h3>${t("itemDashboard")}</h3><p class="muted">${t("itemsSub")}</p><button data-goto="items">${t("open")}</button></div>
 <div class="more-card"><h3>${t("productionPage")}</h3><p class="muted">${t("productionSub")}</p><button data-goto="production">${t("open")}</button></div>
 <div class="more-card"><h3>${t("packagingPage")}</h3><p class="muted">${t("packagingSub")}</p><button data-goto="packaging">${t("open")}</button></div>
 <div class="more-card"><h3>${t("salePage")}</h3><p class="muted">${t("salesSub")}</p><button data-goto="sales">${t("open")}</button></div>
 <div class="more-card"><h3>${t("reportPage")}</h3><p class="muted">${t("reportsSub")}</p><button data-goto="reports">${t("open")}</button></div>
 </div>`;
}

$("#loginForm").onsubmit=async e=>{e.preventDefault();$("#authMessage").textContent="Signing in…";const r=await supabase.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});if(r.error){$("#authMessage").textContent=r.error.message;return}setSignedIn(true);await loadAll()};
$("#logoutBtn").onclick=async()=>{await supabase.auth.signOut();setSignedIn(false)};
$("#langBtn").onclick=()=>{lang=lang==="my"?"en":"my";localStorage.setItem("bakery_lang",lang);$("#langBtn").textContent=lang==="my"?"English":"မြန်မာ";applyLanguage();render()};
function applyLanguage(){document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=t(el.dataset.i18n));$("#langBtn").textContent=lang==="my"?"English":"မြန်မာ"}
$("#tabs").onclick=e=>{const b=e.target.closest("[data-page]");if(b){page=b.dataset.page;render()}};
$("#primaryAction").onclick=()=>({items:()=>openItem(),purchases:openPurchase,recipes:openRecipe,orders:openOrder,production:()=>autoIssueCurrent("production"),packaging:()=>autoIssueCurrent("packaging"),sales:openSale,reports:loadAll}[page]());
async function autoIssueCurrent(type){const date=new Date().toISOString().slice(0,10);for(const i of items.filter(x=>x.active)){const auto=autoIssuedForDate(type,date,i.id);if(auto<=0)continue;const existing=operations.find(x=>x.operation_date===date&&x.item_id===i.id&&x.operation_type===type);const p={operation_date:date,item_id:i.id,operation_type:type,opening_qty:existing?.opening_qty||0,in_qty:existing?.in_qty||0,issued_qty:auto,return_qty:existing?.return_qty||0,damage_qty:existing?.damage_qty||0,used_qty:existing?.used_qty||0,closing_qty:existing?.closing_qty||0,used_manual:false};await supabase.from("daily_operations").upsert(p,{onConflict:"operation_date,item_id,operation_type"})}await loadAll()};
$("#closeDialog").onclick=$("#cancelDialog").onclick=()=>dialog.close();
content.onclick=async e=>{
 const b=e.target.closest("button"); if(!b)return;
 if(b.dataset.goto){page=b.dataset.goto;render();return}
 if(b.dataset.editItem){openItem(b.dataset.editItem);return}
 if(b.dataset.toggleItem){const x=items.find(i=>i.id===b.dataset.toggleItem);await supabase.from("items").update({active:!x.active,updated_at:new Date().toISOString()}).eq("id",x.id);loadAll();return}
 if(b.dataset.confirmPurchase){confirmPurchase(b.dataset.confirmPurchase);return}
 if(b.dataset.editRecipe){openRecipe(b.dataset.editRecipe);return}
 if(b.dataset.issueOrder){issueOrder(b.dataset.issueOrder);return}
 if(b.dataset.editSale){openSale(b.dataset.editSale);return}
 if(b.dataset.saveOp){saveOperationRow(b);return}
};
supabase.auth.onAuthStateChange((_e,s)=>{setSignedIn(!!s);if(s)loadAll()});
applyLanguage();
const {data:{session}}=await supabase.auth.getSession();setSignedIn(!!session);if(session)loadAll();
