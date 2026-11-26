/* Eizel: Ariq's pixel heroine, the guide in the bottom-right corner. White hair with a red ribbon, red eyes,
   a black battle dress with a crimson-lined cape and a silver spear, standing on a navy rune stone.
   The frames are drawn in pixel-characters/site_sprite.py and written into the SPRITE block below.
   Decoration only (aria-hidden): every fact in her bubbles is already written on the page.

   Behaviour (the animate skill's gate: each motion has a job; rare moments may delight):
     breathes, blinks, the runes pulse        alive, not a sticker (a few frames a second)
     a glint flares on the spearhead now and then
     eyes follow the cursor (the catchlights) she notices you; fine pointers only
     hover: looks right at you               she notices you
     waves at a link you point at            feedback, at most every 8s
     a bubble per section                    a fact from it, once per section, 6s apart, not in the first 2.5s
                                             (the choreograph skill's attention loops)
     click: hop + speed lines, a grin,       rare, so it may delight
            the spear raised, sparkles at the top of the hop, a fact
     three quick clicks: a sweat drop        flustered, and a short rest before she plays again
     sleeps (night, or 40s with no input)    Zzz, and every rune of the stone lit as a night ward
   At night her outline gets a thin crimson aura so the black dress still reads on the dark paper.
   Effects follow the create-game-vfx checklist: a fixed pool of nodes, restarted not stacked, cleaned by
   class removal, and a still version under reduced motion. Phones: smaller, ducking out while the page scrolls. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var firstVisit = false;
  try { firstVisit = !sessionStorage.getItem('pt-seen'); } catch (e) { /* storage blocked */ }

  /* ---- the sprite: body frames, face patches and the rune stone (generated, see the header) ---- */
  /* @sprite-begin: dibuat oleh pixel-characters/site_sprite.py, jangan diedit dengan tangan */
  var SPRITE = {"w":48,"h":66,"ground":61,"colors":{"O":"#120F17","h":"#FFFFFF","H":"#E4E1EF","j":"#C1BCD7","D":"#8E87AD","S":"#FCE7DC","s":"#EEC3B2","R":"#F5A0AA","M":"#C24C5D","E":"#2A1320","1":"#5C0E22","2":"#AA172F","3":"#EE4252","W":"#FFFFFF","L":"#FFFFFF","B":"#DFE0EB","b":"#AEB0C5","T":"#4E4760","t":"#302A3C","r":"#1F1B28","V":"#4E4760","n":"#302A3C","v":"#1F1B28","Y":"#F3F5FA","G":"#BEC3D5","g":"#80869F","I":"#BEC3D5","i":"#80869F","A":"#FFE4E9","q":"#EE4252","a":"#7B1533","x":"#141A3C","y":"#1E2A5E","z":"#2C3D7A","u":"#3B4A78","0":"#120F17"},"frames":{"stand0":{"rows":[
"................................................","................................................","................................................","................................................","................................................","................................................",".......................................O........","......................................OWO.......","......................................OIO.......",".....................................OWIiO......",".....................................OWIiO......","....................................OWWIiiO.....","....................................OWWIiiO.....","....................................OWWIiiO.....","....................................OWWIiiO.....",".....................................OWIiO......",".....................................OWIiO......","......................................OIO.......",".............................OO......OYGgO......","............................OHjO......OV1OO.....","......................OOOOOOHjOO......OGO32O....","....................OOHhhHHHHHHjOO....OVO32O....",".............O.....OHHHhhhhhHHHHjjO...OVOO21O...","............O3O...O2HhhHHHHHHHHHHjjO..OVOO21O...","............O33OOO22HHHHHHHHHHHHHHjjO.OVO.OO....","............O3331221HHHHHHHHHHHHHHjjjOOVO.......","..........OO0330HH21HjHHHHHHHHHHjHHjjDOVO.......","........OO320300HHH1HHjHHHHHHHHjHHHjjDOVO.......",".......O321OO010HHHHHjHHHHjHHHHjHHHjjD0VO.......",".......O2OOO31H0HHHjHHHjHHHjHHHjHHHjjD0V0O......","........O..O31H0HjSSHjSSHjSSHjSSHjSSjD0V0O......","..........O31hH0HjEEEEEESSSSSSEEEEEEjD0V0O......","..........O31hH0HjSE1WW1ESSSSEWW11ESjD0V0O......","..........O2OhH0HjSS1WW21SSSS1WW21SSjD0V0O......","...........OOhH0HjSS21122SSSS21122SSjD0V0O......","...........OhHH0HjSS322W3SSSS322W3SSjD0V0O......","...........OhHH0HjSSS333SSSSSS333SSSjD0V0O......","...........OhHH0HjSSSSSSSSSsSSSSSSSSjD0V0O......","...........OhHH0HjSRRSSSSSSSSSSSSRRSjD0V0O......","...........OhHj0HHjSSSSSSSMMSSSSSSSjjD0G0O......","..........OhHjH0HHjOsSSSSSSSSSSSSsOjjD0VO.......","..........OhHjH0HHjOOLBsSSSSSSsBbOOjjD0VO.......","..........OhjHH0HHjOLBBBb3221BBBbbOjjD0VO.......",".........OhHjH0hHHjnnVnnnB21BnnnvVnjjj0VO.......","........O2hjHH0HHHjYnnnnnGvvGnnnVnGjjD0VO.......","......OO2hHjHj0VHHjnnvnnnvGGvnnnnnnjDD0VO.......",".....O22hHjHj10YGHjGGgnnnGvvGnnnGGGjDg0VO.......","....O21hHjHj110VnnnvOnnnnvGGvnnnvOnnnn0VO.......","...O21hHjHj110Vnnnv00VnnnGvvGnnvv00nnn0VO.......","...O2hHjjj110Vnnnv000VnnnvGGvnnvv0H0Vv0VO.......","...OHjjj111v0VnnvBTTtO222YGGg22210j0nBTTtO......","..O21H11111v0nvvvBTtrOVVVVVVVLBBbn010BTtrO......","..O2111111v11000nBtrrOnvnnnvnBGBbnn010trrO......","..OY111111v111110OOOO3vnn22nnbbbbn2n010VO.......","...OY1111v1111103L333L332LB222B222B2200VO.......","....OYGGGv111110L0LBLVLBL00BLBnBLB0BL00VO.......",".....OOOOY111YGG01000Vnnv0100Vnnv0G00YOVO.......",".........OYGGOOOYG1032222100322221OYGOOVO.......","..........OOO...OOY0Vnnnnv00VnnnnvOOO.OVO.......","..................OVnnnnnvOOVnnnnnvO..OGO.......","..................OgggggggOOgggggggO..OgO......."
],"head":[12,19],"tip":[39,7]},"stand1":{"rows":[
"................................................","................................................","................................................","................................................","................................................","................................................",".......................................O........","......................................OWO.......","......................................OIO.......",".....................................OWIiO......",".....................................OWIiO......","....................................OWWIiiO.....","....................................OWWIiiO.....","....................................OWWIiiO.....","....................................OWWIiiO.....",".....................................OWIiO......",".....................................OWIiO......","......................................OIO.......",".....................................OYGgO......",".............................OO.......OV1OO.....","............................OHjO......OGO32O....","......................OOOOOOHjOO......OVO32O....","....................OOHhhHHHHHHjOO....OVOO21O...",".............O.....OHHHhhhhhHHHHjjO...OVOO21O...","............O3O...O2HhhHHHHHHHHHHjjO..OVO.OO....","............O33OOO22HHHHHHHHHHHHHHjjO.OVO.......","............O3331221HHHHHHHHHHHHHHjjjOOVO.......","..........OO0330HH21HjHHHHHHHHHHjHHjjDOVO.......","........OO320300HHH1HHjHHHHHHHHjHHHjjDOVO.......",".......O321OO010HHHHHjHHHHjHHHHjHHHjjD0VO.......",".......O2OOO31H0HHHjHHHjHHHjHHHjHHHjjD0V0O......","........O..O31H0HjSSHjSSHjSSHjSSHjSSjD0V0O......","..........O31hH0HjEEEEEESSSSSSEEEEEEjD0V0O......","..........O31hH0HjSE1WW1ESSSSEWW11ESjD0V0O......","..........O2OhH0HjSS1WW21SSSS1WW21SSjD0V0O......","...........OOhH0HjSS21122SSSS21122SSjD0V0O......","...........OhHH0HjSS322W3SSSS322W3SSjD0V0O......","...........OhHH0HjSSS333SSSSSS333SSSjD0V0O......","...........OhHH0HjSSSSSSSSSsSSSSSSSSjD0V0O......","...........OhHH0HjSRRSSSSSSSSSSSSRRSjD0G0O......","...........OhHj0HHjSSSSSSSMMSSSSSSSjjD0V0O......","..........OhHjH0HHjOsSSSSSSSSSSSSsOjjD0VO.......","..........OhHjH0HHjOOLBsSSSSSSsBbOOjjD0VO.......","..........OhjHH0HHjOLBBBb3221BBBbbOjjD0VO.......",".........OhHjH0hHHjnnVnnnB21BnnnvVnjjj0VO.......","........O2hjHH0HHHjYnnnnnGvvGnnnVnGjjD0VO.......","......OO2hHjHj0VHHjnnvnnnvGGvnnnnnnjDD0VO.......",".....O22hHjHj10YGHjGGgnnnGvvGnnnGGGjDg0VO.......","....O21hHjHj110VnnnvOnnnnvGGvnnnvOnnnn0VO.......","...O21hHjHj110Vnnnv00VnnnGvvGnnvv00nnn0VO.......","...O2hHjjj110Vnnnv000VnnnvGGvnnvv0H0Vv0VO.......","...OHjjj111v0VnnvBTTtO222YGGg22210j0nBTTtO......","..O21H11111v0nvvvBTtrOVVVVVVVLBBbn010BTtrO......","..O2111111v11000nBtrrOnvnnnvnBGBbnn010trrO......","..OY111111v111110OOOO3vnn22nnbbbbn2n010VO.......","...OY1111v1111103B333B332BL222L222L2200VO.......","....OYGGGv111110B0BLBVBLB00LBLnLBL0LB00VO.......",".....OOOOY111YGG010032222100322221000YOVO.......",".........OYGGOOOYG10Vnnnnv00VnnnnvOYGOOVO.......","..........OOO...OO0Vnnnnnv00VnnnnnvOO.OGO.......","..................OgggggggOOgggggggO..OgO......."
],"head":[12,20],"tip":[39,7]},"wave0":{"rows":[
"................................................","................................................","................................................","................................................","................................................","................................................",".......................................O........","......................................OWO.......","......................................OIO.......",".....................................OWIiO......",".....................................OWIiO......","....................................OWWIiiO.....","....................................OWWIiiO.....","....................................OWWIiiO.....","....................................OWWIiiO.....",".....................................OWIiO......",".....................................OWIiO......","......................................OIO.......",".............................OO......OYGgO......","............................OHjO......OV1OO.....","......................OOOOOOHjOO......OGO32O....","....................OOHhhHHHHHHjOO....OVO32O....",".............O.....OHHHhhhhhHHHHjjO...OVOO21O...","............O3O...O2HhhHHHHHHHHHHjjO..OVOO21O...","............O33OOO22HHHHHHHHHHHHHHjjO.OVO.OO....","............O3331221HHHHHHHHHHHHHHjjjOOVO.......","..........OO0330HH21HjHHHHHHHHHHjHHjjDOVO.......","........OO320300HHH1HHjHHHHHHHHjHHHjjDOVO.......",".......O321OO010HHHHHjHHHHjHHHHjHHHjjD0VO.......",".......O2OOO31H0HHHjHHHjHHHjHHHjHHHjjD0V0O......","........O..O31H0HjSSHjSSHjSSHjSSHjSSjD0V0O......","..........O31hH0HjEEEEEESSSSSSEEEEEEjD0V0O......","..........O31hH0HjSE1WW1ESSSSEWW11ESjD0V0O......","..........O2OhH0HjSS1WW21SSSS1WW21SSjD0V0O......","...........OOhH0HjSS21122SSSS21122SSjD0V0O......","...........OhHH0HjSS322W3SSSS322W3SSjD0V0O......","...........O00H0HjSSS333SSSSSS333SSSjD0V0O......","..........OTTt00HjSSSSSSSSSsSSSSSSSSjD0V0O......","..........OTtr00HjSRRSSSSSSSSSSSSRRSjD0V0O......","..........Otrr00HHjSSSSSSSMMSSSSSSSjjD0G0O......","..........OBBB00HHjOsSSSSSSSSSSSSsOjjD0VO.......","..........OnVVn0HHjOOLBsSSSSSSsBbOOjjD0VO.......","..........O0Vnv0HHjOLBBBb3221BBBbbOjjD0VO.......",".........Oh0VnvhHHjnnVnnnB21BnnnvVnjjj0VO.......","........O2h0VnnHHHjYnnnnnGvvGnnnVnGjjD0VO.......","......OO2hH0nvnVHHjnnvnnnvGGvnnnnnnjDD0VO.......",".....O22hHjH00nYGHjGGgnnnGvvGnnnGGGjDg0VO.......","....O21hHjHj11000nvvOnnnnvGGvnnnvOnnnn0VO.......","...O21hHjHj1111110000VnnnGvvGnnvv00nnn0VO.......","...O2hHjjj11111111110VnnnvGGvnnvv0H0Vv0VO.......","...OHjjj111v11111v1003222YGGg22210j0nBTTtO......","..O21H11111v1111v10VVVVVVVVVVLBBbn010BTtrO......","..O2111111v11111v0VnnnnvnnnvnBGBbnn010trrO......","..OY111111v1111103nnn3vnn22nnbbbbn2n010VO.......","...OY1111v1111103L333L332LB222B222B2200VO.......","....OYGGGv111110L0LBLVLBL00BLBnBLB0BL00VO.......",".....OOOOY111YGG01000Vnnv0100Vnnv0G00YOVO.......",".........OYGGOOOYG1032222100322221OYGOOVO.......","..........OOO...OOY0Vnnnnv00VnnnnvOOO.OVO.......","..................OVnnnnnvOOVnnnnnvO..OGO.......","..................OgggggggOOgggggggO..OgO......."
],"head":[12,19],"tip":[39,7]},"wave1":{"rows":[
"................................................","................................................","................................................","................................................","................................................","................................................",".......................................O........","......................................OWO.......","......................................OIO.......",".....................................OWIiO......",".....................................OWIiO......","....................................OWWIiiO.....","....................................OWWIiiO.....","....................................OWWIiiO.....","....................................OWWIiiO.....",".....................................OWIiO......",".....................................OWIiO......","......................................OIO.......",".............................OO......OYGgO......","............................OHjO......OV1OO.....","......................OOOOOOHjOO......OGO32O....","....................OOHhhHHHHHHjOO....OVO32O....",".............O.....OHHHhhhhhHHHHjjO...OVOO21O...","............O3O...O2HhhHHHHHHHHHHjjO..OVOO21O...","............O33OOO22HHHHHHHHHHHHHHjjO.OVO.OO....","............O3331221HHHHHHHHHHHHHHjjjOOVO.......","..........OO0330HH21HjHHHHHHHHHHjHHjjDOVO.......","........OO320300HHH1HHjHHHHHHHHjHHHjjDOVO.......",".......O321OO010HHHHHjHHHHjHHHHjHHHjjD0VO.......",".......O2OOO31H0HHHjHHHjHHHjHHHjHHHjjD0V0O......","........O..O31H0HjSSHjSSHjSSHjSSHjSSjD0V0O......","..........O31hH0HjEEEEEESSSSSSEEEEEEjD0V0O......","..........O31hH0HjSE1WW1ESSSSEWW11ESjD0V0O......","..........O2OhH0HjSS1WW21SSSS1WW21SSjD0V0O......","...........OOhH0HjSS21122SSSS21122SSjD0V0O......","...........OhHH0HjSS322W3SSSS322W3SSjD0V0O......","...........OhHH0HjSSS333SSSSSS333SSSjD0V0O......","........OOOOhHH0HjSSSSSSSSSsSSSSSSSSjD0V0O......",".......OTTtOhHH0HjSRRSSSSSSSSSSSSRRSjD0V0O......",".......OTtrB0Hj0HHjSSSSSSSMMSSSSSSSjjD0G0O......",".......OtrrB0jH0HHjOsSSSSSSSSSSSSsOjjD0VO.......","........OBBVn0H0HHjOOLBsSSSSSSsBbOOjjD0VO.......",".........Onnnn00HHjOLBBBb3221BBBbbOjjD0VO.......",".........O0VnnnhHHjnnVnnnB21BnnnvVnjjj0VO.......","........O20nnnnHHHjYnnnnnGvvGnnnVnGjjD0VO.......","......OO2hH0nvnVHHjnnvnnnvGGvnnnnnnjDD0VO.......",".....O22hHjH00nYGHjGGgnnnGvvGnnnGGGjDg0VO.......","....O21hHjHj11000nvvOnnnnvGGvnnnvOnnnn0VO.......","...O21hHjHj1111110000VnnnGvvGnnvv00nnn0VO.......","...O2hHjjj11111111110VnnnvGGvnnvv0H0Vv0VO.......","...OHjjj111v11111v1003222YGGg22210j0nBTTtO......","..O21H11111v1111v10VVVVVVVVVVLBBbn010BTtrO......","..O2111111v11111v0VnnnnvnnnvnBGBbnn010trrO......","..OY111111v1111103nnn3vnn22nnbbbbn2n010VO.......","...OY1111v1111103L333L332LB222B222B2200VO.......","....OYGGGv111110L0LBLVLBL00BLBnBLB0BL00VO.......",".....OOOOY111YGG01000Vnnv0100Vnnv0G00YOVO.......",".........OYGGOOOYG1032222100322221OYGOOVO.......","..........OOO...OOY0Vnnnnv00VnnnnvOOO.OVO.......","..................OVnnnnnvOOVnnnnnvO..OGO.......","..................OgggggggOOgggggggO..OgO......."
],"head":[12,19],"tip":[39,7]},"cheer":{"rows":[
"................................................","................................................","........................................O.......",".......................................OWO......",".......................................OIO......","......................................OWIiO.....","......................................OWIiO.....",".....................................OWWIiiO....",".....................................OWWIiiO....",".....................................OWWIiiO....",".....................................OWWIiiO....","......................................OWIiO.....","......................................OWIiO.....",".......................................OIO......","......................................OYGgO.....",".......................................OV1OO....",".......................................OGO32O...",".......................................OVO32O...",".............................OO........OVOO21O..","............................OHjO.......OVOO21O..","......................OOOOOOHjOO.......OVO.OO...","....................OOHhhHHHHHHjOO.....OVO......",".............O.....OHHHhhhhhHHHHjjO....OVO......","............O3O...O2HhhHHHHHHHHHHjjO...OVO......","............O33OOO22HHHHHHHHHHHHHHjjO..OVO......","............O3331221HHHHHHHHHHHHHHjjjO.OVO......","..........OO0330HH21HjHHHHHHHHHHjHHjjDOOVO......","........OO320300HHH1HHjHHHHHHHHjHHHjjDOOVO......",".......O321OO010HHHHHjHHHHjHHHHjHHHjjD00VO......",".......O2OOO31H0HHHjHHHjHHHjHHHjHHHjjD00VO......","........O..O31H0HjSSHjSSHjSSHjSSHjSSjD00VO......","..........O31hH0HjEEEEEESSSSSSEEEEEEjD00VO......","..........O31hH0HjSE1WW1ESSSSEWW11ESjD00VO......","..........O2OhH0HjSS1WW21SSSS1WW21SSjD00VO......",".........OOOOhH0HjSS21122SSSS21122SSjD00VO......","........OTTt0HH0HjSS322W3SSSS322W3SSjD00GO......","........OTtr0HH0HjSSS333SSSSSS333SSSjD00VO......","........OtrrB0H0HjSSSSSSSSSsSSSSSSSSjD00VO......","........OBBBn0H0HjSRRSSSSSSSSSSSSRRSjD00VO......",".........OVVv0j0HHjSSSSSSSMMSSSSSSSjjD00VO......",".........OVnnn00HHjOsSSSSSSSSSSSSsOjjD0TTtO.....",".........Onnnv00HHjOOLBsSSSSSSsBbOOjjD0TtrO.....","..........OVnnn0HHjOLBBBb3221BBBbbOjjDBtrrO.....",".........O0nvnnhHHjnnVnnnB21BnnnvVnjjjD0V0O.....","........O2h00nnHHHjYnnnnnGvvGnnnVnGjjDD0VO......","......OO2hHjH0nVHHjnnvnnnvGGvnnnnnnjDDv0VO......",".....O22hHjHj10YGHjGGgnnnGvvGnnnGGGjDggOVO......","....O21hHjHj11100nvvOnnnnvGGvnnnvOnvv00OVO......","...O21hHjHj1111110000VnnnGvvGnnvv00001vOVO......","...O2hHjjj11111111110VnnnvGGvnnvv0Hj11vOVO......","...OHjjj111v11111v1003222YGGg22210j111vOVO......","..O21H11111v1111v10VVVVVVVVVVLBBbn0111vOVO......","..O2111111v11111v0VnnnnvnnnvnBGBbnn011vOVO......","..OY111111v1111103nnn3vnn22nnbbbbn2n01vOVO......","...OY1111v1111103L333L332LB222B222B220vOVO......","....OYGGGv111110L0LBLVLBL00BLBnBLB0BL0YOGO......",".....OOOOY111YGG01000Vnnv0100Vnnv0G00YOOgO......",".........OYGGOOOYG1032222100322221OYGO..O.......","..........OOO...OOY0Vnnnnv00VnnnnvOOO...........","..................OVnnnnnvOOVnnnnnvO............","..................OgggggggOOgggggggO............"
],"head":[12,19],"tip":[40,3]}},"plate":["zuuuuzuuuuzuuuuzuuuuzuuuuzuuuuzuuuuzuuuuzuuuuzuu","zzyzzzzzyzzzzzyzzzzzyzzzzzyzzzzzyzzzzzyzzzzzyzzz","xyyaaayyyyaaayyxyaaaxyyyaaayyyxaaayxyyaaayyyyxyy","xyyyaxyyyyxayyyxyyayxyyyyayyyyxyayyxyyyaxyyyyxyy","xyyyyxyyyyxyyyyxyyyyxyyyyxyyyyxyyyyxyyyyxyyyyxyy"],"face":{"x":6,"y":12,"w":18,"h":10},"faces":{"blink":["SSSSSSSSSSSSSSSSSS","SSSSSSSSSSSSSSSSSS","SSSSSSSSSSSSSSSSSS","SSEEEEESSSSEEEEESS","SESSSSSSSSSSSSSSES","SSSSSSSSSSSSSSSSSS","SSSSSSSSSsSSSSSSSS","SRRSSSSSSSSSSSSRRS","jSSSSSSSMMSSSSSSSj","j.sSSSSSSSSSSSSs.j"],"happy":["SSSSSSSSSSSSSSSSSS","SSSSSSSSSSSSSSSSSS","SSSEEESSSSSSEEESSS","SSESSSESSSSESSSESS","SSSSSSSSSSSSSSSSSS","SSSSSSSSSSSSSSSSSS","SSSSSSSSSsSSSSSSSS","SRRSSSSSSSSSSSSRRS","jSSSSSSMMMMSSSSSSj","j.sSSSSSRRSSSSSs.j"],"sleep":["SSSSSSSSSSSSSSSSSS","SSSSSSSSSSSSSSSSSS","SSSSSSSSSSSSSSSSSS","SSESSSESSSSESSSESS","SSSEEESSSSSSEEESSS","SSSSSSSSSSSSSSSSSS","SSSSSSSSSsSSSSSSSS","SRRSSSSSSSSSSSSRRS","jSSSSSSSMMSSSSSSSj","j.sSSSSSSSSSSSSs.j"],"yawn":["SSSSSSSSSSSSSSSSSS","SSSSSSSSSSSSSSSSSS","SSSSSSSSSSSSSSSSSS","SSESSSESSSSESSSESS","SSSEEESSSSSSEEESSS","SSSSSSSSSSSSSSSSSS","SSSSSSSSSsSSSSSSSS","SRRSSSSSSSSSSSSRRS","jSSSSSSSMMSSSSSSSj","j.sSSSSSMMSSSSSs.j"],"shout":["EEEEEESSSSSSEEEEEE","SE1WW1ESSSSEWW11ES","SS1WW21SSSS1WW21SS","SS21122SSSS21122SS","SS322W3SSSS322W3SS","SSS333SSSSSS333SSS","SSSSSSSSSsSSSSSSSS","SRRSSSSSSSSSSSSRRS","jSSSSSSSMMSSSSSSSj","j.sSSSSSMMSSSSSs.j"],"o00":["EEEEEESSSSSSEEEEEE","SEWW11ESSSSWW111ES","SSWW121SSSSWW121SS","SS21122SSSS21122SS","SS32W33SSSS32W33SS","SSS333SSSSSS333SSS","SSSSSSSSSsSSSSSSSS","SRRSSSSSSSSSSSSRRS","jSSSSSSSMMSSSSSSSj","j.sSSSSSSSSSSSSs.j"],"o01":["EEEEEESSSSSSEEEEEE","SE1111ESSSSE1111ES","SSWW121SSSSWW121SS","SSWW122SSSSWW122SS","SS32W33SSSS32W33SS","SSS333SSSSSS333SSS","SSSSSSSSSsSSSSSSSS","SRRSSSSSSSSSSSSRRS","jSSSSSSSMMSSSSSSSj","j.sSSSSSSSSSSSSs.j"],"o10":["EEEEEESSSSSSEEEEEE","SE1WW1ESSSSEWW11ES","SS1WW21SSSS1WW21SS","SS21122SSSS21122SS","SS322W3SSSS322W3SS","SSS333SSSSSS333SSS","SSSSSSSSSsSSSSSSSS","SRRSSSSSSSSSSSSRRS","jSSSSSSSMMSSSSSSSj","j.sSSSSSSSSSSSSs.j"],"o11":["EEEEEESSSSSSEEEEEE","SE1111ESSSSE1111ES","SS1WW21SSSS1WW21SS","SS2WW22SSSS2WW22SS","SS322W3SSSS322W3SS","SSS333SSSSSS333SSS","SSSSSSSSSsSSSSSSSS","SRRSSSSSSSSSSSSRRS","jSSSSSSSMMSSSSSSSj","j.sSSSSSSSSSSSSs.j"],"o20":["EEEEEESSSSSSEEEEEE","SE11WWESSSSE1WW1ES","SS11WW1SSSS11WW1SS","SS21122SSSS21122SS","SS3223WSSSS3223WSS","SSS333SSSSSS333SSS","SSSSSSSSSsSSSSSSSS","SRRSSSSSSSSSSSSRRS","jSSSSSSSMMSSSSSSSj","j.sSSSSSSSSSSSSs.j"],"o21":["EEEEEESSSSSSEEEEEE","SE1111ESSSSE1111ES","SS11WW1SSSS11WW1SS","SS21WW2SSSS21WW2SS","SS3223WSSSS3223WSS","SSS333SSSSSS333SSS","SSSSSSSSSsSSSSSSSS","SRRSSSSSSSSSSSSRRS","jSSSSSSSMMSSSSSSSj","j.sSSSSSSSSSSSSs.j"]}};
  /* @sprite-end */
  var GW = SPRITE.w, GH = SPRITE.h, GROUND = SPRITE.ground, FACE = SPRITE.face;
  var HEAD = SPRITE.frames.stand0.head;
  var RUNES = [];                      // the rune stone's glyph cells, one glyph per entry
  SPRITE.plate.forEach(function (row, j) {
    for (var x = 0; x < row.length; x++) if (row[x] === 'a') {
      var g = Math.floor(x / 7);
      (RUNES[g] = RUNES[g] || []).push([x, GROUND + j]);
    }
  });
  RUNES = RUNES.filter(Boolean);

  /* ---- what the bubble says: facts from each section of each page ---- */
  var SAYS = {
    hello_world: "Hi, I'm Eizel! Ariq does crypto and blockchain CTFs, mostly.",
    selected_work: 'SecureVault encrypts files right in your browser.',
    latest_notes: 'Palumara is the long one: 17 minutes.',
    biography: "That's Ariq in the photo. I keep watch down here.",
    achievements: 'Three podiums so far. First place at Schematics 2026!',
    authored: 'He writes challenges too. HOLOGY 9 was the last.',
    community: 'Ariq leads Hack It Braw since September 2026.',
    on_repeat: 'Yorushika, Kenshi Yonezu, ZUTOMAYO. On repeat.',
    anime: 'Evangelion and Death Note, always.',
    writeups: '11 reports, 1,131 pages. Pull one off the shelf!',
    the_shelf: 'A thicker spine means more pages.',
    more_notes: 'Shorter notes live on HackMD.',
    notebook: 'Long posts, one challenge each.',
    posts: 'Try the search: lattice, RSA, Sui.',
    dashboard: 'Nothing here leaves your browser.',
    encrypt_file: 'AES-256-GCM, and no server involved.',
    introduction: 'Floating-point nonces, then lattices. Enjoy!',
    the_final_trap: "Careful, there's a trap at the end.",
    solver_and_execution: 'The flag is close now.'
  };
  var FACTS = ["I'm Eizel, Ariq's guide around here. Nice to meet you!", 'Ariq has 3 podiums, 6 finals and 1 best writeup.',
    'He wrote 11 writeups, 1,131 pages in all.', 'He studies IT at Universitas Brawijaya.', 'flag{you_found_eizel}'];

  /* ---- DOM: the sprite, the bubble and a fixed pool of effect nodes ---- */
  var STAR = '<svg viewBox="0 0 5 5" shape-rendering="crispEdges"><path d="M2 0h1v2h2v1H3v2H2V3H0V2h2z"/></svg>';
  var NOTE = '<svg viewBox="0 0 5 7" shape-rendering="crispEdges"><path d="M3 0h2v1H4v4H1V4H0V5h1v1h2V1h1z"/><path d="M0 4h3v2H0z"/></svg>';
  var DROP = '<svg viewBox="0 0 4 6" shape-rendering="crispEdges"><path d="M1 0h1v1h1v1h1v3H3v1H1V5H0V2h1z"/></svg>';
  var el = document.createElement('div');
  el.className = 'chibi';
  el.setAttribute('aria-hidden', 'true');
  // the CSS places the bubble tail, the "!" and the Zzz from the sprite size and where the head sits
  el.style.setProperty('--sw', GW); el.style.setProperty('--sh', GH);
  el.style.setProperty('--hx', HEAD[0]); el.style.setProperty('--hy', HEAD[1]);
  el.innerHTML =
    '<p class="chibi__bubble"><span class="chibi__text"></span></p>' +
    '<div class="chibi__body">' +
      '<canvas class="chibi__sprite" width="' + GW + '" height="' + GH + '"></canvas>' +
      '<span class="chibi__hit"></span>' +
      '<span class="chibi__fx chibi__star chibi__star--1">' + STAR + '</span><span class="chibi__fx chibi__star chibi__star--2">' + STAR + '</span>' +
      '<span class="chibi__fx chibi__star chibi__star--3">' + STAR + '</span><span class="chibi__fx chibi__star chibi__star--4">' + STAR + '</span>' +
      '<span class="chibi__fx chibi__note chibi__note--1">' + NOTE + '</span><span class="chibi__fx chibi__note chibi__note--2">' + NOTE + '</span>' +
      '<span class="chibi__fx chibi__drop">' + DROP + '</span>' +
      '<span class="chibi__z chibi__z--1">z</span><span class="chibi__z chibi__z--2">z</span><span class="chibi__z chibi__z--3">Z</span>' +
      '<span class="chibi__bang">!</span>' +
    '</div>';
  document.body.appendChild(el);
  var body = el.querySelector('.chibi__body');
  var canvas = el.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var bubble = el.querySelector('.chibi__bubble');
  var text = el.querySelector('.chibi__text');
  var img = ctx.createImageData(GW, GH);
  var RGB = {};
  Object.keys(SPRITE.colors).forEach(function (k) { var h = SPRITE.colors[k]; RGB[k] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; });

  /* ---- state ---- */
  var s = {
    breath: 0, blink: false, wave: -1, look: [0, 0], mood: 'idle',   // idle | happy | sleep | yawn | shy | flustered
    cheer: false, asleep: false, sheen: -1, rune: 0, lastInput: Date.now(), lastBubble: 0, said: {}, ready: false, current: null
  };
  function night() { return root.getAttribute('data-theme') === 'dark'; }

  /* ---- drawing: pick a body frame, lay the face patch on it, add the glint, the runes and the stone ---- */
  var GLINT = [                                        // the spearhead glint: grows, flares, fades
    [[0, 0, 'A']],
    [[0, 0, 'A'], [0, -1, 'Q'], [0, 1, 'Q'], [-1, 0, 'Q'], [1, 0, 'Q']],
    [[0, 0, 'A'], [0, -1, 'A'], [0, 1, 'A'], [-1, 0, 'A'], [1, 0, 'A'], [0, -2, 'Q'], [0, 2, 'Q'], [-2, 0, 'Q'], [2, 0, 'Q']],
    [[0, 0, 'A'], [0, -1, 'Q'], [0, 1, 'Q'], [-1, 0, 'Q'], [1, 0, 'Q']],
    [[0, 0, 'Q']]
  ];
  function frameName() {
    if (s.wave >= 0) return 'wave' + s.wave;
    if (s.cheer && s.mood === 'happy') return 'cheer';
    return 'stand' + s.breath;
  }
  function faceName() {
    if (s.mood === 'sleep') return 'sleep';
    if (s.mood === 'yawn') return 'yawn';
    if (s.mood === 'happy') return 'happy';
    if (s.mood === 'flustered') return 'shout';
    if (s.blink) return 'blink';
    return 'o' + (s.look[0] + 1) + s.look[1];
  }
  function compose() {
    var f = SPRITE.frames[frameName()], grid = [], x, y, i, j;
    f.rows.forEach(function (r) { grid.push(r.split('')); });
    SPRITE.plate.forEach(function (r) { grid.push(r.split('')); });
    var face = SPRITE.faces[faceName()], hx = f.head[0] + FACE.x, hy = f.head[1] + FACE.y;
    for (j = 0; j < face.length; j++) for (i = 0; i < face[j].length; i++) if (face[j][i] !== '.') grid[hy + j][hx + i] = face[j][i];
    if (s.sheen >= 0 && GLINT[s.sheen]) GLINT[s.sheen].forEach(function (p) {
      x = f.tip[0] + p[0]; y = f.tip[1] + p[1];
      if (y >= 0 && y < GROUND && x >= 0 && x < GW) grid[y][x] = p[2];
    });
    // one glyph of the stone lit at a time, travelling left to right; all lit while she sleeps (a night ward)
    var n = RUNES.length;
    RUNES.forEach(function (cells, g) {
      var c = s.asleep || reduce ? 'q' : g === s.rune % n ? 'Q' : g === (s.rune + n - 1) % n ? 'q' : 'a';
      cells.forEach(function (p) { grid[p[1]][p[0]] = c; });
    });
    // night: a crimson aura around the outline, so the black dress reads on the dark paper
    if (night()) {
      var aura = [];
      for (y = 0; y < GROUND; y++) for (x = 0; x < GW; x++) {
        if (grid[y][x] !== '.') continue;
        if ((y > 0 && grid[y - 1][x] === 'O') || (y < GROUND - 1 && grid[y + 1][x] === 'O') ||
            (x > 0 && grid[y][x - 1] === 'O') || (x < GW - 1 && grid[y][x + 1] === 'O')) aura.push([x, y]);
      }
      aura.forEach(function (p) { grid[p[1]][p[0]] = 'a'; });
    }
    return grid;
  }
  function draw() {
    var grid = compose(), d = img.data;
    for (var y = 0; y < GH; y++) for (var x = 0; x < GW; x++) {
      var i4 = (y * GW + x) * 4, v = RGB[grid[y][x]];
      if (!v) { d[i4 + 3] = 0; continue; }
      d[i4] = v[0]; d[i4 + 1] = v[1]; d[i4 + 2] = v[2]; d[i4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  /* ---- effects: restart a node's animation by toggling its class (never a new node) ---- */
  function fx(name, ms) {
    el.classList.remove('fx-' + name);
    void el.offsetWidth;
    el.classList.add('fx-' + name);
    clearTimeout(fx['t' + name]);
    fx['t' + name] = setTimeout(function () { el.classList.remove('fx-' + name); }, ms);
  }

  /* ---- the bubble: wipes in, types, stays a moment, goes ---- */
  var typeTimer = 0, hideTimer = 0;
  function say(msg, force) {
    var now = Date.now();
    if (!force && (s.asleep || !s.ready || now - s.lastBubble < 6000)) return false;
    s.lastBubble = now;
    clearInterval(typeTimer); clearTimeout(hideTimer);
    el.classList.add('is-talking');
    bubble.classList.remove('is-out');
    if (reduce) text.textContent = msg;
    else {
      var n = 0;
      text.textContent = '';
      typeTimer = setInterval(function () { n++; text.textContent = msg.slice(0, n); if (n >= msg.length) clearInterval(typeTimer); }, 22);
    }
    hideTimer = setTimeout(function () {
      bubble.classList.add('is-out');
      setTimeout(function () { el.classList.remove('is-talking'); bubble.classList.remove('is-out'); }, 160);
    }, 2600 + msg.length * 40);
    return true;
  }

  /* ---- moods ---- */
  var moodTimer = 0, napTimer = 0;
  function setMood(m, ms) {
    clearTimeout(moodTimer);
    s.mood = m;
    draw();
    if (ms) moodTimer = setTimeout(function () { s.cheer = false; s.mood = s.asleep ? 'sleep' : (body.matches(':hover') ? 'shy' : 'idle'); draw(); }, ms);
  }
  function sleep() {
    if (s.asleep) return;
    s.asleep = true; s.wave = -1; s.cheer = false;
    clearInterval(typeTimer); el.classList.remove('is-talking');
    setMood(reduce ? 'sleep' : 'yawn', 0);
    if (!reduce) setTimeout(function () { if (s.asleep) setMood('sleep', 0); }, 700);
    el.classList.add('is-asleep');
  }
  function wake(msg) {
    if (!s.asleep) return;
    s.asleep = false;
    el.classList.remove('is-asleep');
    setMood(body.matches(':hover') ? 'shy' : 'idle', 0);
    fx('bang', 520);
    if (msg) setTimeout(function () { say(msg, true); }, 160);
    // at night she only wakes for a moment, however she was woken (a tap has no pointerleave)
    if (night()) { clearTimeout(napTimer); napTimer = setTimeout(function () { if (night() && !body.matches(':hover')) sleep(); }, 5000); }
  }
  var waveTimer = 0;
  function wave(ms) {
    if (s.asleep || reduce) return;
    clearInterval(waveTimer);
    var t = 0;
    s.wave = 0; draw();
    waveTimer = setInterval(function () {
      t += 180;
      if (t >= ms) { clearInterval(waveTimer); s.wave = -1; draw(); return; }
      s.wave = s.wave ? 0 : 1; draw();
    }, 180);
  }
  // the spearhead glint: a star that grows on the tip and fades
  var sheenTimer = 0, nextSheen = Date.now() + 3500;
  function sheen() {
    if (reduce || s.asleep) return;
    clearInterval(sheenTimer);
    s.sheen = 0; draw();
    sheenTimer = setInterval(function () {
      s.sheen++;
      if (s.sheen >= GLINT.length) { clearInterval(sheenTimer); s.sheen = -1; }
      draw();
    }, 90);
  }

  /* ---- the idle loop: eight ticks a second, paused with the tab ---- */
  var tick = 0, nextBlink = Date.now() + 2500;
  setInterval(function () {
    if (document.hidden) return;
    tick++;
    var now = Date.now(), changed = false;
    var period = s.asleep ? 8 : 4;
    var nb = reduce ? 0 : Math.floor(tick / period) % 2;
    if (nb !== s.breath) {
      s.breath = nb; changed = true;
      s.rune++;                                                             // the next glyph lights, a breath each
    }
    if (!reduce && !s.asleep && now >= nextBlink) {
      s.blink = true; changed = true;
      nextBlink = now + 2500 + Math.random() * 3000;
      setTimeout(function () { s.blink = false; draw(); }, 140);
    }
    if (!s.asleep && now >= nextSheen) { nextSheen = now + 5000 + Math.random() * 2500; sheen(); }
    if (!s.asleep && !night() && now - s.lastInput > 40000) sleep();
    if (changed) draw();
  }, 125);

  /* ---- input ---- */
  function noteInput() { s.lastInput = Date.now(); if (s.asleep && !night()) wake(); }
  ['pointerdown', 'keydown', 'scroll'].forEach(function (t) { window.addEventListener(t, noteInput, { passive: true }); });

  if (fine && !reduce) {
    // the catchlights follow the pointer, a pixel each way
    var lookRaf = 0, px = 0, py = 0;
    window.addEventListener('pointermove', function (e) {
      px = e.clientX; py = e.clientY;
      noteInput();
      if (lookRaf) return;
      lookRaf = requestAnimationFrame(function () {
        lookRaf = 0;
        var r = canvas.getBoundingClientRect();
        var dx = px - (r.left + r.width * (HEAD[0] + 15) / GW), dyy = py - (r.top + r.height * (HEAD[1] + 15) / GH);
        var lx = dx < -48 ? -1 : dx > 48 ? 1 : 0, ly = dyy > 64 ? 1 : 0;
        if (body.matches(':hover')) { lx = 0; ly = 0; }
        if (lx !== s.look[0] || ly !== s.look[1]) { s.look = [lx, ly]; draw(); }
      });
    }, { passive: true });
    // a wave at the link under the pointer, at most every 8 seconds
    var lastWave = 0;
    document.addEventListener('pointerover', function (e) {
      var a = e.target.closest && e.target.closest('main a, footer a');
      if (!a || !s.ready || Date.now() - lastWave < 8000) return;
      lastWave = Date.now();
      wave(900);
    });
    // music notes over the tracks
    document.addEventListener('pointerover', function (e) {
      if (!s.asleep && e.target.closest && e.target.closest('.track')) fx('notes', 1700);
    });
  }

  // hover: she looks right at you
  body.addEventListener('pointerenter', function () {
    s.look = [0, 0];
    if (s.asleep) wake(night() ? 'zzz... oh, still up?' : null);
    if (s.mood === 'idle') setMood('shy', 0); else draw();
  });
  body.addEventListener('pointerleave', function () {
    if (s.mood === 'shy') setMood('idle', 0);
    clearTimeout(napTimer);
    if (night()) napTimer = setTimeout(sleep, 4000);
  });
  // click: a hop with speed lines, a grin and the spear raised, sparkles at the top of the hop, a fact;
  // three quick clicks fluster her
  var factIx = Math.floor(Math.random() * FACTS.length), clicks = [], restUntil = 0, starTimer = 0, sayTimer = 0;
  body.addEventListener('click', function () {
    var now = Date.now();
    s.lastInput = now;
    if (now < restUntil) return;
    if (s.asleep) wake();
    // a new click cancels the last one's pending sparkle and line, so reactions never land out of order
    clearTimeout(starTimer); clearTimeout(sayTimer);
    clicks = clicks.filter(function (t) { return now - t < 2500; }).concat(now);
    if (clicks.length >= 3) {
      clicks = []; restUntil = now + 1500;
      el.classList.remove('fx-stars');
      s.cheer = false; setMood('flustered', 1500); fx('drop', 1000);
      say('Okay, okay!', true);
      return;
    }
    if (!reduce) { body.classList.remove('is-hop'); void body.offsetWidth; body.classList.add('is-hop'); fx('lines', 300); }
    s.cheer = true; setMood('happy', 1100);
    starTimer = setTimeout(function () { fx('stars', 700); }, reduce ? 0 : 130);
    factIx = (factIx + 1) % FACTS.length;
    sayTimer = setTimeout(function () { say(FACTS[factIx], true); }, reduce ? 0 : 120);
  });

  // a bubble for the section in view (site.js reports it on every scroll frame)
  function sectionSay() {
    var name = s.current;
    if (!name || !SAYS[name] || s.said[name]) return;
    if (say(SAYS[name])) { s.said[name] = true; if (name === 'on_repeat') fx('notes', 1700); }
  }
  document.addEventListener('section:update', function (e) { s.current = e.detail && e.detail.name; sectionSay(); });

  // the theme: night puts her to bed, morning wakes her with a sparkle
  document.addEventListener('prefs:change', function (e) {
    if (e.detail.key !== 'theme') return;
    if (e.detail.value === 'dark') sleep();
    else if (s.asleep) { s.lastInput = Date.now(); wake('Morning!'); setTimeout(function () { fx('stars', 700); }, 120); }
    draw();
  });

  // phones: duck while the page scrolls, come back when it stops
  if (!fine) {
    var tuckTimer = 0;
    window.addEventListener('scroll', function () {
      el.classList.add('is-tucked');
      clearTimeout(tuckTimer);
      tuckTimer = setTimeout(function () { el.classList.remove('is-tucked'); }, 700);
    }, { passive: true });
  }

  // previews and tests can set a pose: window.pxChibi.pose({ mood: 'happy', cheer: true })
  window.pxChibi = { pose: function (o) { Object.keys(o).forEach(function (k) { s[k] = o[k]; }); draw(); }, state: s };

  /* ---- start ---- */
  if (night()) { s.asleep = true; s.mood = 'sleep'; el.classList.add('is-asleep'); }
  draw();
  function begin() {
    if (firstVisit && !reduce && !night()) {
      el.classList.add('is-enter');
      setTimeout(function () {
        s.ready = true;
        fx('stars', 700);                                                   // she lands with a sparkle
        wave(1100);
        if (say(SAYS.hello_world, true)) s.said.hello_world = true;
      }, 440);
    } else {
      setTimeout(function () { s.ready = true; sectionSay(); }, 2500);       // the first word waits a moment
    }
  }
  if (root.classList.contains('pt-enter')) {
    var started = false;
    var go = function () { if (!started) { started = true; begin(); } };
    document.addEventListener('pt:reveal', go, { once: true });
    setTimeout(go, 1900);
  } else begin();
})();
