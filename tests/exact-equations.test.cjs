const test=require('node:test');const assert=require('node:assert/strict');
const m=require('../src/exact-equations-model.cjs');
const close=(a,b,tol=1e-7)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const derivative=(f,x,h=1e-5)=>(f(x+h)-f(x-h))/(2*h);

test('potential derivatives recover both coefficients and the exactness test',()=>{
  for(const x of [-2,-.5,0,1,2])for(const y of [-7,-1,0,.5,4,7]){
    close(derivative(t=>m.potential(t,y),x),m.M(x,y));
    close(derivative(t=>m.potential(x,t),y),m.N(x,y));
    close(derivative(t=>m.M(x,t),y),derivative(t=>m.N(t,y),x));
    close(derivative(t=>m.M(x,t),y),1/(1+y*y));
  }
});

test('both branches stay on their selected contour and solve the ODE on the open interval',()=>{
  for(const c of [.1,.15,.3,.5,.65,.85,1]){
    const b=m.bounds(c);assert(b.a>0&&b.a<2.7&&b.ymax<8.2);
    for(const branch of ['upper','lower']){
      const points=m.curve(c,branch,151);
      for(const p of points){
        close(m.potential(p.x,p.y),c,1e-12);
        assert(Math.abs(p.y)<=b.ymax+1e-12);
        if(!p.endpoint){
          assert(branch==='upper'?m.N(p.x,p.y)>0:m.N(p.x,p.y)<0);
          close(m.M(p.x,p.y)+m.N(p.x,p.y)*m.slope(p.x,p.y),0,1e-12);
        }
      }
      for(const q of [-.9,-.5,0,.5,.9]){
        const x=q*b.a,y=m.ordinate(x,c,branch,b);
        close(derivative(t=>m.ordinate(t,c,branch,b),x),m.slope(x,y),1e-6);
      }
      assert(points.every((p,i)=>i===0||p.x>points[i-1].x));
    }
  }
});

test('the common endpoints are vertical tangencies, excluded from y(x), not equilibrium solutions',()=>{
  for(const c of [.1,.5,1])for(const branch of ['upper','lower'])for(const t of [0,1]){
    const p=m.point(c,branch,t);assert(p.endpoint);
    close(p.y,-p.x,1e-12);close(m.potential(p.x,p.y),c,1e-12);
    close(m.N(p.x,p.y),0,1e-12);assert(Math.abs(m.M(p.x,p.y))>.1);
    assert.equal(m.slope(p.x,p.y),null);
  }
  assert.equal(m.slope(0,0),null);
  assert.equal(m.ordinate(3,.5,'upper'),null);
});

test('constant levels differ and state restoration preserves valid curve selections',()=>{
  const p=m.point(.3,'upper',.5),q=m.point(.7,'upper',.5);
  assert(q.y>p.y);close(m.potential(p.x,p.y),.3);close(m.potential(q.x,q.y),.7);
  assert.deepEqual(m.restore(null),m.fresh());
  assert.deepEqual(m.restore({version:1,level:99,progress:-7,branch:'bad',field:false,contours:true}),{level:1,progress:0,branch:'upper',field:false,contours:true});
  assert.deepEqual(m.restore({version:1,level:NaN,progress:Infinity,branch:'upper'}),m.fresh());
  assert.throws(()=>m.bounds(0),RangeError);assert.throws(()=>m.bounds(NaN),RangeError);
});
