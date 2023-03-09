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
	view: instance => z.elem('article', z.elem('article',
		z.elem('h3', z.text('Timer Demo')),
		z.elem('div', z.text('Timer: ' + instance.state.counter))
	))
} );

const List = z.compDef( {
	init: instance => {
		console.log('List.init()');
		instance.state.counter = 0;
		instance.state.items = [...Array(10).fill(0).map(() => instance.state.counter++)];
	},
	view: instance => z.elem('article', z.elem('article',
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
					}, z.text('remove'))
				)
			)
		)
	))
} );

const Header = z.compDef( {
	view: instance => z.elem('header', z.text('Zenith.js'))
} );

const Main = z.compDef( {
	view: instance => z.elem('main',
		z.elem('section',
			z.comp(Counter),
			z.comp(Timer),
			z.comp(List),
		)
	)
} );

const Footer = z.compDef( {
	view: instance => z.elem('footer', z.text('Copyright ©2022 Aleph1 / Daniel Barber'))
} );

const Layout = z.compDef( {
	view: instance => [
		z.comp(Header),
		z.comp(Main),
		z.comp(Footer),
	]
} );

z.draw(document.querySelector('#app'), z.comp(Layout));