import { bind, comp, compDef, diff, elem, node, redraw, } from './index';
const z = { bind, comp, compDef, diff, elem, node, redraw };
(window as Window & { z?: typeof z }).z = z;