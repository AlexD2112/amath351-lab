// Student lab: the Solow growth model, k' = s k^a - lam k, with lam = n + delta.
// It is a Bernoulli equation: v = k^{1-a} turns it into the linear equation
// v' = (1-a)(s - lam v), solved exactly with an integrating factor.
(function(root){
  const output=(k,a)=>Math.pow(k,a);                    // y = f(k) = k^a, per worker
  const investment=(k,s,a)=>s*Math.pow(k,a);
  const breakEven=(k,lam)=>lam*k;                       // keeps k constant as workers are added and capital wears out
  const rate=(k,s,a,lam)=>s*Math.pow(k,a)-lam*k;
  const consumption=(k,s,a)=>(1-s)*Math.pow(k,a);

  const steady=(s,a,lam)=>Math.pow(s/lam,1/(1-a));
  // Linearizing at k*: d/dk (s k^a - lam k) = a lam - lam = -(1 - a) lam, the same rate the
  // Bernoulli solution decays at, so the gap to k* (in k^{1-a}) halves every ln 2/((1-a) lam).
  const convergenceRate=(a,lam)=>(1-a)*lam;
  const halfLife=(a,lam)=>Math.LN2/convergenceRate(a,lam);

  // Steady-state consumption as a function of the saving rate; the golden rule maximizes it at s = a.
  const steadyConsumption=(s,a,lam)=>(1-s)*Math.pow(s/lam,a/(1-a));
  const goldenRule=a=>a;

  function solution(k0,t,s,a,lam){
    const b=1-a,v0=Math.pow(k0,b);
    const v=lam>0?s/lam+(v0-s/lam)*Math.exp(-b*lam*t):v0+b*s*t;
    return Math.pow(v,1/b);
  }

  // The saving rate changes from s1 to s2 at time tShock; the solution restarts from k(tShock).
  function shockPath(k0,t,s1,s2,tShock,a,lam){
    if(t<=tShock)return solution(k0,t,s1,a,lam);
    return solution(solution(k0,tShock,s1,a,lam),t-tShock,s2,a,lam);
  }

  // Consumption per worker along the same path, c(t) = (1 - s(t)) k(t)^a. k is continuous at
  // tShock but the saving rate is not, so c jumps by the factor (1 - s2)/(1 - s1) there.
  function consumptionPath(k0,t,s1,s2,tShock,a,lam){
    const s=t>tShock?s2:s1;
    return consumption(shockPath(k0,t,s1,s2,tShock,a,lam),s,a);
  }

  // Growth rate of output per worker: y'/y = a k'/k.
  const outputGrowth=(k,s,a,lam)=>a*rate(k,s,a,lam)/k;

  // Euler's method (Section 2.4) with step h up to time T. Stops if k would leave k > 0.
  function euler(k0,h,T,s,a,lam){
    const pts=[[0,k0]];let k=k0,t=0;
    const n=Math.round(T/h);
    for(let i=1;i<=n;i++){
      k=k+h*rate(k,s,a,lam);t=i*h;
      if(!(k>0))break;
      pts.push([t,k]);
    }
    return pts;
  }
  // Near k*, Euler multiplies the gap by 1 - h(1 - a)lam each step: it oscillates once that
  // factor is negative and diverges once it is below -1.
  const eulerFactor=(h,a,lam)=>1-h*convergenceRate(a,lam);

  const api=Object.freeze({output,investment,breakEven,rate,consumption,steady,convergenceRate,halfLife,steadyConsumption,goldenRule,solution,shockPath,consumptionPath,outputGrowth,euler,eulerFactor});
  if(typeof module==='object'&&module.exports)module.exports=api;else root.Amath351Solow=api;
})(globalThis);
