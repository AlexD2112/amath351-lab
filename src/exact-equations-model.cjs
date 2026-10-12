// Section 1.6: (x + atan y) dx + (x+y)/(1+y^2) dy = 0.
(function(root){
  const M=(x,y)=>x+Math.atan(y);
  const N=(x,y)=>(x+y)/(1+y*y);
  const terms=(x,y)=>[x*x/2,x*Math.atan(y),Math.log1p(y*y)/2];
  const potential=(x,y)=>terms(x,y).reduce((a,b)=>a+b,0);
  const slope=(x,y)=>Math.abs(N(x,y))<1e-10?null:-M(x,y)/N(x,y);
  function bisectIncreasing(fn,target,lo,hi){
    for(let i=0;i<64;i++){const mid=(lo+hi)/2;if(fn(mid)<target)lo=mid;else hi=mid;}
    return (lo+hi)/2;
  }
  function bounds(c){
    if(!Number.isFinite(c)||c<.1||c>1)throw new RangeError('Choose 0.1 <= C <= 1.');
    // F(x,.) has its minimum at y=-x. These are the vertical tangencies.
    const a=bisectIncreasing(x=>potential(x,-x),c,0,3);
    // Completing the square in x gives the largest |y| on the contour.
    const ymax=bisectIncreasing(y=>(Math.log1p(y*y)-Math.atan(y)**2)/2,c,0,9);
    return {a,ymax};
  }
  function ordinate(x,c,branch,b=bounds(c)){
    if(!Number.isFinite(x)||Math.abs(x)>b.a+1e-12)return null;
    if(Math.abs(Math.abs(x)-b.a)<1e-12)return -x;
    const center=-x;
    // On the upper arc F increases with y; on the lower arc it increases
    // with distance below -x. Solve F=C rather than accumulating ODE drift.
    if(branch==='lower')return center-bisectIncreasing(d=>potential(x,center-d),c,0,center+b.ymax);
    return bisectIncreasing(y=>potential(x,y),c,center,b.ymax);
  }
  function point(c,branch,progress,b=bounds(c)){
    const t=Math.max(0,Math.min(1,progress));
    const x=-b.a*Math.cos(Math.PI*t),y=ordinate(x,c,branch,b);
    return {x,y,endpoint:Math.abs(Math.abs(x)-b.a)<1e-12};
  }
  function curve(c,branch,count=301){
    const b=bounds(c);
    return Array.from({length:count},(_,i)=>point(c,branch,i/(count-1),b));
  }
  const fresh=()=>({level:.5,branch:'upper',progress:.5,field:true,contours:true});
  function restore(raw){
    const s=fresh();if(raw?.version!==1)return s;
    if(Number.isFinite(raw.level))s.level=Math.round(Math.max(.1,Math.min(1,raw.level))*20)/20;
    if(raw.branch==='upper'||raw.branch==='lower')s.branch=raw.branch;
    if(Number.isFinite(raw.progress))s.progress=Math.max(0,Math.min(1,raw.progress));
    for(const k of ['field','contours'])if(typeof raw[k]==='boolean')s[k]=raw[k];
    return s;
  }
  const api=Object.freeze({M,N,terms,potential,slope,bounds,ordinate,point,curve,fresh,restore});
  if(typeof module==='object'&&module.exports)module.exports=api;else root.Amath351Exact=api;
})(globalThis);
