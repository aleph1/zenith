const simpleProxyState = instance => {
	instance.state = new Proxy(instance.state, {
		get(target, key) {
			if (key === 'isProxy') return true;
			const prop = target[key];
			// return if property not found
			if (typeof prop !== 'undefined') {
				if (!prop.isProxy && typeof prop === 'object') {
					target[key] = new Proxy(prop, handler);
				}
				return target[key];
			}
		},
		set(target, key, value) {
			target[key] = value;
			instance.redraw();
			return true;
		}
	});
};

const Counter = z.compDef( {
	state: simpleProxyState,
	init: instance => {
		instance.state.counter = 0;
	},
	view: instance => z.elem('article',
		z.elem('h3', z.text('Counter Demo')),
		z.elem('div',
			z.elem('button', {
				onclick() {
					instance.state.counter++;
				}
			}, z.text('Increment')),
			z.elem('button', {
				onclick() {
					instance.state.counter--;
				}
			}, z.text('Decrement')),
			z.elem('button', {
				onclick() {
					instance.state.counter = 0;
				}
			}, z.text('Zero')),
		),
		z.elem('div', z.text('Counter: ' + instance.state.counter))
	)
} );

const Timer = z.compDef( {
	init: instance => {
		instance.state.counter = 0;
		instance.state.interval = setInterval(() => {
			instance.state.counter++;
			instance.redraw();
		}, 1000);
	},
	view: instance => z.elem('article',
		z.elem('h3', z.text('Timer Demo')),
		z.elem('div', z.text('Timer: ' + instance.state.counter))
	)
} );

const List = z.compDef( {
	init: instance => {
		console.log('List.init()');
		instance.state.counter = 0;
		instance.state.items = [...Array(10).fill(0).map(() => instance.state.counter++)];
	},
	view: instance => z.elem('article',
		z.elem('h3', z.text('List Demo')),
		z.elem('div',
			z.elem('button', {
				onclick() {
					instance.state.items.push(instance.state.counter++);
					instance.redraw();
				}
			}, z.text('Add Item')),
		),
		z.elem('ul',
			instance.state.items.map(item => 
				z.elem('li',
					z.text(item + 1),
					z.elem('button', {
						onclick(e) {
							instance.state.items.splice(instance.state.items.indexOf(item), 1);
							instance.redraw();
						}
					}, z.text('x'))
				)
			)
		)
	)
} );

const Header = z.compDef( {
	view: instance => z.elem( 'header',
		{
			id: 'header'
		},
		z.elem('div',
			z.elem('div', {
				class: 'logo'
			}),
			z.elem('div', {
				class: 'info'
			},
				z.elem('h1', z.text('Zenith.js is a tiny yet powerful GUI framework that is under 2kb minified and gzipped.')),
				z.elem('p', z.text('Its vdom and diffing algorithm function on an entire page or on specific nodes — especially useful in cases where you know that only a portion of the tree will change. Zenith.js is fast, flexible, and doesn’t require a compile step.')),
				z.elem('p', z.text('This site uses Zenith.js.')),
			)
		)
	)
} );

const Main = z.compDef( {
	view: instance => z.elem('main',
		z.elem('div',
			z.comp(instance.attrs.comp)
		)
	)
} );

const Demos = z.compDef( {
	view: instance => z.elem('section',
		z.comp(Counter),
		z.comp(Timer),
		z.comp(List),
	)
} );

const Footer = z.compDef( {
	view: instance => z.elem('footer', {
		id: 'footer'
	}, z.elem('div',
		z.text('Copyright ©2022 Aleph1 / Daniel Barber'))
	)
} );

const Layout = z.compDef( {
	view: instance => [
		z.comp(Header),
		z.comp(Main, {
			comp: instance.attrs.comp
		}),
		z.comp(Footer),
	]
} );

z.draw(document.querySelector('#app'), z.comp(Layout, {
	comp: Demos
}));
setTimeout(() => document.querySelector('html').classList.add('loaded'), 1);