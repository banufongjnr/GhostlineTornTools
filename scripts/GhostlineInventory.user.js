// ==UserScript==
// @name         Ghostline Inventory
// @namespace    ghostline.torntools.inventory
// @version      0.1.1
// @description  Ghostline-themed Torn inventory overlay with search, filtering, inspection and native item actions.
// @author       FatherOooogaboo [3269781]
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';
  if (!/\/(item\.php)(?:$|[?#])/i.test(location.pathname + location.search + location.hash)) return;
  if (!document.body || !document.head) { setTimeout(() => { window.__ghostlineInventoryPending = false; }, 500); return; }
  if (window.__ghostlineInventory) return;
  window.__ghostlineInventory = true;
  const C = { bg:'#05060c', teal:'#4fe0d0', vio:'#9b6bff', muted:'#7d8399' };
  console.info('[Ghostline Inventory] v0.1.1 initialized',location.href);
  const css = `
    #gi-tab,#gi-root{font-family:Inter,"Space Grotesk",system-ui,sans-serif;box-sizing:border-box;color:#d7dbe8}
    #gi-root *{box-sizing:border-box}
    #gi-tab{position:fixed;right:0;top:42%;z-index:2147483000;writing-mode:vertical-rl;cursor:pointer;padding:16px 9px;border-radius:14px 0 0 14px;color:white;font-size:11px;letter-spacing:.2em;background:linear-gradient(180deg,#5634c9,#2b6e83);box-shadow:0 0 18px #5634c988}
    #gi-root{position:fixed;inset:0;z-index:2147483001;display:none;flex-direction:column;padding:calc(env(safe-area-inset-top) + 32px) 14px calc(env(safe-area-inset-bottom) + 12px);background:radial-gradient(100% 55% at 50% 0%,#5634c938,transparent 70%),#05060c}
    #gi-root.gi-open{display:flex}
    #gi-root button,#gi-root select,#gi-root input{font:inherit}
    #gi-root button{cursor:pointer;border:1px solid #34354b;border-radius:12px;color:#d7dbe8;background:#111321;padding:10px}
    #gi-root button:active{border-color:#9b6bff}
    #gi-root .gi-primary{border-color:#9b6bff;background:linear-gradient(90deg,#5634c9,#2b6e83);color:white}
    #gi-root .gi-header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
    #gi-root .gi-orb{height:34px;width:34px;border-radius:50%;background:radial-gradient(circle,#05060c 42%,transparent 45%),conic-gradient(#4fe0d0,#9b6bff,#4fe0d0);animation:gi-spin 9s linear infinite;box-shadow:0 0 20px #9b6bff77}
    @keyframes gi-spin{to{transform:rotate(360deg)}}
    #gi-root .gi-heading{flex:1;min-width:0}
    #gi-root .gi-heading strong{display:block;font-size:13px;letter-spacing:.2em}
    #gi-root .gi-heading small{color:#4fe0d0;font-size:9px;letter-spacing:.2em}
    #gi-root .gi-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px}
    #gi-root .gi-stat{border:1px solid #2a2c45;border-radius:12px;text-align:center;padding:10px 4px;background:#ffffff05}
    #gi-root .gi-stat strong{display:block;font-size:20px}
    #gi-root .gi-stat small{color:#7d8399;font-size:9px;letter-spacing:.12em}
    #gi-root .gi-tools{display:flex;gap:7px;margin-bottom:10px}
    #gi-root .gi-tools input,#gi-root .gi-tools select{min-width:0;background:#0b0d19;color:#e5e6ee;border:1px solid #33364a;border-radius:12px;padding:11px;font-size:12px}
    #gi-root .gi-tools input{flex:1}
    #gi-root .gi-list{flex:1;overflow:auto;overscroll-behavior:contain}
    #gi-root .gi-section{font-size:10px;letter-spacing:.2em;color:#4fe0d0;margin:13px 3px 7px}
    #gi-root .gi-item{border:1px solid #292d46;border-radius:14px;background:#ffffff06;padding:10px;margin-bottom:7px}
    #gi-root .gi-top{display:flex;align-items:center;gap:10px}
    #gi-root .gi-pic{width:48px;height:48px;object-fit:contain;border-radius:8px;background:#171a2a}
    #gi-root .gi-name{flex:1;min-width:0;font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis}
    #gi-root .gi-name small{display:block;color:#7d8399;font-weight:400;font-size:10px;margin-top:4px}
    #gi-root .gi-qty{color:#4fe0d0;font-weight:700;font-size:13px}
    #gi-root .gi-actions{display:flex;gap:6px;margin-top:9px;border-top:1px solid #252941;padding-top:9px}
    #gi-root .gi-actions button{flex:1;font-size:10px;letter-spacing:.08em;padding:8px 4px}
    #gi-root .gi-msg{font-size:11px;color:#a9aabe;text-align:center;padding:10px}
    #gi-root .gi-foot{display:flex;gap:7px;margin-top:9px}
    #gi-root .gi-foot button{flex:1;font-size:11px}
    #gi-root .gi-detail{position:absolute;inset:0;background:#05060cf5;display:flex;align-items:center;justify-content:center;padding:16px}
    #gi-root .gi-detail-inner{background:#0d1020;border:1px solid #7651ba;border-radius:20px;padding:20px;width:min(100%,480px);max-height:85vh;overflow:auto}
    #gi-root .gi-detail-inner p{font-size:12px;line-height:1.6;color:#aeb2c8}
    @media(prefers-reduced-motion:reduce){#gi-root .gi-orb{animation:none}}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
  const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
  const button=(txt,fn,cls)=>{const n=el('button',cls,txt);n.type='button';n.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn()});return n};
  const tab=el('div','','GHOSTLINE INVENTORY');tab.id='gi-tab';document.body.appendChild(tab);
  const root=el('div');root.id='gi-root';document.body.appendChild(root);
  let open=false, search='', category='All', sort='name', items=[], sourceCount=0, scanAt=0, busy=false;
  const selectors=[
    '[class*="itemsList"] [class*="item"]',
    '[class*="items-list"] [class*="item"]',
    '[class*="inventory"] [class*="item"]',
    '[class*="itemList"] [class*="item"]',
    '.items-list > li',
    '.items-list > div',
    '[class*="itemRow"]',
    '[class*="item-row"]'
  ];
  function sourceRows(){
    const found=new Set();
    for(const sel of selectors){
      try{document.querySelectorAll(sel).forEach(n=>{
        if(n.closest('#gi-root,#gi-tab'))return;
        if(n.querySelector('img') && n.textContent.trim().length>1 && n.getBoundingClientRect().width>40)found.add(n);
      })}catch(e){}
    }
    const arr=[...found];
    return arr.filter(n=>!arr.some(p=>p!==n&&n.contains(p)));
  }
  function readItem(n,i){
    const img=n.querySelector('img');
    const title=n.querySelector('[class*="name"],[class*="title"],[title]');
    const name=(title?.getAttribute('title')||title?.textContent||img?.alt||'').trim().replace(/\s+/g,' ').slice(0,110);
    if(!name || /^(use|sell|send|equip|details)$/i.test(name))return null;
    const raw=n.innerText||n.textContent||'';
    const q=/(?:x|×)\s*([\d,]+)/i.exec(raw)||/([\d,]+)\s*(?:owned|available)/i.exec(raw);
    const qty=q?Number(q[1].replace(/,/g,'')):1;
    const native=[...n.querySelectorAll('button,a,[role="button"]')].filter(b=>b.getBoundingClientRect().width>0);
    const actions=native.map(b=>({name:(b.innerText||b.getAttribute('aria-label')||b.title||'').trim().slice(0,30),node:b})).filter(a=>a.name);
    const cat=(n.closest('[class*="category"],[class*="tabContent"]')?.getAttribute('data-category')||'Inventory').trim();
    return {name,qty,img:img?.src||'',category:cat,actions,node:n,index:i};
  }
  function scan(){
    if(busy)return;busy=true;
    try{
      const rows=sourceRows();sourceCount=rows.length;
      items=rows.map(readItem).filter(Boolean);
      scanAt=Date.now();
    }finally{busy=false}
  }
  function invokeNative(item,action){
    close();
    setTimeout(()=>{
      if(!item.node.isConnected){alert('Torn refreshed this item. Open the original inventory and try again.');return}
      action.node.click();
    },80);
  }
  function details(item){
    const cover=el('div','gi-detail'),panel=el('div','gi-detail-inner');
    panel.appendChild(el('h3','',item.name));
    panel.appendChild(el('p','','Quantity: '+item.qty+' · Category: '+item.category));
    panel.appendChild(el('p','','Actions shown below come from Torn’s original inventory. Values, effects and cooldowns will be added after live DOM verification.'));
    item.actions.forEach(a=>panel.appendChild(button(a.name,()=>invokeNative(item,a),'gi-primary')));
    panel.appendChild(button('BACK',()=>cover.remove()));
    cover.appendChild(panel);root.appendChild(cover);
  }
  function render(){
    if(!open)return;
    root.innerHTML='';
    const head=el('div','gi-header');
    head.appendChild(el('div','gi-orb'));
    const brand=el('div','gi-heading');brand.appendChild(el('strong','','GHOSTLINE INVENTORY'));brand.appendChild(el('small','','ITEM MANAGEMENT // v0.1.0'));head.appendChild(brand);
    head.appendChild(button('✕',close));root.appendChild(head);
    const stats=el('div','gi-stats');
    [['ITEM TYPES',items.length],['QUANTITY',items.reduce((a,b)=>a+b.qty,0)],['CATEGORIES',new Set(items.map(x=>x.category)).size]].forEach(x=>{
      const s=el('div','gi-stat');s.appendChild(el('strong','',String(x[1])));s.appendChild(el('small','',x[0]));stats.appendChild(s);
    });root.appendChild(stats);
    const tools=el('div','gi-tools');
    const inp=el('input');inp.placeholder='Search items...';inp.value=search;inp.addEventListener('input',()=>{search=inp.value;renderList()});tools.appendChild(inp);
    const cats=el('select');['All',...new Set(items.map(x=>x.category))].forEach(c=>{const o=el('option','',c);o.value=c;cats.appendChild(o)});cats.value=category;cats.onchange=()=>{category=cats.value;renderList()};tools.appendChild(cats);
    root.appendChild(tools);
    const list=el('div','gi-list');root.appendChild(list);
    function renderList(){
      list.innerHTML='';
      let filtered=items.filter(x=>(category==='All'||x.category===category)&&x.name.toLowerCase().includes(search.toLowerCase()));
      filtered.sort((a,b)=>sort==='quantity'?b.qty-a.qty:a.name.localeCompare(b.name));
      list.appendChild(el('div','gi-section','ITEMS // '+filtered.length));
      if(!filtered.length)list.appendChild(el('div','gi-msg',items.length?'No matching items.':'No items detected. Open DIAGNOSTICS and send the results so we can map Torn’s live inventory.'));
      filtered.forEach(item=>{
        const card=el('div','gi-item'),top=el('div','gi-top');
        if(item.img){const im=el('img','gi-pic');im.src=item.img;im.alt='';top.appendChild(im)}
        const name=el('div','gi-name',item.name);name.appendChild(el('small','',item.category));top.appendChild(name);
        top.appendChild(el('div','gi-qty','× '+item.qty.toLocaleString()));card.appendChild(top);
        const actions=el('div','gi-actions');
        item.actions.slice(0,2).forEach(a=>actions.appendChild(button(a.name,()=>invokeNative(item,a),'gi-primary')));
        actions.appendChild(button('DETAILS',()=>details(item)));card.appendChild(actions);list.appendChild(card);
      });
    }
    renderList();
    const msg=el('div','gi-msg','Native Torn actions only · No automated item use');root.appendChild(msg);
    const foot=el('div','gi-foot');
    foot.appendChild(button('REFRESH',()=>{scan();render()}));
    foot.appendChild(button('SORT: '+(sort==='name'?'NAME':'QUANTITY'),()=>{sort=sort==='name'?'quantity':'name';render()}));
    foot.appendChild(button('DIAGNOSTICS',()=>{
      const d={version:'0.1.0',url:location.href,sourceRows:sourceCount,parsedItems:items.length,scannedAt:new Date(scanAt).toISOString(),sampleClasses:sourceRows().slice(0,8).map(n=>String(n.className).slice(0,160))};
      const txt=JSON.stringify(d,null,2);
      if(navigator.clipboard?.writeText)navigator.clipboard.writeText(txt).then(()=>alert('Diagnostics copied. Paste them into ChatGPT.'),()=>alert(txt));else alert(txt);
    }));
    root.appendChild(foot);
    root.appendChild(button('RETURN TO TORN INVENTORY',close));
  }
  function openOverlay(){open=true;root.classList.add('gi-open');document.documentElement.style.overflow='hidden';scan();render()}
  function close(){open=false;root.classList.remove('gi-open');document.documentElement.style.overflow=''}
  tab.addEventListener('click',openOverlay);
  tab.title='Ghostline Inventory v0.1.1';
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)close()});
})();
