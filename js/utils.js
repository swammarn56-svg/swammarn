// Browser-safe utility helpers
window.qty = n => new Intl.NumberFormat("en-US",{maximumFractionDigits:4}).format(Number(n)||0);
window.escapeHtml = s => String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
