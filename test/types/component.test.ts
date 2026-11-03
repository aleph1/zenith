import { comp, compDef, elem } from '../../src/index';
import type { VNodeCompAttributes } from '../../src/vnode.defs';

interface MessageAttrs extends VNodeCompAttributes {
  message: string;
}

const Message = compDef<MessageAttrs>({
  draw: vNode => elem('div', vNode.attrs.message)
});

comp(Message, { message: 'Hello' });

// @ts-expect-error Required attribute is missing
comp(Message, {});

// @ts-expect-error Incorrect attribute type
comp(Message, { message: 42 });

const Legacy = compDef({
  init: vNode => {
    vNode.state = { count: 0 };
  },
  draw: vNode => elem('div', String(vNode.state?.count ?? 0))
});

void Legacy;
