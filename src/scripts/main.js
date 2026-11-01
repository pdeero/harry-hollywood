/* Harry Hollywood
   1. Filmszenen (GLSL)   2. Greenscreen   3. Reel   4. Timeline   5. Formular */
(() => {
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

  /* ---------- 1. Filmszenen ---------- */

  const GLSL_COMMON = `
precision highp float;
#define PI 3.14159265
float h11(float p){p=fract(p*.1031);p*=p+33.33;p*=p+p;return fract(p);}
float h21(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
vec2 h22(vec2 p){vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));q+=dot(q,q.yzx+33.33);return fract((q.xx+q.yz)*q.zy);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vn(p);p=p*2.03+17.;a*=.5;}return s;}

float cap(vec2 p,vec2 a,vec2 b,float r){vec2 pa=p-a,ba=b-a;return length(pa-ba*clamp(dot(pa,ba)/dot(ba,ba),0.,1.))-r;}
float smin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}

/* Nachtfahrt: Lichter ziehen am Fluchtpunkt vorbei */
vec3 s0(vec2 p,float t){
  p-=vec2(.15,.14);
  float r=length(p),a=atan(p.y,p.x);
  vec3 c=mix(vec3(.012,.014,.04),vec3(.03,.05,.12),smoothstep(-.1,1.,p.y));
  if(p.y<0.){
    float y=1./(-p.y+.03),x=p.x*y;
    c=vec3(.012,.013,.018)+vec3(.09,.05,.03)*exp(p.y*4.);
    float dash=step(.55,fract(y*.28-t*2.6))*smoothstep(.16,.09,abs(x));
    c+=dash*vec3(.85,.8,.65)*smoothstep(0.,.1,-p.y);
    c+=vec3(.7,.06,.04)*exp(-abs(x-1.3)*2.)*smoothstep(-.8,0.,p.y)*.35;
  }
  for(float l=0.;l<3.;l++){
    float N=26.+l*17.,cell=floor(a/(2.*PI)*N),rnd=h11(cell+l*31.);
    if(rnd<.6) continue;
    float da=(fract(a/(2.*PI)*N)-.5)/N*2.*PI*r;
    float z=fract(log(r+.03)*1.1-t*(.3+rnd*.45)+rnd*9.);
    float s=exp(-abs(da)*90./(.35+r))*pow(z,9.)*smoothstep(.06,.4,r);
    vec3 col=p.y>0.?mix(vec3(1.,.5,.13),vec3(.45,.65,1.),step(.82,rnd)):mix(vec3(1.,.12,.08),vec3(1.,.9,.7),step(0.,p.x));
    c+=col*s*1.3;
  }
  c+=vec3(1.,.55,.28)*exp(-r*5.)*.75;
  return c;
}

/* Stroboskop: Lichtkegel im Nebel, Silhouette auf der Bühne */
vec3 s1(vec2 p,float t){
  float haze=.6+.9*fbm(p*1.6+vec2(t*.12,-t*.08));
  vec3 c=vec3(.05,.015,.075)*(1.+p.y*.5);
  float strobe=step(.9,h11(floor(t*11.)));
  for(float i=0.;i<6.;i++){
    vec2 o=vec2(-1.5+i*.6,1.2);
    float th=sin(t*(.5+i*.11)+i*1.9)*.62+(i-2.5)*-.09;
    vec2 d=p-o;float ang=atan(d.x,-d.y);
    float w=.1+.08*h11(i+3.);
    float cone=smoothstep(w,0.,abs(ang-th))*exp(-length(d)*.42);
    vec3 col=mod(i,2.)<1.?vec3(1.,.08,.55):vec3(.1,.5,1.);
    if(i==2.)col=vec3(1.,.82,.6);
    c+=col*cone*haze*1.5;
  }
  c+=vec3(.9,.92,1.)*strobe*.2*haze;
  float fl=smoothstep(-.62,-1.,p.y);
  c+=vec3(.5,.1,.45)*fl*.3*fbm(p*vec2(1.,6.));
  vec2 b=p-vec2(0.,-.3);
  float sway=sin(t*1.7)*.025;
  vec2 hip=vec2(sway,-.1),neck=vec2(-sway*.6,.42),head=neck+vec2(.05,.13);
  float body=min(cap(b,hip,neck,.1),length(b-head)-.085);
  body=smin(body,cap(b,hip+vec2(-.05,0.),vec2(-.17,-.82),.062),.05);
  body=smin(body,cap(b,hip+vec2(.05,0.),vec2(.2,-.82),.062),.05);
  body=smin(body,cap(b,neck+vec2(.08,-.02),vec2(.2,.2),.042),.04);
  body=smin(body,cap(b,vec2(.2,.2),head+vec2(.09,-.03),.036),.03);
  body=smin(body,cap(b,neck+vec2(-.08,-.02),vec2(-.26,.28),.042),.04);
  body=smin(body,cap(b,vec2(-.26,.28),vec2(-.31,.68+sway),.036),.03);
  c*=smoothstep(-.004,.012,body);
  return c;
}

/* Bernstein: glänzende Flüssigkeit im Makro */
float liq(vec2 p,float t){
  vec2 q=vec2(fbm(p+vec2(0.,t*.13)),fbm(p+vec2(5.2,1.3-t*.1)));
  return fbm(p*1.1+q*2.4);
}
vec3 s2(vec2 p,float t){
  p*=1.1;
  float e=.012,h=liq(p,t),hx=liq(p+vec2(e,0.),t),hy=liq(p+vec2(0.,e),t);
  vec3 n=normalize(vec3((h-hx)/e*.36,(h-hy)/e*.36,1.));
  vec3 l=normalize(vec3(.5,.7,.6));
  float dif=max(dot(n,l),0.);
  float sp=pow(max(dot(reflect(-l,n),vec3(0.,0.,1.)),0.),36.);
  vec3 c=mix(vec3(.13,.024,.005),vec3(.92,.42,.05),smoothstep(.25,.8,h));
  c=mix(c,vec3(1.,.8,.4),smoothstep(.62,.9,h)*.6);
  c*=.3+1.1*dif;
  c+=vec3(1.,.93,.8)*sp*1.3;
  return c;
}

/* Letzte Bahn: Stadtlichter hinter nassem Glas */
vec3 s3(vec2 p,float t){
  vec3 c=mix(vec3(.01,.03,.05),vec3(.04,.02,.07),p.y*.5+.5);
  for(float l=0.;l<3.;l++){
    float sc=1.5+l*1.15;
    vec2 q=p*sc+vec2(t*(.1+l*.05),l*7.3);
    vec2 id=floor(q);
    for(float x=-1.;x<=1.;x++)for(float y=-1.;y<=1.;y++){
      vec2 g=id+vec2(x,y),o=h22(g);
      float rn=h21(g+l);
      if(rn<.34) continue;
      float rad=.2+.34*o.y;
      float d=length(q-g-o);
      float disc=smoothstep(rad,rad-.035,d)*(.42+.58*smoothstep(0.,rad,d));
      float tw=.7+.3*sin(t*(1.+o.x*2.)+rn*40.);
      vec3 col=rn<.55?vec3(1.,.2,.45):rn<.74?vec3(.1,.8,.85):rn<.9?vec3(1.,.62,.2):vec3(.82,.88,1.);
      c+=col*disc*tw*(.46-l*.1);
    }
  }
  vec2 r=vec2(p.x*20.,p.y*1.4+t*.9);
  float rain=smoothstep(.975,1.,vn(r))*.5;
  c+=rain*vec3(.7,.8,.95);
  return c;
}

/* Frühschicht: Funkenflug im Stahlwerk */
vec3 s4(vec2 p,float t){
  vec2 src=vec2(.95,.62);
  float g=length(p-src);
  vec3 c=mix(vec3(.018,.02,.026),vec3(.06,.04,.035),smoothstep(-1.,1.,p.y));
  c+=vec3(1.,.42,.08)*exp(-g*2.6)*1.1+vec3(1.,.82,.5)*exp(-g*11.)*2.2;
  float beam=step(.5,fract(p.x*.7+.15))*.0;
  c*=1.-.7*smoothstep(.03,.0,abs(p.y+.62+p.x*.12));
  for(float l=0.;l<4.;l++){
    float sc=3.+l*2.2;
    vec2 q=p-src;
    q.y+=q.x*q.x*.55;
    q=vec2(q.x*.8-q.y*.6,q.x*.6+q.y*.8);
    q*=vec2(sc*.9,sc*.22);
    q.y+=t*(1.5+l*.42);
    q.x+=l*3.1;
    vec2 id=floor(q),f=fract(q)-.5;
    float rn=h21(id+l*9.);
    if(rn<.56) continue;
    f.x+=(h11(rn*91.)-.5)*.7;
    float s=exp(-abs(f.x)*40.)*smoothstep(.46,.0,abs(f.y))*smoothstep(4.2,.3,g);
    c+=mix(vec3(1.,.3,.04),vec3(1.,.9,.6),rn)*s*2.;
  }
  return c;
}

/* Weit draußen: Dünen im Gegenlicht */
vec3 s5(vec2 p,float t){
  float v=p.y*.5+.5;
  vec3 c=mix(vec3(1.,.47,.17),vec3(.26,.08,.28),smoothstep(.34,1.,v));
  c=mix(c,vec3(.04,.04,.15),smoothstep(.75,1.15,v));
  vec2 sun=vec2(-.52,.02);
  float d=length(p-sun);
  c+=vec3(1.,.7,.34)*exp(-d*2.3)*.8;
  c=mix(c,vec3(1.,.95,.8),smoothstep(.2,.185,d));
  for(float i=0.;i<4.;i++){
    float base=.04-i*.24;
    float f=.7+i*.4;
    float y=base+.3*(fbm(vec2(p.x*f+i*5.3+t*(.012+i*.012),i))-.5)*(1.+i*.3);
    vec3 col=mix(vec3(.52,.18,.14),vec3(.025,.018,.04),i/3.);
    float m=smoothstep(.006,-.006,p.y-y);
    float edge=smoothstep(.08,0.,y-p.y)*.2*(1.-i/3.);
    c=mix(c,col+vec3(1.,.5,.2)*edge,m);
  }
  return c;
}

vec3 sceneAt(float id,vec2 p,float t){
  if(id<.5)return s0(p,t);
  if(id<1.5)return s1(p,t);
  if(id<2.5)return s2(p,t);
  if(id<3.5)return s3(p,t);
  if(id<4.5)return s4(p,t);
  return s5(p,t);
}
vec3 grade(vec3 c,vec2 uv,vec2 px,float t){
  c=c/(1.+c*.32);
  vec2 v=uv-.5;
  c*=1.-dot(v,v)*.85;
  c=pow(max(c,0.),vec3(.9));
  c+=(h21(px+fract(t)*91.)-.5)*.045;
  return c;
}`;

  const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

  const FRAG_FILM = GLSL_COMMON + `
uniform vec2 uRes;uniform float uTime,uScene;
void main(){
  vec2 p=(gl_FragCoord.xy*2.-uRes)/min(uRes.y,uRes.x*.8);
  gl_FragColor=vec4(grade(sceneAt(uScene,p,uTime),gl_FragCoord.xy/uRes,gl_FragCoord.xy,uTime),1.);
}`;

  const FRAG_KEY = GLSL_COMMON + `
uniform vec2 uRes,uFocus;uniform float uTime,uScene,uZoom,uFull,uDpr,uLive;
uniform sampler2D uText,uTrail;
float cross_(vec2 p,float s){
  vec2 c=fract(p/s)-.5;c*=s;
  vec2 id=floor(p/s);
  float a=step(abs(c.x),1.)*step(abs(c.y),7.);
  float b=step(abs(c.y),1.)*step(abs(c.x),7.);
  return max(a,b)*step(.5,mod(id.x+id.y,2.));
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  float asp=uRes.x/uRes.y;

  /* Grüne Wand: Studiolicht, Stofffalten, Tracking-Marker */
  float fold=fbm(vec2(uv.x*asp*2.6,uv.y*.7)+3.);
  vec2 v=uv-vec2(.5,.56);
  float lit=1.08-dot(v,v)*.8+(fold-.5)*.2;
  vec3 wall=vec3(0.,.694,.251)*lit;
  float yCss=gl_FragCoord.y/uDpr,hCss=uRes.y/uDpr;
  float markers=cross_(gl_FragCoord.xy/uDpr+vec2(0.,20.),136.)*step(170.,yCss)*step(yCss,hCss-64.);
  wall=mix(wall,vec3(.02,.09,.05),markers*.92);

  /* Maske: Schrift plus Spur des Zeigers */
  vec2 tuv=uFocus+(uv-uFocus)/uZoom;
  float txt=0.;
  if(tuv.x>0.&&tuv.x<1.&&tuv.y>0.&&tuv.y<1.)txt=texture2D(uText,tuv).r;
  float tr=texture2D(uTrail,uv).r;
  float n=fbm(uv*vec2(asp,1.)*7.+uTime*.25)-.5;
  float mt=smoothstep(.42,.58,txt);
  float trv=tr+n*.2*smoothstep(.02,.2,tr);
  float mp=smoothstep(.38,.43,trv);
  float m=max(max(mt,mp),uFull);

  vec3 film=vec3(0.);
  if(m>.001&&uLive<1.){
    vec2 p=(gl_FragCoord.xy*2.-uRes)/min(uRes.y,uRes.x*.8);
    film=grade(sceneAt(uScene,p,uTime),uv,gl_FragCoord.xy,uTime);
  }
  vec3 c=wall*(1.-m)+film*m*(1.-uLive);
  /* Grünsaum am Rand der Spur, wie bei einem knapp gezogenen Key */
  float fringe=smoothstep(.3,.38,trv)*(1.-smoothstep(.39,.44,trv))*(1.-max(mt,uFull));
  c+=vec3(.25,.9,.45)*fringe*.75;
  /* Läuft das Reel, wird die Maske durchsichtig. Leicht abgedunkelt, damit die Schrift lesbar bleibt. */
  float dim=.14*(1.-uFull);
  gl_FragColor=vec4(c,1.-m*uLive*(1.-dim));
}`;

  function makeGL(canvas, frag, names, alpha = false) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha, powerPreference: 'high-performance' });
    if (!gl) return null;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.bindAttribLocation(prog, 0, 'a');
    gl.vertexAttribPointer(gl.getAttribLocation(prog, 'a'), 2, gl.FLOAT, false, 0, 0);
    const u = {};
    names.forEach((n) => { u[n] = gl.getUniformLocation(prog, n); });
    return { gl, u };
  }

  /* Ein unsichtbarer Renderer zeichnet alle Filmkacheln. */
  const filmCanvas = document.createElement('canvas');
  const film = makeGL(filmCanvas, FRAG_FILM, ['uRes', 'uTime', 'uScene']);

  function drawFilm(target, scene, time) {
    if (!film) return;
    const { gl, u } = film;
    const w = target.width, h = target.height;
    if (filmCanvas.width !== w || filmCanvas.height !== h) {
      filmCanvas.width = w; filmCanvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uScene, scene);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    target.getContext('2d').drawImage(filmCanvas, 0, 0);
  }

  /* ---------- 2. Greenscreen ---------- */

  const STRETCH = ['ultra-condensed', 'condensed', 'normal', 'expanded', 'ultra-expanded'];

  function setupHeroReel(onPlaying) {
    const box = $('hero-film');
    const none = { toggle() {} };
    if (reduced) return none;

    /* Eigene Datei (data-file) bevorzugen: Sie braucht keine Verbindung zu YouTube. */
    if (box.dataset.file) {
      const v = document.createElement('video');
      v.src = box.dataset.file;
      v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
      v.addEventListener('playing', onPlaying, { once: true });
      box.append(v);
      return { film: true, toggle(on) { if (on) v.play().catch(() => {}); else v.pause(); } };
    }

    /* Als lokale Datei geöffnet spielt YouTube nichts ab. */
    const id = box.dataset.youtube;
    if (!id || !location.protocol.startsWith('http')) return none;
    const frame = document.createElement('iframe');
    const params = new URLSearchParams({
      autoplay: 1, mute: 1, loop: 1, playlist: id, controls: 0, disablekb: 1, fs: 0,
      playsinline: 1, rel: 0, iv_load_policy: 3, enablejsapi: 1,
      ...(location.protocol.startsWith('http') ? { origin: location.origin } : {}),
    });
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?${params}`;
    frame.title = 'Showreel im Hintergrund';
    frame.allow = 'autoplay; encrypted-media';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.tabIndex = -1;
    box.append(frame);

    const send = (msg) => frame.contentWindow?.postMessage(JSON.stringify(msg), '*');
    let playing = false;
    const hello = setInterval(() => send({ event: 'listening', id: 1, channel: 'widget' }), 500);
    setTimeout(() => clearInterval(hello), 60000);

    /* Handys ignorieren autoplay oft. Deshalb Start ausdrücklich anfordern,
       sobald der Player bereit ist und noch einmal bei der ersten Berührung. */
    const kick = () => {
      if (playing) return;
      send({ event: 'command', func: 'mute', args: [] });
      send({ event: 'command', func: 'playVideo', args: [] });
    };
    const gestures = ['pointerdown', 'touchend', 'scroll'];
    gestures.forEach((name) => addEventListener(name, kick, { passive: true }));

    addEventListener('message', (e) => {
      if (e.source !== frame.contentWindow || typeof e.data !== 'string') return;
      let d;
      try { d = JSON.parse(e.data); } catch { return; }
      if (d.event === 'onReady' || d.event === 'initialDelivery') kick();
      const state = d.event === 'onStateChange' ? d.info : d.info?.playerState;
      if (state === 1 && !playing) {
        playing = true;
        clearInterval(hello);
        gestures.forEach((name) => removeEventListener(name, kick));
        onPlaying();
      }
    });
    /* Das Reel läuft durch, auch außerhalb des Heros: Nach einer Pause blieben YouTubes Buttons dauerhaft stehen. */
    return { film: true, toggle() {} };
  }

  function setupHero() {
    const canvas = $('hero-canvas'), hero = $('hero'), track = $('titel');
    const titleEl = $('hero-title'), foot = $('hero-foot'), reveal = $('hero-reveal');
    const topbar = $('topbar');
    const k = makeGL(canvas, FRAG_KEY, ['uRes', 'uFocus', 'uTime', 'uScene', 'uZoom', 'uFull', 'uDpr', 'uLive', 'uText', 'uTrail'], true);
    const onDark = () => {
      topbar.classList.toggle('on-dark', scrollY > track.offsetTop + track.offsetHeight * 0.14);
      topbar.classList.toggle('gone', scrollY > track.offsetTop + track.offsetHeight - hero.offsetHeight);
    };
    addEventListener('scroll', onDark, { passive: true });
    onDark();
    if (!k) return;
    const { gl, u } = k;
    document.documentElement.classList.add('has-gl');

    const textCv = document.createElement('canvas');
    const trail = document.createElement('canvas');
    const tctx = trail.getContext('2d');
    const texOf = (unit) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const textTex = texOf(0), trailTex = texOf(1);
    gl.uniform1i(u.uText, 0);
    gl.uniform1i(u.uTrail, 1);

    let dpr = 1, focus = [0.5, 0.5];

    function fitLine(ctx, text, x, y, w, h) {
      let best = null;
      for (const s of STRETCH) {
        ctx.font = `900 ${s} 400px Archivo, Impact, sans-serif`;
        const m = ctx.measureText(text);
        const tw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
        const th = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        const ratio = (w / tw) / (h / th);
        const miss = Math.abs(Math.log(ratio));
        if (!best || miss < best.miss) best = { s, m, tw, th, miss };
      }
      ctx.font = `900 ${best.s} 400px Archivo, Impact, sans-serif`;
      const sx = w / best.tw, sy = h / best.th;
      ctx.setTransform(sx, 0, 0, sy, x + best.m.actualBoundingBoxLeft * sx, y + best.m.actualBoundingBoxAscent * sy);
      ctx.fillText(text, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    function layout() {
      const w = hero.clientWidth, h = hero.clientHeight;
      if (!w || !h) return;
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      const maxPx = 2.4e6;
      if (w * h * dpr * dpr > maxPx) dpr = Math.sqrt(maxPx / (w * h));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);

      textCv.width = canvas.width;
      textCv.height = canvas.height;
      const ctx = textCv.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, textCv.width, textCv.height);
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'alphabetic';
      const hr = hero.getBoundingClientRect(), r = titleEl.getBoundingClientRect();
      const gap = r.height * 0.035;
      const lineH = (r.height - gap) / 2;
      const x = (r.left - hr.left) * dpr, y = (r.top - hr.top) * dpr, W = r.width * dpr, H = lineH * dpr;
      fitLine(ctx, 'HARRY', x, y, W, H);
      fitLine(ctx, 'HOLLYWOOD', x, y + (lineH + gap) * dpr, W, H);

      /* Fokuspunkt für den Flug: die vollste Stelle nahe der Mitte des zweiten Worts */
      const fy = Math.round(y + (lineH + gap + lineH * 0.5) * dpr);
      const row = ctx.getImageData(0, fy, textCv.width, 1).data;
      let bestX = textCv.width / 2, bestD = 1e9;
      for (let i = 0; i < textCv.width; i++) {
        if (row[i * 4] > 200) {
          const d = Math.abs(i - textCv.width * 0.5);
          if (d < bestD) { bestD = d; bestX = i; }
        }
      }
      let run = bestX;
      while (run < textCv.width - 1 && row[(run + 1) * 4] > 200) run++;
      focus = [((bestX + run) / 2) / textCv.width, 1 - fy / textCv.height];

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, textCv);

      trail.width = 320;
      trail.height = Math.max(120, Math.round(320 * h / w));
      tctx.fillStyle = '#000';
      tctx.fillRect(0, 0, trail.width, trail.height);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uDpr, dpr);
      gl.uniform2f(u.uFocus, focus[0], focus[1]);
    }

    let px = 0, py = 0, lastMove = -1e9, seen = false;
    const toTrail = (e) => {
      const r = hero.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width * trail.width, (e.clientY - r.top) / r.height * trail.height];
    };
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const [x, y] = toTrail(e);
      if (!seen) { px = x; py = y; seen = true; }
      lastMove = performance.now();
      stamp(px, py, x, y, 0.1);
      px = x; py = y;
    });

    function stamp(x0, y0, x1, y1, size) {
      const rad = trail.width * size;
      const dist = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.min(16, Math.ceil(dist / (rad * 0.4)) + 1);
      tctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
        const g = tctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, 'rgba(255,255,255,.5)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        tctx.fillStyle = g;
        tctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      tctx.globalCompositeOperation = 'source-over';
    }

    let progress = 0, visible = true, raf = 0, wx = 0, wy = 0;
    const readScroll = () => {
      const span = track.offsetHeight - hero.offsetHeight;
      progress = span > 0 ? clamp((scrollY - track.offsetTop) / span) : 0;
      foot.style.opacity = 1 - smooth(0.02, 0.16, progress);
      foot.style.pointerEvents = progress > 0.16 ? 'none' : '';
      reveal.style.opacity = smooth(0.62, 0.78, progress) * (1 - smooth(0.93, 1, progress) * 0.0);
    };
    addEventListener('scroll', readScroll, { passive: true });

    /* Das Showreel liegt hinter dem Canvas und scheint von Anfang an durch die Maske.
       Nur wenn es gar nicht startet, übernehmen die animierten Szenen. */
    let started = false;
    const reel = setupHeroReel(() => { started = true; live = true; });
    let live = Boolean(reel.film), liveMix = live ? 1 : 0;
    if (live) setTimeout(() => { if (!started) live = false; }, 8000);

    new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      reel.toggle(visible);
      if (visible && !raf) raf = requestAnimationFrame(frame);
    }).observe(hero);

    const CUT = 2.6;
    function render(time) {
      const t = time / 1000;
      const index = Math.floor(t / CUT) % 6;
      tctx.fillStyle = 'rgba(0,0,0,.022)';
      tctx.fillRect(0, 0, trail.width, trail.height);
      if (time - lastMove > 2500 && progress < 0.05) {
        const nx = trail.width * (0.5 + 0.42 * Math.sin(t * 0.37 + 1));
        const ny = trail.height * (0.42 + 0.26 * Math.sin(t * 0.53));
        if (wx) stamp(wx, wy, nx, ny, 0.055);
        wx = nx; wy = ny;
      } else wx = 0;

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, trailTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, trail);

      const fly = smooth(0.1, 0.62, progress);
      gl.uniform1f(u.uZoom, Math.exp(fly * fly * Math.log(90)));
      gl.uniform1f(u.uFull, smooth(0.54, 0.62, progress));
      liveMix = live ? Math.min(1, liveMix + 0.03) : Math.max(0, liveMix - 0.03);
      gl.uniform1f(u.uLive, liveMix);
      gl.uniform1f(u.uTime, t);
      gl.uniform1f(u.uScene, index);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function frame(time) {
      raf = 0;
      if (!visible || document.hidden) return;
      render(time);
      raf = requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && visible && !raf) raf = requestAnimationFrame(frame);
    });

    const start = () => {
      layout();
      readScroll();
      if (reduced) { render(3600); return; }
      raf = requestAnimationFrame(frame);
    };
    let rt = 0;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { layout(); if (reduced) render(3600); }, 120);
    });
    Promise.race([
      document.fonts.load('900 400px Archivo'),
      new Promise((r) => setTimeout(r, 1500)),
    ]).then(start, start);
  }

  /* ---------- 3. Reel ---------- */

  function setupReel() {
    const tiles = [...document.querySelectorAll('.tile')];
    const size = (tile) => {
      const c = tile.querySelector('canvas');
      const r = tile.getBoundingClientRect();
      const s = Math.min(1, 760 / Math.max(r.width, 1));
      c.width = Math.max(2, Math.round(r.width * s));
      c.height = Math.max(2, Math.round(r.height * s));
    };
    const still = (tile) => {
      size(tile);
      drawFilm(tile.querySelector('canvas'), +tile.dataset.scene, 11.3 + +tile.dataset.scene * 3.7);
    };

    tiles.forEach((tile) => {
      /* Vorschaubild: eigenes Bild, sonst das YouTube-Thumbnail. Lädt keins, bleibt die Animation sichtbar. */
      const thumb = (size) => `https://i.ytimg.com/vi/${tile.dataset.youtube}/${size}.jpg`;
      const img = new Image();
      img.alt = '';
      img.loading = 'lazy';
      img.onerror = () => {
        if (!tile.dataset.poster && !img.src.includes('hqdefault')) img.src = thumb('hqdefault');
        else img.remove();
      };
      img.src = tile.dataset.poster || thumb('maxresdefault');
      tile.querySelector('canvas').after(img);

      let raf = 0;
      const canvas = tile.querySelector('canvas');
      const play = () => {
        if (reduced || !film || tile.querySelector('img')) return;
        const scene = +tile.dataset.scene;
        const t0 = performance.now();
        const loop = (now) => {
          drawFilm(canvas, scene, 11.3 + scene * 3.7 + (now - t0) / 1000);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      };
      tile.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') play(); });
      tile.addEventListener('pointerleave', () => cancelAnimationFrame(raf));
      tile.addEventListener('click', () => { cancelAnimationFrame(raf); openScreen(tile); });
    });

    /* Musikvideos: zuerst die neuesten zwölf, der Rest auf Knopfdruck. */
    const music = $('reel-music'), more = $('reel-more'), moreLabel = more.textContent;
    music.classList.add('is-short');
    more.hidden = false;
    more.addEventListener('click', () => {
      const short = music.classList.toggle('is-short');
      more.textContent = short ? moreLabel : 'Weniger anzeigen';
      more.setAttribute('aria-expanded', String(!short));
      if (short) music.previousElementSibling.scrollIntoView();
      dispatchEvent(new Event('resize'));
    });

    const stillAll = () => tiles.forEach(still);
    stillAll();
    let rt = 0;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(stillAll, 160); });

    /* Vorführraum: Das YouTube-Video lädt erst hier, nach dem Klick. */
    const dlg = $('screen'), frameBox = $('screen-frame');
    let stopWaiting = () => {};
    function openScreen(tile) {
      const id = tile.dataset.youtube;
      /* Als lokale Datei geöffnet verweigert YouTube die Einbettung, dann direkt zu YouTube. */
      if (!location.protocol.startsWith('http')) {
        window.open(`https://www.youtube.com/watch?v=${id}`, '_blank', 'noopener');
        return;
      }
      $('screen-title').textContent = tile.dataset.title;
      $('screen-meta').textContent = tile.dataset.meta;
      $('screen-link').href = `https://www.youtube.com/watch?v=${id}`;
      const frame = document.createElement('iframe');
      const params = new URLSearchParams({ autoplay: 1, rel: 0, playsinline: 1, enablejsapi: 1, origin: location.origin });
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?${params}`;
      frame.title = tile.dataset.title;
      frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      frame.allowFullscreen = true;

      /* Bis YouTube bereit ist, stehen Vorschaubild und Ladeanzeige im Fenster. */
      const poster = new Image();
      poster.className = 'screen-poster';
      poster.alt = '';
      poster.onerror = () => poster.remove();
      poster.src = tile.querySelector('img')?.src || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
      const loading = document.createElement('p');
      loading.className = 'screen-load';
      loading.setAttribute('role', 'status');
      loading.textContent = 'Film lädt';
      frameBox.replaceChildren(poster, loading, frame);
      dlg.showModal();

      const onMessage = (e) => {
        if (e.source !== frame.contentWindow || typeof e.data !== 'string') return;
        let d;
        try { d = JSON.parse(e.data); } catch { return; }
        if ((d.event === 'onStateChange' ? d.info : d.info?.playerState) === 1) reveal();
      };
      const hello = setInterval(() => frame.contentWindow?.postMessage('{"event":"listening","id":2,"channel":"widget"}', '*'), 250);
      const limit = setTimeout(() => reveal(), 6000);
      stopWaiting = () => {
        clearInterval(hello);
        clearTimeout(limit);
        removeEventListener('message', onMessage);
      };
      const reveal = () => {
        stopWaiting();
        loading.remove();
        frame.classList.add('is-ready');
        setTimeout(() => poster.remove(), 300);
      };
      addEventListener('message', onMessage);
    }
    $('hero-play').addEventListener('click', (e) => { e.preventDefault(); openScreen(e.currentTarget); });
    dlg.addEventListener('close', () => { stopWaiting(); frameBox.replaceChildren(); });
    $('screen-close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  /* ---------- 4. Timeline ---------- */

  function setupTimeline() {
    const FPS = 25, LENGTH = 30, START = 10 * 3600 * FPS;  /* Sendeband-Konvention: Bild beginnt bei 10:00:00:00 */
    const secs = [...document.querySelectorAll('[data-clip]')];
    const v = $('tl-v'), head = $('tl-head'), tc = $('tl-tc'), name = $('tl-name'), tracks = $('tl-tracks');
    const wave = $('tl-a');
    const links = secs.map((s) => {
      const a = document.createElement('a');
      a.href = `#${s.id}`;
      a.textContent = s.dataset.clip;
      a.setAttribute('aria-label', s.dataset.clip);
      v.append(a);
      return a;
    });

    /* Handy: Abschnittsliste mit Namen, die Clips wären zum Tippen zu schmal. */
    const menu = $('tl-menu'), list = $('tl-list');
    const entries = secs.map((s) => {
      const a = document.createElement('a');
      a.href = `#${s.id}`;
      const label = document.createElement('span');
      label.textContent = s.dataset.clip;
      const time = document.createElement('span');
      time.className = 'tl-list-tc';
      a.append(label, time);
      list.append(a);
      return a;
    });
    const showList = (open) => {
      list.hidden = !open;
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Abschnitte schließen' : 'Abschnitte anzeigen');
    };
    menu.addEventListener('click', () => showList(list.hidden));
    list.addEventListener('click', (e) => { if (e.target.closest('a')) showList(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') showList(false); });
    addEventListener('pointerdown', (e) => {
      if (!list.hidden && !e.target.closest('#tl')) showList(false);
    });

    /* starts: Clip-Anfang auf der Timeline (0 bis 1), stops: dazugehörige Scroll-Position. */
    let starts = [], stops = [], maxScroll = 1;
    const pad = (n) => String(n).padStart(2, '0');

    /* Clips sind so breit wie ihre Abschnitte lang. Die Abbildung läuft stückweise,
       damit der Abspielkopf am Seitenende genau am Ende des letzten Clips steht. */
    const map = (value, from, to, fromEnd) => {
      let i = 0;
      from.forEach((v, n) => { if (value >= v) i = n; });
      const a = from[i], b = i + 1 < from.length ? from[i + 1] : fromEnd;
      const c = to[i], d = i + 1 < to.length ? to[i + 1] : (fromEnd === 1 ? maxScroll : 1);
      return b > a ? c + (d - c) * clamp((value - a) / (b - a)) : d;
    };
    const toTimeline = (y) => map(y, stops, starts, maxScroll);
    const toScroll = (p) => map(p, starts, stops, 1);
    const timecode = (p) => {
      const f = START + Math.round(p * LENGTH * FPS);
      const ss = Math.floor(f / FPS);
      return `${pad(Math.floor(ss / 3600))}:${pad(Math.floor(ss / 60) % 60)}:${pad(ss % 60)}:${pad(f % FPS)}`;
    };

    function drawWave() {
      const r = wave.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      wave.width = Math.round(r.width * d);
      wave.height = Math.round(r.height * d);
      const c = wave.getContext('2d');
      c.fillStyle = '#93A699';
      const n = Math.floor(r.width / 3);
      for (let i = 0; i < n; i++) {
        const x = i * 3 * d;
        const env = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.031) * Math.sin(i * 0.0071 + 1));
        const a = (0.2 + 0.8 * Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1)) * env;
        const h = Math.max(1, a * wave.height);
        c.fillRect(x, (wave.height - h) / 2, 1.5 * d, h);
      }
    }

    function measure() {
      const total = document.documentElement.scrollHeight;
      maxScroll = Math.max(1, total - innerHeight);
      const tops = secs.map((s) => s.getBoundingClientRect().top + scrollY);
      starts = tops.map((t) => clamp(t / total));
      stops = tops.map((t) => Math.min(t, maxScroll));
      links.forEach((a, i) => {
        const end = i + 1 < starts.length ? starts[i + 1] : 1;
        a.style.left = `${starts[i] * 100}%`;
        a.style.width = `${Math.max(0, end - starts[i]) * 100}%`;
        entries[i].lastChild.textContent = timecode(starts[i]);
      });
      drawWave();
      update();
    }

    let last = -1;
    function update() {
      if (!starts.length) return;
      const p = clamp(toTimeline(scrollY));
      head.style.left = `${p * 100}%`;
      tc.textContent = timecode(p);
      let cur = 0;
      starts.forEach((s, i) => { if (p + 0.002 >= s) cur = i; });
      if (cur !== last) {
        last = cur;
        [links, entries].forEach((group) => group.forEach((a, i) => a.setAttribute('aria-current', i === cur ? 'true' : 'false')));
        name.textContent = secs[cur].dataset.clip;
      }
    }

    /* Ziehen auf der Timeline scrubbt durch die Seite. */
    let scrubbing = false;
    const scrub = (e) => {
      const r = tracks.getBoundingClientRect();
      scrollTo({ top: toScroll(clamp((e.clientX - r.left) / r.width)), behavior: 'instant' });
    };
    tracks.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      scrubbing = false;
      const startX = e.clientX;
      const move = (m) => {
        if (Math.abs(m.clientX - startX) > 4) scrubbing = true;
        if (scrubbing) scrub(m);
      };
      const up = () => {
        removeEventListener('pointermove', move);
        removeEventListener('pointerup', up);
      };
      addEventListener('pointermove', move);
      addEventListener('pointerup', up);
    });
    tracks.addEventListener('dragstart', (e) => e.preventDefault());
    tracks.addEventListener('click', (e) => { if (scrubbing) e.preventDefault(); });

    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', measure);
    addEventListener('load', measure);
    document.fonts.ready.then(measure);
    measure();
  }

  /* ---------- 5. Formular ---------- */

  function setupForm() {
    const form = $('form'), status = $('form-status');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = form.dataset.endpoint;
      if (!url) {
        const d = new FormData(form);
        const subject = `Anfrage: ${d.get('art')}`;
        const body = `${d.get('nachricht')}\n\n${d.get('name')}\n${d.get('email')}`;
        location.href = `mailto:${form.dataset.mail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        status.textContent = `Ihr E-Mail-Programm öffnet sich mit der fertigen Anfrage. Falls nicht, schreiben Sie an ${form.dataset.mail}.`;
        return;
      }
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      status.textContent = 'Anfrage wird gesendet.';
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.textContent = 'Danke. Ihre Anfrage ist bei Harry.';
      } catch {
        status.textContent = `Das hat nicht geklappt. Bitte schreiben Sie an ${form.dataset.mail}.`;
      }
      window.turnstile?.reset();
      button.disabled = false;
    });
  }

  $('year').textContent = new Date().getFullYear();
  setupHero();
  setupReel();
  setupTimeline();
  setupForm();
})();
