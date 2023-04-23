import {
  VNodeTypes
} from './vnode.defs';

export const pools = {};
export const poolSizes = {};
export const grow = (type: VNodeTypes.elem, amount: number): void => {
  const pool = pools[type];
  if(pool.length < amount) {
    switch(type) {
      case VNodeTypes.elem:
        for(let i = pool.length; i < amount; i++) {
          pool.push({
            type: VNodeTypes.elem,
            tag: null,
            attrs: null
          });
        }
        break;
    }
  } else {
    pool.length = amount;
  }
};
pools[VNodeTypes.elem] = [];
poolSizes[VNodeTypes.elem] = 0;