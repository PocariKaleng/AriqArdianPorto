(() => {
  // Static SVG composition, measured only when page geometry changes.
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.classList.add('technical-background');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  document.body.prepend(svg);
  const page = document.body.className;
  const main = document.querySelector('main');
  let queued = 0;
  const box = element => {
    let x = 0, y = 0, current = element;
    while (current && current !== document.body) {
      x += current.offsetLeft; y += current.offsetTop; current = current.offsetParent;
    }
    return {x, y, w: element.offsetWidth, h: element.offsetHeight};
  };
  const label = (x,y,text) => `<text class="bg-note" x="${x}" y="${y}">${text}</text>`;
  // Hand-drawn bitmaps keep the accents crisp without images or a pixel font.
  const bitmaps = {
    star: ['0001000','0001000','0011100','1111111','0011100','0001000','0001000'],
    flag: ['1111100','1111110','1111111','1111110','1111100','1000000','1000000','1000000','1000000'],
    lock: ['0011100','0100010','0100010','1111111','1111111','1110111','1110111','1111111'],
    bits: ['100001','001000','000010','010000','000101']
  };
  const pixel = (kind,x,y,size=4,extra='') => `<g class="bg-pixel ${extra}" transform="translate(${Math.round(x)} ${Math.round(y)})" shape-rendering="crispEdges">${bitmaps[kind].map((row,j)=>[...row].map((bit,i)=>bit==='1'?`<rect x="${i*size}" y="${j*size}" width="${size}" height="${size}"/>`:'').join('')).join('')}</g>`;
  const ticks = (x,y) => `<g class="bg-guide" transform="translate(${x} ${y})"><path d="M-10 0H10M0-10V10M36 0H160M160-4V4M196 0H250M250-4V4"/></g>`;
  const network = (x,y,extra='') => `<g class="bg-network ${extra}" transform="translate(${x} ${y})"><path class="bg-trace" d="M0 90L48 24L117 49L158 8M48 24L76 124L117 49L187 108M0 90L76 124L187 108L218 42M117 49L218 42"/><g class="bg-nodes"><circle cx="0" cy="90" r="3"/><circle cx="48" cy="24" r="3"/><circle cx="117" cy="49" r="4"/><circle cx="158" cy="8" r="2"/><circle cx="76" cy="124" r="3"/><circle cx="187" cy="108" r="3"/><circle cx="218" cy="42" r="2"/></g>${label(126,38,'A3')}${label(51,145,'NODE_07')}</g>`;
  const circuit = (x,y,moving=false,extra='') => `<g class="bg-circuit ${extra}" transform="translate(${x} ${y})"><path class="bg-trace" d="M0 24H88V68H174V124H240M44 24V0H124M174 68V32H258M206 124V166H276"/><g class="bg-nodes"><circle cx="0" cy="24" r="3"/><circle cx="258" cy="32" r="3"/><circle cx="240" cy="124" r="3"/><rect x="121" y="-3" width="6" height="6"/></g>${moving?'<path class="bg-data" d="M0 24H88V68H174V124H240"/>':''}${label(89,91,'SYS/03')}${label(210,185,'SIG')}</g>`;
  const math = (x,y,extra='') => `<g class="bg-math ${extra}" transform="translate(${x} ${y})"><path class="bg-guide" d="M0 0H34M0 0V98M0 98H12M8 118H142M142 112V124"/>${label(18,27,'y² = x³ + ax + b')}${label(18,55,'GF(p) · mod n')}${label(18,84,'kG = R')}</g>`;
  const orbit = (x,y,r,moving=false) => `<g class="bg-orbit" transform="translate(${x} ${y})"><g${moving?' class="bg-orbit-turn"':''}><circle class="bg-far" r="${r}"/><path class="bg-far" d="M${-r-24} 0H${-r+40}M0 ${r-20}V${r+20}"/><circle class="bg-nodes" cx="${-r}" cy="0" r="3"/></g></g>`;
  function paint() {
    queued = 0;
    const w = document.body.clientWidth, h = document.body.scrollHeight;
    const sections = [...document.querySelectorAll('main > section')].map(box);
    if (!sections.length || !w || !h) return;
    const first = sections[0], last = sections[sections.length-1];
    const footer = box(document.querySelector('footer'));
    const shapes = [orbit(w+330, first.y+180, 490, true), orbit(-390, footer.y-35, 510)];
    shapes.push(pixel('star',w-104,first.y+74,4,'pixel-twinkle'));
    shapes.push(pixel(page.includes('page-writeups')?'flag':'lock',w-105,first.y+first.h-72,3,'pixel-detail'));
    shapes.push(pixel('bits',22,last.y+44,3,'pixel-detail'),pixel('star',w*.32,footer.y-45,2));
    shapes.push(ticks(26,first.y+38), label(w-135,first.y+58,'024 / 025'));
    if (page.includes('page-work')) {
      shapes.push(circuit(w-310,first.y+115,true));
      const work=sections[1];
      shapes.push(network(-96,work.y+260),circuit(w-162,work.y+work.h-145,false,'bg-secondary'));
      shapes.push(ticks(w*.43,last.y+26),label(26,last.y+last.h-22,'H(m)'));
    } else if (page.includes('page-writeups')) {
      shapes.push(math(w-250,first.y+110),math(16,first.y+first.h-110,'bg-secondary'));
      shapes.push(circuit(w-115,last.y+last.h*.52,true),ticks(w*.55,last.y+28));
      shapes.push(label(20,last.y+last.h*.72,'SHA-256'),label(w-145,last.y+last.h-24,'x ≡ a (mod n)'));
    } else if (page.includes('page-about')) {
      shapes.push(network(w-265,first.y+95),math(18,first.y+first.h-110,'bg-secondary'));
      const bio=sections[1],stack=sections[2];
      shapes.push(network(-80,bio.y+bio.h-170,'bg-secondary'),orbit(w+410,stack.y+250,470));
      shapes.push(circuit(w-230,stack.y+38,true),ticks(22,last.y+40),math(w*.47,last.y+last.h-115));
    } else if (page.includes('page-contact')) {
      shapes.push(math(w*.53,first.y+30,'bg-secondary'),circuit(-105,first.y+first.h-200,true));
      shapes.push(network(w-260,footer.y-180),ticks(w*.45,footer.y-35));
    } else {
      shapes.push(ticks(w-290,first.y+100),label(w-175,first.y+first.h-75,'GF(p)'));
      shapes.push(circuit(-90,last.y+75,true),network(w-150,last.y+last.h-190,'bg-secondary'));
    }
    // A slightly denser ending, always faded away from footer links.
    shapes.push(`<g class="bg-footer">${network(w*.56,footer.y-115)}<circle class="bg-pulse" cx="${w*.56+117}" cy="${footer.y-66}" r="4"/></g>`);
    const candidates = [...document.querySelectorAll('header,footer,main h1,main h2,main h3,main p,main a,main button,main img,main figcaption,main li,main .eyebrow,main .section-head,main .hero-meta,main .hero-foot,main .disciplines,main .profile-visual')]
      .filter(e=>e.getClientRects().length && !e.classList.contains('sr-only')).flatMap(e=>{
        const layout=box(e);
        if(!e.matches('h1,h2,h3,p,figcaption,.eyebrow')) return [layout];
        // Protect the rendered text lines, not the empty rest of a wide heading.
        const range=document.createRange(); range.selectNodeContents(e);
        const origin=e.getBoundingClientRect();
        return [...range.getClientRects()].map(r=>({x:layout.x+r.left-origin.left,y:layout.y+r.top-origin.top,w:r.width,h:r.height}));
      }).filter(b=>b.w&&b.h).sort((a,b)=>b.w*b.h-a.w*a.h);
    const protectedBoxes=[];
    for (const b of candidates) {
      if(!protectedBoxes.some(a=>b.x>=a.x&&b.y>=a.y&&b.x+b.w<=a.x+a.w&&b.y+b.h<=a.y+a.h)) protectedBoxes.push(b);
    }
    const shields=protectedBoxes.map(b=>`<rect x="${b.x-10}" y="${b.y-10}" width="${b.w+20}" height="${b.h+20}" rx="8"/>`).join('');
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    svg.innerHTML=`<defs><filter id="bg-feather" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter><mask id="bg-safe" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="white"/><g fill="black" stroke="black" stroke-width="14" filter="url(#bg-feather)">${shields}</g><g fill="black">${shields}</g></mask></defs><g mask="url(#bg-safe)">${shapes.join('')}</g>`;
  }
  function schedule(){if(!queued)queued=requestAnimationFrame(paint)}
  schedule();
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('load',schedule,{once:true});
  document.fonts?.ready.then(schedule);
  if('ResizeObserver' in window){const observer=new ResizeObserver(schedule);observer.observe(main);observer.observe(document.querySelector('header'));}
  const pause=()=>svg.classList.toggle('is-paused',document.hidden);
  document.addEventListener('visibilitychange',pause);
  pause();
})();
