import type React from 'react';

// Card che si inclina verso il mouse (--rx/--ry), riflesso di luce (--sx/--sy), --mx/--my (-1..1) per la parallasse (.par-1/2/3). CSS: .tilt / .sheen in globals.css
export function tiltMove(e: React.MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  const st = e.currentTarget.style;
  st.setProperty('--ry', `${(x - 0.5) * 5}deg`); st.setProperty('--rx', `${(0.5 - y) * 4}deg`);
  st.setProperty('--mx', String((x - 0.5) * 2)); st.setProperty('--my', String((y - 0.5) * 2));
  st.setProperty('--sx', `${x * 100}%`); st.setProperty('--sy', `${y * 100}%`); st.setProperty('--lift', '-4px');
}
export function tiltReset(el: HTMLElement) { ['--rx', '--ry', '--mx', '--my', '--lift'].forEach(k => el.style.removeProperty(k)); }
