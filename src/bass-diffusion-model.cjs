// Student lab: Bass diffusion, F' = (p + qF)(1 - F), with F the adopted share of the market.
// Separating variables with partial fractions gives R(F) = (p + qF)/(1 - F) = R(F0) e^{(p+q)t},
// so every quantity below is exact; no numerical ODE solver is used.
(function(root){
  const rate=(F,p,q)=>(p+q*F)*(1-F);
  const innovators=(F,p)=>p*(1-F);   // adopt from advertising, independent of F
  const imitators=(F,q)=>q*F*(1-F);  // adopt after meeting someone who already adopted

  // R is increasing on [0, 1) whenever p + q > 0, so it can be inverted: F = 1 - (p+q)/(R+q).
  // This form stays finite as R overflows to Infinity (F -> 1).
  const ratio=(F,p,q)=>(p+q*F)/(1-F);
  const fromRatio=(R,p,q)=>1-(p+q)/(R+q);

  function solution(F0,t,p,q){
    if(F0>=1)return 1;
    if(p+q<=0)return F0;              // nobody is ever persuaded
    if(p===0&&F0===0)return 0;        // pure word of mouth needs a first adopter
    return fromRatio(ratio(F0,p,q)*Math.exp((p+q)*t),p,q);
  }

  // Time at which the solution from F0 reaches the share F (Infinity if it never does).
  function timeTo(F0,F,p,q){
    if(F<=F0)return 0;
    if(F>=1||p+q<=0||(p===0&&F0===0))return Infinity;
    return Math.log(ratio(F,p,q)/ratio(F0,p,q))/(p+q);
  }

  // The adoption rate is a downward parabola in F with its vertex at F* = (q - p)/(2q).
  // If q <= p the vertex is at F <= 0, so sales are largest at launch.
  const peakShare=(p,q)=>q>p?(q-p)/(2*q):0;
  function peak(F0,p,q){
    const F=Math.max(F0,peakShare(p,q));
    return {F,t:timeTo(F0,F,p,q),rate:rate(F,p,q)};
  }

  // Equilibria of F' = 0: F = 1 (stable) and F = -p/q (unstable, outside the market when p > 0).
  const equilibria=(p,q)=>q>0?[-p/q,1]:[1];

  // Fraction of the eventual new adopters (1 - F0) who joined through innovation.
  // Integral of p(1-F) dt = integral of p/(p+qF) dF from F0 to 1 = (p/q) ln((p+q)/(p+qF0)).
  function innovatorShare(F0,p,q){
    if(F0>=1||p+q<=0)return NaN;
    if(p===0)return 0;
    if(q===0)return 1;
    return p/q*Math.log((p+q)/(p+q*F0))/(1-F0);
  }

  const api=Object.freeze({rate,innovators,imitators,ratio,fromRatio,solution,timeTo,peakShare,peak,equilibria,innovatorShare});
  if(typeof module==='object'&&module.exports)module.exports=api;else root.Amath351BassDiffusion=api;
})(globalThis);
