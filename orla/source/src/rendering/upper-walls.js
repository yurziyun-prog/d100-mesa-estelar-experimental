import { state as s } from '../core/state.js';
import { STOREY_HEIGHT } from '../physics/stairs.js';
export const UPPER_WINDOWS = {
  north: [[1.69, .72], [6.12, .72], [8.24, .72]],
  south: [[6.15, .82]],
  west: [[1.89, .98]],
  east: [[1.89, .98]]
};
// Both views use the same openings and the detailed ground-floor glass renderer.
export function drawUpperWalls(interior = false) {
  const hw = s.currentHouseWidth();
  if (hw < 9) return;
  const P2 = s.P,
    portal = s.sceneThroughWindow;
  s.P = (x, z, y = 0) => P2(x, z, y + STOREY_HEIGHT);
  // Reutiliza a janela vazada e a transparência do térreo (evita vidro opaco azul).
  s.sceneThroughWindow = side => {if(s.reveal())portal(side);else s.floorSurface();};
  try {
    const mid = s.painterDepth(hw / 2, 2.5),
      sides = [["north", hw / 2, 0], ["south", hw / 2, 5], ["west", 0, 2.5], ["east", hw, 2.5]].sort((a, b) => s.painterDepth(a[1], a[2]) - s.painterDepth(b[1], b[2]));
    for (const [side, cx, cz] of sides) {
      // Na fachada da chaminé não há janela. O duto ocupa essa parede.
      const horizontal = side === "north" || side === "south",
        length = horizontal ? hw : 5,
        cut = interior && s.painterDepth(cx, cz) > mid,
        h = cut ? 0.39 : 2.92,
        color = s.houseFinish?.color || "#e6d3b1";
      const wall = (a, b) => horizontal ? s.wallLine(a,cz,h,b-a,0,color) : s.wallLine(cx,a,h,0,b-a,color);
      if (cut) {
        wall(0, length);
        continue;
      }
      let cursor = 0;
      for (const [a, w] of side === 'east' ? [] : UPPER_WINDOWS[side]) {
        wall(cursor, a);
        if (horizontal) s.windowPaneZ(cz, a, w);else s.windowPaneX(cx, a, w);
        cursor = a + w;
      }
      wall(cursor, length);
      // Same timber grid and plaster as the ground floor, continuous at the storey seam.
      const openings=side==='east'?[]:UPPER_WINDOWS[side];
      for(let u=0;u<length;u+=1.18){if(openings.some(([a,w])=>u>a&&u<a+w))continue;if(horizontal)s.line3([u,cz,0],[u,cz,h],'#765338',3.3);else s.line3([cx,u,0],[cx,u,h],'#765338',3.3);}
      if(horizontal)s.line3([0,cz,h],[length,cz,h],'#765338',4.3);else s.line3([cx,0,h],[cx,length,h],'#765338',4.3);
    }
    // Fachadas com pilares de canto continuos do terreo ao beiral.
    if (!interior) {
      const pp = s.P;
      s.P = P2;
      for (const [x, z] of [[0, 0], [0, 5], [hw, 0], [hw, 5]]) s.line3([x, z, .04], [x, z, 5.78], '#765338', 3.3);
      s.P = pp;
    }
  } finally {
    s.P = P2;
    s.sceneThroughWindow = portal;
  }
}

// src/construction/components.js
