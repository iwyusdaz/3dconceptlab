# Task 9A — Frame-rate report

Target: **30 fps or more on a mid-range laptop** (plan Default Values).

| Scene | Measured fps | Notes |
|---|---|---|
| Moon phases (composed) | 43–60 fps | steady state, Chromium |
| Seasons (template, with ground-view inset canvas) | 60 fps | after reducing star count and mesh segments |

**Was a GPU available?** **No.** All measurements in this environment were taken in
headless Chromium whose WebGL context reports
`ANGLE (SwiftShader Device …)` — i.e. **pure software (CPU) rendering**. There is no
hardware GPU in this build environment, so these numbers are a worst-case floor.

In-app meter: the badge labelled `<fps>` beside the control bar updates twice per second
from the render loop (`data-testid="fps-meter"`), so the owner can check the rate on any
machine, including a real mid-range laptop with a GPU.

Verdict: both reference scenes meet the 30 fps target even without a GPU. The Seasons
scene initially measured 21 fps under SwiftShader; star count (2500→1400) and mesh
segment counts were reduced to bring it above the target.
