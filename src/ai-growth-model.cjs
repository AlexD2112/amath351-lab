// Section 2.1: A' = A k(A). These are hypothetical autonomous models.
(function(root){
  const modes=['exponential','logistic','threshold','compare'];
  const limits={a0:[.01,16],r:[.1,1.5],K:[1,12],alpha:[.1,1.2],delta:[0,1.2],progress:[0,1]};
  const fresh=()=>({mode:'exponential',a0:1,r:.5,K:6,alpha:.25,delta:.5,window:8,progress:0,revealed:false,field:true});
  function restore(raw){
    const s=fresh();if(!raw||raw.version!==1)return s;
    if(modes.includes(raw.mode))s.mode=raw.mode;
    for(const [k,[lo,hi]] of Object.entries(limits))if(Number.isFinite(raw[k]))s[k]=Math.max(lo,Math.min(hi,raw[k]));
    if([4,8,16].includes(raw.window))s.window=raw.window;
    for(const k of ['revealed','field'])if(typeof raw[k]==='boolean')s[k]=raw[k];
    return s;
  }
  function configurations(s){
    if(s.mode!=='compare')return [{...s}];
    // All share A(0)=a0 and k(a0)=r. Limits and thresholds scale with a0.
    return [
      {...s,mode:'exponential'},
      {...s,mode:'logistic',K:5*s.a0,r:1.25*s.r},
      {...s,mode:'threshold',alpha:2*s.r/s.a0,delta:s.r}
    ];
  }
  function relative(c,a){
    if(c.mode==='exponential')return c.r;
    if(c.mode==='logistic')return c.r*(1-a/c.K);
    if(c.mode==='threshold')return c.alpha*a-c.delta;
    throw new RangeError('Choose one of the three growth laws.');
  }
  const slope=(c,a)=>a*relative(c,a);
  const level=c=>c.mode==='logistic'?c.K:c.mode==='threshold'?c.delta/c.alpha:null;
  function critical(c){
    return c.mode==='threshold'&&Math.abs(c.alpha*c.a0-c.delta)<=16*Number.EPSILON*Math.max(c.alpha*c.a0,c.delta);
  }
  function blowup(c){
    if(c.mode!=='threshold'||c.a0===0||critical(c))return Infinity;
    const excess=c.alpha*c.a0-c.delta;
    if(excess<=0)return Infinity;
    return c.delta===0?1/(c.alpha*c.a0):Math.log1p(c.delta/excess)/c.delta;
  }
  function value(c,t){
    if(!Number.isFinite(t)||t<0)return null;
    if(c.a0===0)return 0;
    if(c.mode==='exponential')return c.a0*Math.exp(c.r*t);
    if(c.mode==='logistic')return c.K/(1+(c.K/c.a0-1)*Math.exp(-c.r*t));
    if(t>=blowup(c))return null;
    if(critical(c))return c.a0;
    if(c.delta===0)return c.a0/(1-c.alpha*c.a0*t);
    const denominator=1+c.alpha*c.a0/c.delta*Math.expm1(-c.delta*t);
    return denominator>0?c.a0*Math.exp(-c.delta*t)/denominator:null;
  }
  function outcome(c){
    if(c.a0===0)return {kind:'zero',text:'The zero equilibrium stays at zero.'};
    if(c.mode==='exponential')return {kind:'unbounded',text:'Unbounded growth as time tends to infinity. No finite-time blow-up.'};
    if(c.mode==='logistic')return {kind:c.a0===c.K?'equilibrium':'saturation',text:c.a0===c.K?'Exactly at the stable equilibrium K.':'Capacity approaches the stable level K as time tends to infinity.'};
    if(critical(c))return {kind:'equilibrium',text:'Exactly at the unstable threshold A_c. A small change to the initial value changes the outcome.'};
    if(c.alpha*c.a0<c.delta)return {kind:'decay',text:'Effective research capacity tends to zero over infinite time. Previously learned knowledge need not disappear.'};
    return {kind:'blowup',text:'This idealized model grows without bound in finite time. The solution ends at T*.'};
  }
  function playEnd(s){return s.mode==='compare'?s.window:Math.min(s.window,blowup(s)*(1-1e-4));}
  const time=s=>s.progress*playEnd(s);
  function curve(c,horizon,count=401){
    const end=Math.min(horizon,blowup(c)*(1-1e-6));
    return Array.from({length:count},(_,i)=>{const t=end*i/(count-1);return {t,a:value(c,t)};});
  }
  function bounds(s){
    if(s.mode==='compare')return 6*s.a0;
    return Math.max(4,Math.ceil(1.3*Math.max(s.a0,level(s)||0)));
  }
  const api={fresh,restore,configurations,relative,slope,level,critical,blowup,value,outcome,playEnd,time,curve,bounds};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.Amath351Growth=api;
})(typeof globalThis!=='undefined'?globalThis:this);
