# AMATH 351 Lab

Interactive experiments accompanying AMATH 351, Autumn 2026, at the University
of Washington.

**Live demo:** https://shzhang3.github.io/amath351-lab/

**Repository:** https://github.com/shzhang3/amath351-lab

## Navigation

The site follows **chapter index → chapter's examples → individual experiment**.

1. [First-order equations](https://shzhang3.github.io/amath351-lab/chapters/first-order/)
2. [Higher-order linear equations](https://shzhang3.github.io/amath351-lab/chapters/higher-order/)
3. [Linear systems](https://shzhang3.github.io/amath351-lab/chapters/linear-systems/)

Chapter 1 currently includes the fluid-motion opening, direction fields,
position/velocity/acceleration, Planet Gzyx, the tangent-to-slope-field exploration,
and separable equations.
The other examples are explicitly labeled as planned and
have no inactive or broken experiment links. Chapter groupings follow the
Autumn 2026 syllabus, rather than the textbook's chapter numbering.

Each available experiment has its own URL, breadcrumbs, and previous/next
navigation. The personal homepage still links to the lab's root chapter index.
Old root-page fragment links to the direction field or opening sequence redirect
to their new pages.

## Lecture 01: From fluids to differential equations

A short opening sequence connects a current research question to the ODEs in
this course. Allow about 5–8 minutes before the direction-field experiment.

1. Follow the links to OpenAI's September 8, 2026 announcement and Figure 1 in
   its paper. The reported NS construction uses smooth external forcing and
   develops unbounded velocity while kinetic energy remains bounded.
2. **Track a particle:** predict its motion, change its starting radius or
   height, turn rotation off, and scrub time. The original 3D illustration uses
   the prescribed local field `u = (-a*x - omega*y, omega*x - a*y, 2*a*z)` with
   `a = 0.24`. Its exact trajectories contract radially, rotate, and stretch
   axially. Its divergence is zero. This teaching field has no finite-time
   singularity; it is not the NS solution constructed in the paper.
3. **Can a solution end?** Explore `y' = y^2`, `y(0) = 1`, and compare it with
   `y' = y`. The exact solution `1/(1-t)` is evaluated only before `t = 1`.
   Values above the fixed plot height remain visible in a numeric readout.
   This scalar example explains finite-time blowup; it is not a reduction of NS.
4. Continue to **Follow the slope** using the next-example link. Return to the particle example when
   the course reaches systems of ODEs.

The page links to the official materials and includes our own drawings. No
OpenAI graphic assets or proof code are copied or bundled. Sources:

- [OpenAI announcement](https://openai.com/index/navier-stokes-solution/)
- [Paper, Figure 1 on page 4](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf#page=4)
- [Public Lean formalization](https://github.com/openai/NavierStokesAndEuler)

Both opening experiments start paused. Keyboard controls, time sliders,
chapter navigation, and a reduced-motion mode are provided. Opening experiments
reset on reload; the direction-field experiment retains its existing local state.

## Follow the slope

Explore the initial value problem y′ = t − y, y(0) = y₀.

- Inspect slopes by selecting points in the direction field.
- Predict the initial direction and sketch a solution.
- Reveal, pause, and replay the solution with its moving tangent.
- Change the initial value with the draggable point or keyboard-accessible slider.
- Keep up to three solution curves for comparison.
- Show the zero-slope line y = t.

The displayed solution is evaluated analytically:

    y(t) = t - 1 + (y0 + 1) exp(-t)

The exact formula keeps this first experiment focused on direction fields and
initial conditions. Numerical approximation will be a separate learning step.
Interaction state is stored locally in the viewer's browser when storage is
available. No login or server-side application is required.

## Match two areas: separable equations

[Open the experiment](https://shzhang3.github.io/amath351-lab/chapters/first-order/separable/).
For `y' = t*y`, `y(0) = 1`, the integral condition is
`integral(1/y, 1..y(t)) = integral(t, 0..t)`, or `ln(y) = t^2/2`.

- Choose a time and manually adjust y to match the two accumulated areas.
- Use **Match for me** to see the exact matching value.
- Keep up to 12 approximately matching points, with area error at most 0.002.
  Changing the time asks for a new match; an existing time updates its point.
- Reveal `y(t) = exp(t^2/2)` and compare the curve with the collected points.
- Revisit finite-time blowup through `integral(1/u^2, 1..infinity) = 1`.

The area plots share a pixel-area scale. Their numeric integrals and exact
solution are analytic; drawn paths are sampled for display. The explanation
uses the chain rule and explicitly retains the equilibrium `y = 0` before
division. Browser-local storage preserves points and reveal state; reduced
motion replaces the short matching animation with an immediate update.

## From acceleration to motion (Section 1.2)

- [Position, velocity & acceleration](https://shzhang3.github.io/amath351-lab/chapters/first-order/velocity/)
  uses Problem 16: `a(t) = 1/sqrt(t+4)`, `x(0) = 1`, `v(0) = -1`.
  A particle, direction arrows, and three synchronized plots show how positive
  acceleration first slows leftward motion, then produces rightward motion.
  The turning-point button selects `t = 2.25`, where `v = 0`, `x = -1/12`,
  and `a = 0.4`. Tangents connect position to velocity and velocity to acceleration.
- [Two drops on Planet Gzyx](https://shzhang3.github.io/amath351-lab/chapters/first-order/planet-gzyx/)
  uses Problem 33: a 20 ft drop takes 2 s, determining `g = 10 ft/s^2` under
  constant gravity with no air resistance. Release a second ball from 20–400 ft
  on the same spatial and time scales. At the default 200 ft, impact occurs at
  `sqrt(40)` seconds with speed `10*sqrt(40)` ft/s. Each ball stops at first contact;
  the displayed impact speed is the speed immediately before contact.

Both experiments begin paused, have keyboard-accessible time sliders, retain
their state in browser-local storage, and use discrete advances for reduced
motion. Each page includes its assumptions, a prediction prompt, and an expandable
derivation. No copy of the lecture PDF is published.

## From a grid to solution curves (Section 1.3)

[Open the experiment](https://shzhang3.github.io/amath351-lab/chapters/first-order/slope-fields/).
Five stages connect a regular grid of sample points, one tangent, the sampled
slope field, a moving point on an exact solution, and a finite tangent-step
approximation. Grid density controls the displayed samples independently of the
step size used for the approximation; refining the grid leaves computed curves
and errors unchanged. Switch between `y' = x-y`
and Problem 21's `y' = x+y`. Change the initial value in the solution stage and
the number of sampled tangents, then carry that initial value into the short-step
stage. For Problem 21, the approximation steps backward from zero to `x = -4`.

The graph direction for increasing x is `(1, f(x,y))`; segment lengths do not
encode speed. Exact curves are analytic, while tangent steps use Euler's method.
The reference solution can be hidden, and the displayed error is the absolute
endpoint error. The page includes the zero-slope-line discussion and the role of
local uniqueness in preventing crossing solutions. State is stored locally;
playback pauses when changing stages or hiding the page, and reduced motion uses
discrete advances.

The same page now includes an [animated existence and uniqueness exploration](https://shzhang3.github.io/amath351-lab/chapters/first-order/slope-fields/#existence-uniqueness).
A guided tour or manual progress slider displays the rectangle R, the local
interval I, and tangent-step refinements in both directions. The uniqueness view
overlays exact curves with equal or nearby initial values. A movable x compares
their vertical gap d and tangent-slope gap |Δm| against the bound Ld, with L = 1.
Students can animate the initial gap shrinking to zero. The accompanying local
argument connects continuous fᵧ to a finite L, then E ≤ LhE to E = 0 when Lh < 1;
it explicitly requires the same initial value. A third view draws
the two exact solutions max(0,x)^3 and max(0,x-c)^3, with c > 0, of
y′ = 3|y|^(2/3), making local nonuniqueness visible without relying on a solver
that could stay at zero. The animation illustrates the theorem; the text
distinguishes sufficient conditions, numerical approximations, and exact curves.
Source and mathematical helpers are in **src/existence-explorer.html** and
**src/existence-model.cjs**. Playback pauses on edits and page hiding; reduced
motion uses discrete advances.

## Lecture 04: separable equations in the slope field

[From a field to a particular solution](https://shzhang3.github.io/amath351-lab/chapters/first-order/separable-examples/)
contains the three equations in the Section 1.4 lecture: y′ = −2xy,
2√x y′ = √(1 − y²), and y′ = (3x² + 4x + 2)/(2(y − 1)).
Students first see the field, choose an initial point using sliders or the plot,
and reveal its exact solution. The first two suggested initial values are
y(0) = 2 and y(1) = 0; the third preserves the lecture's y(0) = −1.

The square-root equation shows only its real explicit-slope domain, increasing
sine arcs with differentiable constant continuations, and the equilibria lost
by division. At boundary initial values, a constant solution and a distinct
solution through the same point are shown together. The implicit example
selects the branch from the initial value and excludes its finite left endpoint
on y = 1. An optional overlay shows the other implicit branch. Invalid initial
points are explained instead of being silently moved or integrated.
Source and analytic helpers: **src/separable-examples.html** and
**src/separable-examples-model.cjs**. No numerical solver is used.

## Lecture 05: see what an integrating factor changes

[What does an integrating factor change?](https://shzhang3.github.io/amath351-lab/chapters/first-order/integrating-factors/)
visualizes the final lecture example, xy′ − 3y = x³ with y(1) = 10.
Three stages reveal the slope field on both sides of zero, the exact branches
x³(ln|x| + C), and a comparison with z = y/x³ = ln|x| + C. Moving points share the same x, with
tangents and numerical readouts for both equations. The transformed field has
slope 1/x independent of z. Separate sliders control C₊ = y(1) and C₋; the
initial value at x = 1 does not fix C₋. Reset restores C₊ = 10 and the display
choice C₋ = 10. Choose a branch to inspect; playback follows increasing x,
never crosses zero, and pauses on edits, stage changes, and page hiding.
Reduced motion uses discrete advances.

The displayed intervals are (−∞, 0) and (0, ∞), where the standard-form
coefficients are continuous. Curves are sampled separately, with no slope at
zero. An open circle marks their common limit for y; both transformed branches
instead tend to −∞. An optional explanation shows why the original equation
allows differentiable continuations with arbitrary C₋. The signed factor x⁻³
is valid on either interval (a constant multiple of |x|⁻³ on the left).
Source and exact helpers are **src/integrating-factors.html** and
**src/integrating-factor-model.cjs**.

## Section 1.6: exact equations and level curves

[Follow a curve. Keep F constant.](https://shzhang3.github.io/amath351-lab/chapters/first-order/exact-equations/)
overlays a slope field and contours for the lecture example
(x + arctan y) + [(x + y)/(1 + y²)] y′ = 0. Its potential is
F = ½x² + x arctan y + ½ ln(1 + y²).

Choose a level C, then follow either graph branch. The moving tangent matches
the field; F and its three changing terms are recomputed at every point.
The residual and chain-rule cancellation make conservation visible. Layer
toggles let students compare the slope field with the level curves.

Positive levels are closed contours with two graph branches. Playback follows
increasing x along one branch and stops at a vertical tangent, where N = 0
and M ≠ 0. Open circles mark the excluded endpoints; the page does not present
the entire closed contour as one global solution y(x). Points are found by
bracketed root solving of F = C, not by numerical ODE integration. Tests verify
the implicit level, derivatives, and branch endpoints independently.

The page also gives the sufficient exactness condition on an open rectangle
and derives F by integrating M and recovering g(y) from N. Edits and page
hiding pause playback; reduced motion uses discrete advances. Source and math
helpers: **src/exact-equations.html** and **src/exact-equations-model.cjs**.

## Edit and build

**src/catalog.json** defines the three chapters and their example lists. An
example with a `source` is published; an example without one is shown as planned.
Add an example's source fragment and its catalog entry to extend the lab.

The experiment sources are **src/experiment.html**, **src/prologue.html**,
**src/velocity.html**, **src/planet-gzyx.html**, **src/slope-fields.html**,
**src/separable.html**, **src/separable-examples.html**, **src/integrating-factors.html**,
and **src/exact-equations.html**.
Exact mathematical helpers live in the **-model.cjs** files, embedded during the
build; the two Section 1.2 experiments share **src/motion-model.cjs**, and Section
1.3 uses **src/slope-field-model.cjs**. **src/page.html** and
**src/site.css** supply shared navigation and styles.

**build.py** generates **index.html**, chapter indexes and individual example
pages under **chapters/**, and **assets/lab.css**. Do not edit generated output
directly. All runtime assets are served locally, with no third-party CDN or
background network requests. The Section 1.2 and 1.3 plots use the vendored D3 7.9.0
bundle in **src/vendor/**; the build copies it and its license to **assets/vendor/**.

After editing the source:

    python3 build.py
    python3 build.py --check
    python3 tests/check_site.py
    node --test tests/*.test.cjs

The build uses only the Python standard library. Node.js checks the ODEs,
incompressibility, singular-time behavior, and application events with a small
DOM substitute. These checks do not replace visual or browser accessibility
testing. The site check verifies the page graph, links, anchors, stylesheets,
metadata, and label references. To preview from the repository root:

    python3 -m http.server 8000

Open http://localhost:8000/.

## Publishing

This repository has its own GitHub Pages workflow. Each push to **main** checks
the build, navigation, and interactions, then publishes all pages and styles.
To prepare just the public files, run `python3 build.py --check --publish-dir _site`.
Shiheng Zhang's personal homepage provides a link to this project.

Good contributions include a clearer explanation, a revealing initial
condition, a classroom prediction question, an accessibility improvement, or a
small interaction fix. Keep mathematical behavior and learning goals explicit.

## License

Original project code: MIT. See LICENSE.
D3 7.9.0: ISC, copyright Mike Bostock. See [the D3 license](src/vendor/d3.LICENSE.txt).
