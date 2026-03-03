/* GOHSY Fashion TV — Take On Me Transition Engine */
(function(){
  'use strict';
  function init(){
    if(!('IntersectionObserver' in window)){var z=document.querySelectorAll('.take-on-me');for(var i=0;i<z.length;i++)z[i].classList.add('is-revealed');return}
    initZones();initBgTransitions()}
  function initZones(){var zones=document.querySelectorAll('.take-on-me');if(!zones.length)return;
    var obs=new IntersectionObserver(function(entries){for(var i=0;i<entries.length;i++){var e=entries[i],el=e.target;if(e.isIntersecting){var r=e.intersectionRatio,sk=el.querySelector('.take-on-me__sketch'),re=el.querySelector('.take-on-me__real');if(r>0.6)el.classList.add('is-revealed');if(sk&&re&&r>0.1&&r<=0.6){var p=(r-0.1)/0.5;sk.style.opacity=1-p;re.style.opacity=p}}}},{threshold:[0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1]});
    for(var j=0;j<zones.length;j++)obs.observe(zones[j])}
  function initBgTransitions(){var triggers=document.querySelectorAll('.bg-transition-trigger');if(!triggers.length)return;
    var obs=new IntersectionObserver(function(entries){for(var i=0;i<entries.length;i++){if(entries[i].isIntersecting){var el=entries[i].target,bg=el.dataset.bgTo||'#0a0a0a',txt=el.dataset.textTo||'#fff',sec=el.closest('.episode')||document.body;sec.style.transition='background-color 1s cubic-bezier(0.16,1,0.3,1),color 1s cubic-bezier(0.16,1,0.3,1)';sec.style.backgroundColor=bg;sec.style.color=txt}}},{threshold:0.3,rootMargin:'0px 0px -20% 0px'});
    for(var j=0;j<triggers.length;j++)obs.observe(triggers[j])}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
