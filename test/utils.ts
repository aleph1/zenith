import { comp, draw, sync } from '../src/index';

export const redraw = (view: ReturnType<typeof comp>, surgical = false) => {
  draw(view, surgical);
  sync();
};