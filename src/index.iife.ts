import { bind, comp, compDef, diff, draw, elem, node, ns } from './index';
const z = { bind, comp, compDef, diff, draw, elem, node, ns };
(window as Window & { z?: typeof z }).z = z;