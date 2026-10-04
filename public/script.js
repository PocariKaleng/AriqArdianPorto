const projects=[
  {title:'SecureVault',category:'SECURITY / BROWSER APP',image:'assets/secure-vault.png',description:'A client-side file encryption app built with React, TypeScript, Web Crypto, and IndexedDB. It demonstrates AES-256-GCM file encryption, a local vault, and a digital-signature demo without an account or backend.',focus:'React · TypeScript · Web Crypto · IndexedDB',source:'https://github.com/PocariKaleng/Secure-Vault',demo:'https://pocarikaleng.github.io/Secure-Vault/'},
  {title:'CTF LaTeX Equation Tool',category:'CTF TOOLING / WEB APP',image:'assets/latex-tool.png',description:'A browser tool for writing equations in CTF and cryptography writeups. It previews LaTeX with MathJax and exports a transparent, high-resolution PNG for documents and notes.',focus:'JavaScript · MathJax · Clipboard API',source:'https://github.com/PocariKaleng/Latex-Math-Generate-Equations',demo:'https://pocarikaleng.github.io/Latex-Math-Generate-Equations/'},
  {title:'CTF Flag Generator',category:'CTF TOOLING / WEB APP',image:'assets/ctf-flag-generator.png',description:'A browser-based utility for creating random CTF flags and converting text into leetspeak. The repository documents a static app that runs locally without uploads or a backend.',focus:'JavaScript · HTML · CSS',source:'https://github.com/PocariKaleng/CTF-Flag-Genarator'},
  {title:'CTF Writeups',category:'SECURITY / NOTES',description:'A public collection of CTF writeups. These notes document challenges, solutions, and the process of learning through hands-on security problems.',focus:'CTF · Security · Problem solving',source:'https://github.com/PocariKaleng/WriteUP-CTF'}
];
const dialog=document.getElementById('detail'),content=document.getElementById('detail-content');
if(dialog&&content){
  document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{const p=projects[Number(button.dataset.project)];content.innerHTML=`<span class="eyebrow">${p.category}</span><h2>${p.title}</h2>${p.image?`<img src="${p.image}" alt="Screenshot of ${p.title}">`:''}<p>${p.description}</p><p class="project-note">${p.focus}</p><div class="detail-links"><a href="${p.source}" target="_blank" rel="noopener noreferrer">View repository ↗</a>${p.demo?`<a href="${p.demo}" target="_blank" rel="noopener noreferrer">Try live demo ↗</a>`:''}</div>`;dialog.showModal();document.body.style.overflow='hidden';}));
  dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.style.overflow='';});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
}
document.getElementById('year').textContent=new Date().getFullYear();

const themeToggle=document.querySelector('.theme-toggle');
const themeMeta=document.querySelector('meta[name="theme-color"]');
function updateThemeControl(){
  const light=document.documentElement.dataset.theme==='light';
  const label=`Switch to ${light?'dark':'light'} mode`;
  themeToggle.setAttribute('aria-label',label);
  themeToggle.title=label;
  themeToggle.querySelector('.theme-label').textContent=light?'Dark':'Light';
  themeToggle.querySelector('.theme-icon').textContent=light?'☾':'☼';
  themeMeta.content=light?'#f5f5ef':'#111210';
}
updateThemeControl();
themeToggle.addEventListener('click',()=>{
  const next=document.documentElement.dataset.theme==='light'?'dark':'light';
  document.documentElement.dataset.theme=next;
  try{localStorage.setItem('portfolio-theme',next)}catch(e){}
  updateThemeControl();
});

const scrollProgress=document.querySelector('.scroll-progress');
let progressFrame=0;
function updateScrollProgress(){
  const range=document.documentElement.scrollHeight-window.innerHeight;
  scrollProgress.style.transform=`scaleX(${range>0?Math.min(1,window.scrollY/range):0})`;
  progressFrame=0;
}
function requestProgressUpdate(){
  if(!progressFrame)progressFrame=requestAnimationFrame(updateScrollProgress);
}
updateScrollProgress();
window.addEventListener('scroll',requestProgressUpdate,{passive:true});
window.addEventListener('resize',requestProgressUpdate);

if('IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const revealTargets=document.querySelectorAll('.section-head,.project,.writeups-intro,.about>div:nth-child(2),.profile-portrait,.stack-section,.credentials-column h2,.contact h2');
  revealTargets.forEach((target,index)=>{
    target.classList.add('reveal');
    if(target.classList.contains('project'))target.style.setProperty('--reveal-delay',`${(index%4)*60}ms`);
  });
  document.documentElement.classList.add('has-reveal');
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible')}
      else if(!entry.target.contains(document.activeElement)){entry.target.classList.remove('is-visible')}
    });
  },{threshold:0});
  revealTargets.forEach(target=>{
    observer.observe(target);
    target.addEventListener('focusin',()=>target.classList.add('is-visible'));
  });
}

const profileVisual=document.querySelector('.profile-visual');
if(profileVisual){
const finePointer=window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let portraitFrame=0;
function resetPortrait(){
  cancelAnimationFrame(portraitFrame);
  portraitFrame=0;
  profileVisual.classList.remove('is-active');
  profileVisual.style.setProperty('--tilt-x','0deg');
  profileVisual.style.setProperty('--tilt-y','0deg');
  profileVisual.style.setProperty('--light-x','50%');
  profileVisual.style.setProperty('--light-y','50%');
}
profileVisual.addEventListener('pointermove',event=>{
  if(event.pointerType!=='mouse'||!finePointer.matches||reducedMotion.matches)return;
  const bounds=profileVisual.getBoundingClientRect();
  const x=Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width));
  const y=Math.max(0,Math.min(1,(event.clientY-bounds.top)/bounds.height));
  profileVisual.classList.add('is-active');
  cancelAnimationFrame(portraitFrame);
  portraitFrame=requestAnimationFrame(()=>{
    profileVisual.style.setProperty('--tilt-x',`${((.5-y)*9).toFixed(2)}deg`);
    profileVisual.style.setProperty('--tilt-y',`${((x-.5)*9).toFixed(2)}deg`);
    profileVisual.style.setProperty('--light-x',`${(x*100).toFixed(1)}%`);
    profileVisual.style.setProperty('--light-y',`${(y*100).toFixed(1)}%`);
  });
});
profileVisual.addEventListener('pointerleave',resetPortrait);
reducedMotion.addEventListener('change',resetPortrait);
finePointer.addEventListener('change',resetPortrait);
}

// Each entry reveals where it actually meets the viewport, including on phones.
const catalogItems=[...document.querySelectorAll('.stack-group li,.writeups .note,.journal .note')];
const catalogReduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const catalogPointer=window.matchMedia('(hover: hover) and (pointer: fine)');
let catalogObserver;
function finishCatalogEntry(item){
  item.classList.remove('motion-enter','motion-visible');
}
if('IntersectionObserver' in window&&!catalogReduced.matches){
  catalogObserver=new IntersectionObserver(entries=>{
    entries.forEach((entry,index)=>{
      if(!entry.isIntersecting){
        if(!entry.target.contains(document.activeElement)){
          entry.target.classList.add('motion-enter');
          entry.target.classList.remove('motion-visible');
        }
        return;
      }
      entry.target.style.setProperty('--entry-delay',`${Math.min(index,4)*55}ms`);
      if(!entry.target.contains(document.activeElement))entry.target.classList.add('motion-enter','motion-visible');
    });
  },{threshold:0});
  catalogItems.forEach(item=>{
    item.classList.add('motion-enter');
    catalogObserver.observe(item);
    item.addEventListener('animationend',event=>{if(event.animationName==='catalog-unfold')finishCatalogEntry(item)});
    item.addEventListener('focusin',()=>finishCatalogEntry(item));
  });
}
const resetCatalogLights=[];
document.querySelectorAll('.stack-group,.writeups .note,.journal .note').forEach(surface=>{
  let bounds=null,frame=0;
  function reset(){
    cancelAnimationFrame(frame);
    bounds=null;
    surface.classList.remove('is-tracking');
  }
  surface.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||!catalogPointer.matches||catalogReduced.matches)return;
    bounds??=surface.getBoundingClientRect();
    const x=event.clientX-bounds.left,y=event.clientY-bounds.top;
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      surface.style.setProperty('--pointer-x',`${x}px`);
      surface.style.setProperty('--pointer-y',`${y}px`);
      surface.classList.add('is-tracking');
    });
  });
  surface.addEventListener('pointerleave',reset);
  resetCatalogLights.push(reset);
});
function resetCatalogPointer(){resetCatalogLights.forEach(reset=>reset())}
window.addEventListener('scroll',resetCatalogPointer,{passive:true});
window.addEventListener('resize',resetCatalogPointer);
catalogPointer.addEventListener('change',resetCatalogPointer);
catalogReduced.addEventListener('change',()=>{
  resetCatalogPointer();
  if(catalogReduced.matches){catalogItems.forEach(finishCatalogEntry);catalogObserver?.disconnect()}
});
