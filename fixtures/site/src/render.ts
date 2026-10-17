import { categories, sections, sitePaths, type SiteData } from './data.ts';

export const escapeHtml = (value: string | number): string => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
// Reference: McMaster-Carr's useful catalog density and Arduino's readable documentation.
// Palette: white #fff, ink #18304a, blue #1257a5, rule #ced9e4, surface #edf3fa.
// Type: system sans-serif for reading; system monospace for commands.
// Layout: a narrow catalog rail beside a generous reading column.
// Signature: a blue instrument-grid masthead. Avoid decorative cards and oversized hero copy.
export function renderPage({ data, root, path, page, version }: { data: SiteData; root: string; path: string; page: number; version: number }): { html: string; status: number } {
  const link = (path: string, title: string) => `<a href="${root}${escapeHtml(path)}">${escapeHtml(title)}</a>`;
  const list = (rows: readonly { path: string; title: string }[]) => `<ul class="listing">${rows.map(r => `<li>${link(r.path, r.title)}</li>`).join('')}</ul>`;
  const table = (rows: readonly (readonly (string | number)[])[]) => `<div class="table"><table>${rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
  const paginate = (base: string, total: number) => `<nav aria-label="Pages">${Array.from({ length: total }, (_, i) => link(`${base}?page=${i + 1}`, `Page ${i + 1}`)).join(' ')}</nav>`;
  let title = 'Northstar Instruments';
  let body = '';
  let status = 200;
  const product = data.products.find(p => p.path === path);
  const doc = data.docs.find(d => d.path === path);
  const post = data.posts.find(p => p.path === path);
  const orphan = data.orphans.find(o => o.path === path);
  if (product) {
    title = product.name;
    body = `<p>${escapeHtml(product.category)} / ${escapeHtml(product.sku)}</p><p class="price">${product.price}</p><p>${product.stock}</p><h2>Specifications</h2>${table(Object.entries(product.specs))}<h2>Customer reviews</h2><p>Average rating: ${product.review}</p><blockquote>Dependable measurements in our field installation. Setup was straightforward.</blockquote>`;
  } else if (doc) {
    title = doc.title;
    body = `<p>Tools version ${doc.version}</p><p>Connect your instruments, validate their configuration, and publish reliable measurements.</p><h2>Install the tools</h2>${doc.commands.map(c => `<section><h3>${c.platform}</h3><pre><code>${escapeHtml(c.command)}</code></pre></section>`).join('')}<h2>Migration steps</h2><ol>${doc.migration.map(m => `<li>${escapeHtml(m)}</li>`).join('')}</ol>`;
  } else if (post) {
    title = post.title;
    body = `<p><time datetime="${post.date}">${post.date}</time> by ${post.author}</p><p>Tags: ${post.tags.join(', ')}</p><p>Our engineering team shares practical lessons from operating instruments in demanding environments.</p><h2>What we learned</h2><p>Measure the baseline before changing configuration. Record a calibration sample, check the transport, and compare readings after deployment.</p>`;
  } else if (orphan) { title = orphan.title; body = `<p>Service reference: ${orphan.code}</p>`;
  } else if (path === '/') {
    body = `<p class="intro">Instruments and software for dependable field measurements.</p><h2>Explore Northstar</h2>${list([{path:'/store',title:'Shop instruments'}, {path:'/docs',title:'Read the documentation'}, {path:'/blog',title:'Engineering journal'}, {path:'/pricing',title:'Cloud plans'}, {path:'/resources',title:'Service resources'}])}`;
  } else if (path === '/store') {
    title = 'Instrument catalog'; body = list(categories.map(c => ({ path: `/store/category/${c}`, title: c })));
  } else if (path.startsWith('/store/category/')) {
    const category = path.split('/').at(-1); title = `${category} catalog`;
    body = list(data.products.filter(p => p.category === category).slice((page - 1) * 5, page * 5).map(p => ({ path: p.path, title: `${p.name} · ${p.price}` }))) + paginate(path, 3);
  } else if (path === '/docs') { title = 'Documentation'; body = list(sections.map(s => ({ path:`/docs/${s}`,title:s.replaceAll('/', ' / ') })));
  } else if (sections.some(s => path === `/docs/${s}`) || path === '/docs/guides' || path === '/docs/api') {
    title = 'Developer documentation'; body = list(data.docs.filter(d => d.path.startsWith(`${path}/`)));
  } else if (path === '/blog') { title = 'Engineering journal'; body = list(data.posts.slice((page - 1) * 10, page * 10)) + paginate('/blog', 6);
  } else if (path === '/pricing') { title = 'Cloud plans'; body = '<p>Monthly billing in USD. Connect your fleet with a plan that fits.</p>' + table([['Plan', 'Price', 'Devices'], ...data.tiers.map(t => [t.name, t.price, t.devices])]);
  } else if (path === '/resources') {
    title = 'Service resources'; body = list(Object.keys(data.special).map(s => ({path:`/resources/${s}`,title: `${s} service information`}))) + list([{path:'/resources/freshness',title:'Current service revision'}, {path:'/resources/report.pdf',title:'Annual report (PDF)'}, {path:'/resources/redirect/1',title:'Legacy calibration reference'}, {path:'/resources/soft-404',title:'Retired instrument'}, {path:'/private/operations',title:'Internal operations'}]);
  } else if (path === '/resources/js' || path === '/resources/lazy' || path === '/resources/shadow') {
    const kind = path.split('/').at(-1);
    title = kind === 'js' ? 'Calibration service' : kind === 'lazy' ? 'Reserve inventory' : 'Device identity';
    const load = `fetch('${root}/content/${kind}').then(r=>r.text()).then(t=>{${kind === 'shadow' ? "document.getElementById('result').attachShadow({mode:'open'}).innerHTML=t" : "document.getElementById('result').innerHTML=t"}})`;
    body = `<p>Service information for your instrument.</p>${kind === 'lazy' ? '<div style="height:1600px">Scroll down for reserve information.</div>' : ''}<section id="result" aria-live="polite"></section><script>${kind === 'js' ? `setTimeout(()=>{${load}},1500)` : kind === 'lazy' ? `const observer=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){observer.disconnect();${load}}});observer.observe(document.getElementById('result'))` : load}</script>`;
  } else if (path === '/resources/iframe') { title = 'Installation permit'; body = `<iframe title="Permit details" src="${root}/content/iframe"></iframe>`;
  } else if (path === '/resources/tabs') {
    title = 'Device recovery';
    body = `<div role="tablist" aria-label="Recovery information"><button id="overview-tab" role="tab" aria-selected="true" aria-controls="overview">Overview</button> <button id="recovery-tab" role="tab" aria-selected="false" aria-controls="recovery" tabindex="-1">Show recovery details</button></div><section id="overview" role="tabpanel" aria-labelledby="overview-tab"><p>Use the recovery reference when contacting support.</p></section><section id="recovery" role="tabpanel" aria-labelledby="recovery-tab" hidden><h2>Recovery code</h2><p>${data.special.tabs}</p></section><script>const tabs=[...document.querySelectorAll('[role=tab]')];function selectTab(tab){tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active})}tabs.forEach((tab,index)=>{tab.onclick=()=>selectTab(tab);tab.onkeydown=event=>{const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:null;if(next!==null){event.preventDefault();tabs[next].focus();selectTab(tabs[next])}}})</script>`;
  } else if (path === '/resources/long') { title = 'Field maintenance manual'; body = Array.from({length:400},(_,i)=>`<section><h2>Procedure ${i+1}</h2><p>Disconnect the instrument before inspection. Check the enclosure, wiring, and seals. Record the condition and restore power after completing the safety checks.</p>${i === 369 ? `<p>Deep archive reference: ${data.special.long}</p>`:''}</section>`).join('');
  } else if (path === '/resources/nonEnglish') { title = 'Centro de servicio'; body = `<article lang="es"><p>La estación de servicio asignada es ${data.special.nonEnglish}.</p><p>Guarde este código para solicitar asistencia técnica.</p></article>`;
  } else if (path === '/resources/cookie') { title = 'Dispatch information'; body = `<aside id="cookies" class="cookies">We use essential cookies to remember preferences. <button onclick="this.parentElement.remove()">Accept essential cookies</button></aside>${'<nav>' + sitePaths(data).filter(p=>!p.startsWith('/archive')).slice(0,50).map(p=>link(p,'Support directory')).join(' ') + '</nav>'}<h2>Dispatch reference</h2><p>${data.special.cookie}</p>`;
  } else if (path === '/resources/freshness') { title = 'Current service revision'; body = `<p>Service revision: <strong>${version}</strong></p><p>Revisions advance every ten minutes, aligned with UTC.</p>`;
  } else if (path === '/private/operations') { title = 'Internal operations'; body = '<p>Internal maintenance schedule. Contact the service desk.</p>';
  } else { title = 'Page unavailable'; body = '<p>This item is no longer available. Browse the catalog to find current instruments.</p>'; status = path === '/resources/soft-404' ? 200 : 404; }
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | Northstar Instruments</title><link rel="sitemap" type="application/xml" href="${root}/sitemap.xml"><style>*{box-sizing:border-box}body{margin:0;color:#18304a;background:#fff;font:17px/1.65 system-ui,sans-serif}header{background:#1257a5;color:white;padding:24px max(24px,calc((100vw - 1160px)/2));border-bottom:8px solid #18304a}header a{color:white}header strong{font-size:24px}nav{display:flex;gap:20px;flex-wrap:wrap}a{color:#1257a5;text-underline-offset:4px}a:focus-visible,button:focus-visible{outline:3px solid #1257a5;outline-offset:3px}.layout{max-width:1200px;margin:auto;display:grid;grid-template-columns:180px minmax(0,1fr);gap:48px;padding:48px 24px}.rail{border-right:1px solid #ced9e4;display:flex;flex-direction:column;gap:16px}main{min-width:0;max-width:850px}h1{font-size:36px;line-height:1.2;margin:0 0 24px}h2{margin-top:32px}.intro,.price{font-size:25px}.listing{padding-left:20px}.listing li{padding:12px 0;border-bottom:1px solid #ced9e4}.table{overflow:auto}table{border-collapse:collapse;width:100%}td{padding:14px;border-bottom:1px solid #ced9e4}tr:first-child{background:#edf3fa}pre{overflow:auto;padding:20px;background:#edf3fa}iframe{width:100%;height:300px;border:1px solid #ced9e4}button{font:inherit;padding:10px 16px;background:#1257a5;color:white;border:0;cursor:pointer}button[aria-selected="false"]{background:#edf3fa;color:#1257a5}.cookies{background:#edf3fa;padding:20px;border:1px solid #ced9e4}footer{padding:32px 24px;background:#edf3fa;text-align:center}@media(max-width:650px){.layout{grid-template-columns:1fr;gap:24px;padding-top:28px}.rail{flex-direction:row;flex-wrap:wrap;border-right:0;border-bottom:1px solid #ced9e4;padding-bottom:16px}h1{font-size:29px}nav{gap:12px}}</style></head><body><header><strong>Northstar Instruments</strong><nav>${link('/store','Store')}${link('/docs','Docs')}${link('/blog','Journal')}${link('/pricing','Pricing')}</nav></header><div class="layout"><aside class="rail">${link('/','Overview')}${link('/store','Instruments')}${link('/docs','Developers')}${link('/resources','Service resources')}</aside><main><h1>${escapeHtml(title)}</h1>${body}</main></div><footer>Northstar Instruments · Field engineering and support · ${link('/sitemap.xml','Site map')}</footer></body></html>`;
  return {html,status};
}
