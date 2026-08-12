import { supabase } from "./supabase.js";

const view = document.querySelector("#view");
const status = document.querySelector("#connectionStatus");

const views = {
  dashboard: () => `<h2>Dashboard</h2><p class="muted">Supabase foundation is ready.</p>
    <div class="card"><strong>Next modules:</strong> Item Master → Purchase/Cost → Order/Recipe → Production/Packaging → Sales → Inventory → Reports.</div>`,
  items: () => `<h2>Item Dashboard</h2><p class="muted">The Item Dashboard is a dedicated destination, not a replacement for the More menu.</p>`,
  purchases: () => `<h2>Purchase</h2><p class="muted">Purchase quantity is normalized to base units and a historical cost snapshot is stored.</p>`,
  orders: () => `<h2>Orders</h2><p class="muted">Only Sale-enabled items will appear in the Order workflow.</p>`,
  production: () => `<h2>Production</h2><p class="muted">Order → Recipe → Issued → Used / Return / Damage → Closing.</p>`,
  packaging: () => `<h2>Packaging</h2><p class="muted">Packaging recipe and stock operations.</p>`,
  sales: () => `<h2>Sales</h2><p class="muted">Sales quantity, price and revenue by item/date/shop.</p>`,
  reports: () => `<h2>Monthly Report</h2>
    <div class="card">Used Total Value: <strong>—</strong></div>
    <div class="card">Damage Total Value: <strong>—</strong></div>
    <div class="card">Closing Total Value: <strong>—</strong></div>
    <div class="card">Sales Total Value: <strong>—</strong></div>`,
  more: () => `<h2>More</h2><div class="card"><button data-view="items">Open Item Dashboard</button></div>`
};

function navigate(name){ view.innerHTML=(views[name]||views.dashboard)(); }

document.addEventListener("click", e => {
  const button=e.target.closest("[data-view]");
  if(button) navigate(button.dataset.view);
});

async function checkConnection(){
  try{
    const {error}=await supabase.from("items").select("id").limit(1);
    if(error) throw error;
    status.textContent="Supabase connected";
    status.className="status success";
  }catch(error){
    status.textContent="Run database SQL";
    status.className="status danger";
    console.warn(error);
  }
}

if("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(console.warn));
}
navigate("dashboard");
checkConnection();
