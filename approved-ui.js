(()=>{
 const ids={title:'title',versus:'versus',near:'near',lobby:'lobby','pause-menu':'pause','online-menu':'online-menu',ended:'network-ended',help:'help',settings:'settings','solo-result':'solo-result',win:'win',lose:'win',draw:'win',start:'start',matching:'matching',reconnect:'reconnect',leave:'leave',clear:'clear'};
 const actions={title:['solo','versus','ranking','help','settings'],near:['create','join'],lobby:['copy-code','leave'],'pause-menu':['continue','settings','leave'],'online-menu':['continue','leave'],ended:['match','leave'],help:['title'],settings:['save-settings'],'solo-result':['replay','ranking'],win:['replay','leave'],lose:['replay','leave'],draw:['replay','leave'],matching:['leave'],leave:['continue','confirm-leave'],clear:['continue']};
 window.renderApprovedMode=(which,result,context={})=>{
  const id=ids[which];if(!id||!window.APPROVED_SCREENS?.[id])return null;
  const wrapper=document.createElement('div');wrapper.innerHTML=APPROVED_SCREENS[id];
  const screen=wrapper.querySelector('.screen');
  screen.querySelectorAll('button').forEach((b,i)=>{if(actions[which]?.[i])b.dataset.action=actions[which][i];});
  if(which==='versus'){
   screen.querySelectorAll('.mode-card').forEach((c,i)=>{c.dataset.action=['cpu','near','match'][i];c.tabIndex=0;c.setAttribute('role','button');});
   screen.querySelector('button').dataset.action='title';
  }
  if(which==='pause-menu')screen.querySelector('h3')?.remove();
  if(which==='near'){const input=screen.querySelector('input');input.id='duel-code';input.value='';input.placeholder='数字6桁';input.inputMode='numeric';input.maxLength=6;}
  if(which==='reconnect'){screen.classList.add('reconnect-view');screen.querySelector('.physical')?.remove();}
  if(which==='lobby'){const code=screen.querySelector('.code');if(code){code.classList.add('mode-code');code.textContent='';}}
  screen.querySelector('.screen-title')?.remove();
  if(result){
   if(which==='solo-result'){screen.querySelector('.total').textContent=result.score.toLocaleString();screen.querySelector('.panel>b').hidden=result.score<result.best;}
   if(['win','lose','draw'].includes(which)){
    const hero=screen.querySelector('.hero-v2');hero.src=hero.src.replace('win-hero',which+'-hero');hero.alt=which.toUpperCase()+'! 青と赤の猫';
    const scores=screen.querySelectorAll('.score-pair b');scores.forEach((el,i)=>el.textContent=result.scores[i].toLocaleString());
    const rows=screen.querySelectorAll('.panel .row');rows[0].querySelectorAll('b').forEach((el,i)=>el.textContent=(result.counts?.[i]??0)+'個');
    rows[1].querySelectorAll('b').forEach((el,i)=>el.textContent='×'+Number(result.multipliers?.[i]??1).toFixed(1));
   }
  }
  if(which==='clear'&&result){
   const rows=screen.querySelectorAll('.panel .row');const values=[1600,8000,Math.max(0,result.basePoints-9600)];
   values.forEach((v,i)=>rows[i].querySelector('b').textContent=v.toLocaleString());rows[2].querySelector('span').textContent='色ボーナス';rows[3].querySelector('b').textContent='×'+(result.multiplier/10).toFixed(1);screen.querySelector('.total').textContent='＋'+result.points.toLocaleString();
  }
  if(which==='start'){
   const paragraphs=screen.querySelectorAll('.panel p');
   if(paragraphs[0])paragraphs[0].textContent='あなたは'+((context.seat??0)+1)+'Pです。'+(context.seat===1?'後攻！':'先攻！');
  }
  // Restore the reference artwork and wording of every existing button.
  // Pages without a body back button use the reference header arrow, moved into the body.
  const backAction={near:'versus',help:'title'}[which];
  if(backAction&&!screen.querySelector('[data-action="'+backAction+'"]')){
   const source=document.createElement('div');source.innerHTML=APPROVED_SCREENS.versus;
   const back=source.querySelector('button').cloneNode(true);back.dataset.action=backAction;screen.querySelector('.body').append(back);
  }
  if(which==='settings')screen.querySelectorAll('.toggle').forEach((t,i)=>{t.dataset.action='toggle-setting';t.dataset.setting=['bgm','sound','reduced'][i];t.tabIndex=0;t.setAttribute('role','switch');const on=localStorage.getItem('Smartball.'+t.dataset.setting)!=='off';t.setAttribute('aria-checked',String(on));t.src=t.src.replace(/toggle-(on|off)/,'toggle-'+(on?'on':'off'));});
  const status=document.createElement('p');status.className='mode-message';status.setAttribute('role','status');screen.querySelector('.body').append(status);
  return wrapper.innerHTML;
 };
})();
