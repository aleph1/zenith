import { comp, compDef, elem } from '../../src/index';

const Counter = compDef({
  init: () => ({ count: 0 }),
  draw: vNode => {
    const count: number = vNode.state.count;

    // @ts-expect-error Invalid state property
    vNode.state.coutn;

    return elem('button', {
      onclick: () => vNode.state.count++
    }, `Count: ${count}`);
  }
});

const Toggle = compDef({
  init: () => true,
  draw: vNode => {
    const enabled: boolean = vNode.state;

    // @ts-expect-error Boolean state is not a number
    const count: number = vNode.state;

    return elem('button', {
      onclick: () => vNode.state = !vNode.state
    }, enabled ? 'On' : 'Off');
  }
});

const Stateless = compDef({
  draw: () => elem('div', 'No state required')
});

const App = compDef({
  draw: () => elem('div',
    comp(Counter),
    comp(Toggle)
  )
});

comp(App);
comp(Counter);
comp(Toggle);

void App;
void Counter;
void Toggle;
void Stateless;
