(()=>{
 const selector='#cat-modes .gamebutton,#cat-modes .panel,#cat-modes .mode-card,#cat-modes .ribbon,#cat-modes .score-pair>div,#cat-modes .toast,#cat-modes .code,#cat-ranking button,#cat-board .cat-list,#cat-board .cat-own,#cat-register,#loading .loading-panel,#duel-menu-button,.approved-bonus,#duel-network';
 const done=new WeakSet();
 function apply(){document.querySelectorAll(selector).forEach(el=>{
  if(done.has(el)||!el.getClientRects().length)return;
  const style=getComputedStyle(el);if(style.display==='none')return;
  done.add(el);
  for(const [name,value] of Object.entries({bg:style.background,shadow:style.boxShadow,filter:style.filter,radius:style.borderRadius,border:style.border,borderImage:style.borderImage,top:style.borderTopWidth,right:style.borderRightWidth,bottom:style.borderBottomWidth,left:style.borderLeftWidth}))el.style.setProperty('--ui-'+name,value);
  el.classList.add('ui-glass');
 });}
 let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});};
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','aria-pressed']});
 window.addEventListener('resize',schedule);schedule();
})();
