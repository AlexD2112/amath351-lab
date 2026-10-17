// Student lab: Michaelis–Menten kinetics, [S]' = -Vmax [S] / (K_M + [S]).
// The reduced model is solved exactly; the full mass-action model (k1 = 1)
// has no closed form and is integrated with fixed-step RK4.
(function(root){
  const rate=(s,vmax,km)=>vmax*s/(km+s);

  // Solve u + ln u = L for u > 0 (u = W(e^L)) by Newton's method on e^v + v = L.
  // f(v) = e^v + v - L is increasing and convex, so Newton converges from any start.
  function solveU(L){
    let v=L>1?Math.log(L):L;
    for(let i=0;i<60;i++){
      const e=Math.exp(v),next=v-(e+v-L)/(e+1);
      if(Math.abs(next-v)<=1e-15*Math.max(1,Math.abs(v)))return Math.exp(next);
      v=next;
    }
    return Math.exp(v);
  }
  // Exact solution of K_M ln(s/s0) + (s - s0) = -Vmax t.
  const solution=(s0,t,vmax,km)=>km*solveU(Math.log(s0/km)+s0/km-vmax*t/km);

  // Full model E + S <-> C -> E + P with k1 = 1. State (s, c); free enzyme is e0 - c.
  // Vmax = kc e0 and K_M = kr + kc fix kc = Vmax/e0 and kr = K_M - kc, so e0 >= Vmax/K_M.
  const minEnzyme=(vmax,km)=>vmax/km;
  const fullRates=(vmax,km,e0)=>{const kc=vmax/e0;return {kc,kr:Math.max(0,km-kc)};};
  const fullRhs=(e0,kr,kc,s,c)=>[-(e0-c)*s+kr*c,(e0-c)*s-(kr+kc)*c];
  function rk4(e0,kr,kc,s,c,h){
    const a=fullRhs(e0,kr,kc,s,c),
          b=fullRhs(e0,kr,kc,s+h/2*a[0],c+h/2*a[1]),
          d=fullRhs(e0,kr,kc,s+h/2*b[0],c+h/2*b[1]),
          f=fullRhs(e0,kr,kc,s+h*d[0],c+h*d[1]);
    return [s+h/6*(a[0]+2*b[0]+2*d[0]+f[0]),c+h/6*(a[1]+2*b[1]+2*d[1]+f[1])];
  }
  // The fastest rate is about e0 + s0 + kr + kc; h times it stays well inside RK4 stability.
  const stepFor=(e0,kr,kc,s0)=>Math.min(.02,.25/(e0+s0+kr+kc));
  function simulateFull(e0,kr,kc,s0,tMax,nOut){
    const per=Math.max(1,Math.ceil(tMax/nOut/stepFor(e0,kr,kc,s0))),h=tMax/nOut/per;
    const S=[s0],C=[0];let s=s0,c=0;
    for(let i=0;i<nOut;i++){
      for(let j=0;j<per;j++)[s,c]=rk4(e0,kr,kc,s,c,h);
      S.push(s);C.push(c);
    }
    return {S,C};
  }
  // "Measured" initial velocity of the full model: the peak product-formation rate
  // P' = kc [C](t), reached once the fast binding burst is over.
  function peakRate(e0,kr,kc,s0){
    const h=stepFor(e0,kr,kc,s0),n=Math.ceil(30/h);let s=s0,c=0,best=0;
    for(let i=0;i<n;i++){
      [s,c]=rk4(e0,kr,kc,s,c,h);
      if(c>best)best=c;else if(c<.9*best)break; // clearly past the peak
    }
    return kc*best;
  }
  // Largest gap between the full and reduced [S](t), relative to s0, on the output grid.
  function maxRelativeGap(sim,s0,vmax,km,tMax){
    const n=sim.S.length-1;let gap=0;
    for(let k=0;k<=n;k++)gap=Math.max(gap,Math.abs(sim.S[k]-solution(s0,tMax*k/n,vmax,km))/s0);
    return gap;
  }
  const api=Object.freeze({rate,solveU,solution,minEnzyme,fullRates,fullRhs,simulateFull,peakRate,maxRelativeGap});
  if(typeof module==='object'&&module.exports)module.exports=api;else root.Amath351MichaelisMenten=api;
})(globalThis);
