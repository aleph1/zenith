//import { observable, observe, destroy } from './simple-observable-proxy.mjs';
//const now = performance.now();
(() => {

	const fixIndentation = str => {
		const indentationMatch = str.match(/^\n(\s\s+)/);
		if(indentationMatch) {
			const indentationCount = indentationMatch[1].length;
			str = str.split('\n').reduce((filtered, line) => {
				if(line.length) filtered.push(line.substr(indentationCount));
				return filtered;
			}, []).join('\n');
		}
		return str;
	};

	const CodeBlock = z.compDef( {
		draw: vNode => z.html('<pre class="language-js"><code>' + fixIndentation(vNode.attrs.code) + '</code></pre>')
	});

	const Demo = z.compDef({
		draw: vNode => z.elem('article',
			z.elem('div',{
				class: 'code'
			}, z.comp(CodeBlock,
				{
					code: vNode.attrs.code
				})
			),
			z.elem('div',
				{
					class: 'demo'
				},
				vNode.attrs.demo.type === z.type.compDef ? z.comp(vNode.attrs.demo) : vNode.attrs.demo
			)
		)
	});

	const counter = {
		value: 0,
	};

	const Counter = z.compDef( {
		draw: vNode => [
			z.text('Counter: ' + counter.value),
			z.elem('button', {
				onclick() {
					counter.value++;
					vNode.redraw();
				}
			}, z.text('+')),
			z.elem('button', {
				onclick() {
					counter.value--;
					vNode.redraw();
				}
			}, z.text('-'))
		]
	} );

	const timer = {
		value: 0,
		interval: null
	};

	const Timer = z.compDef( {
		init: vNode => {
			timer.interval = setInterval(() => {
				timer.value++;
				vNode.redraw();
			}, 1000);
		},
		draw: vNode => [
			z.elem('div', z.text('Timer: ' + timer.value))
		]
	} );

	const todo = {
		text: '',
		add() {
			if(todo.text.length) {
				todo.list.push(todo.text);
				return true;
			}
		},
		list: []
	};

	const Todo = z.compDef( {
		draw: vNode => [
			z.elem('div',
				z.elem('input', {
					oninput(e) {
						todo.text = e.target.value;
					},
					onkeydown(e) {
						if(e.key==='Enter' && todo.add()) {
							vNode.redraw();
							todo.text = e.target.value = '';
						}
					},
					placeholder: 'Enter a label.'
				}),
				z.elem('button', {
					onclick() {
						if(todo.add()) vNode.redraw();
					}
				}, z.text('Add Todo')),
			),
			z.elem('ul',
				todo.list.map((item, index) => 
					z.elem('li',
						z.text(item),
						z.elem('button', {
							onclick(e) {
								todo.list.splice(index, 1);
								vNode.redraw();
							}
						}, z.text('x'))
					)
				)
			)
		]
	});

	const firstNames = ['Aki', 'Adam', 'Amy', 'Ang', 'Brianna', 'Bruce', 'Cassandra', 'Charles', 'Colette', 'Dae', 'Deion', 'Elijah', 'Emma', 'Han', 'Hiromi', 'Jackie', 'Jamal', 'Jin', 'Kalisha', 'Keysha', 'Lamonte', 'Liang', 'Naoki', 'Osamu'];
	const lastNames = ['Anderson', 'Barnes', 'Chan', 'Diaz', 'Ferguson', 'Hunt', 'James', 'Lee', 'McDonald', 'Olson', 'Ramirez', 'Singh', 'Smith', 'Wood'];
	const people = [];
	let personId = 0;
	const addPerson = () => {
		people.push({
			id: personId++,
			firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
			lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
			age: Math.floor(Math.random() * 60 + 18)
		})
	}
	for(let i = 0; i < 250; i++) {
		addPerson();
	};

	const shuffle = arr => {
		let currentIndex = arr.length, randomIndex;
		while (currentIndex !== 0) {
			// Pick a remaining element.
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;
			// And swap it with the current element.
			[arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
		}
	};

	const KeyedList = z.compDef({
		draw: vNode => [
			z.elem('div',
				//z.elem('div', z.text(people.map(person => person.id).join(', '))),
				z.elem('button', {
					onclick(e) {
						addPerson();
						vNode.redraw();
					}
				}, z.text('add')),
				z.elem('button', {
					onclick(e) {
						shuffle(people);
						vNode.redraw();
					}
				}, z.text('shuffe')),
				z.elem('button', {
					onclick(e) {
						people.push(people.shift());
						vNode.redraw();
					}
				}, z.text('move first to last')),
				z.elem('button', {
					onclick(e) {
						people.unshift(people.pop());
						vNode.redraw();
					}
				}, z.text('move last to first')),
				z.text('Length: ' + people.length)
			),
			z.elem('table',
				z.elem('thead',
					z.elem('tr',
						z.elem('th', {
							class: 'sort',
							onclick(e) {
								people.sort((a,b) => a.id-b.id);
								vNode.redraw();
							}
						}, z.text('ID')),
						z.elem('th', {
							class: 'sort',
							onclick(e) {
								people.sort((a,b) => {
									const nameA = a.firstName.toUpperCase();
									const nameB = b.firstName.toUpperCase();
									if (nameA < nameB) return -1;
									if (nameA > nameB) return 1;
									return 0;
								});
								vNode.redraw();
							}
						}, z.text('First Name')),
						z.elem('th', {
							class: 'sort',
							onclick(e) {
								people.sort((a,b) => {
									const nameA = a.lastName.toUpperCase();
									const nameB = b.lastName.toUpperCase();
									if (nameA < nameB) return -1;
									if (nameA > nameB) return 1;
									return 0;
								});
								vNode.redraw();
							}
						}, z.text('Last Name')),
						z.elem('th', {
							class: 'sort',
							onclick(e) {
								people.sort((a,b) => a.age-b.age);
								vNode.redraw();
							}
						}, z.text('Age')),
					)
				),
				z.elem('tbody',
					//people.map(person => z.elem('li', {key: person.id}, z.text(person.id + ': ' + person.firstName + ' ' + person.lastName + ' (' + person.age + ' years)'))))
					//people.map( person => z.elem('tr', {diff: false, key: person.id},
					people.map( person => z.elem('tr',// {key: person.id},
						z.elem('td', {class: 'r'}, z.text(person.id)),
						z.elem('td', z.text(person.firstName)),
						z.elem('td', z.text(person.lastName)),
						z.elem('td', {class: 'r'}, z.text(person.age)),
					))
				)
			)
		]
	});

	function getRndColor() {
		const r = 255*Math.random()|0,
			g = 255*Math.random()|0,
			b = 255*Math.random()|0;
		return 'rgb(' + r + ',' + g + ',' + b + ')';
	}

	const Canvas = z.compDef({
		draw: (vNode, oldChildren) => {
			return oldChildren || z.elem('canvas', {
				width: '100%',
				height: '100%'
			});
		},
		tick: (vNode, tickCount) => {
			const canvas = vNode.children[0].dom;
			const context = canvas.getContext('2d');
			const bounds = canvas.getBoundingClientRect();
			const canvasWidth = Math.min(bounds.width, window.innerWidth) * window.devicePixelRatio;
			const canvasHeight = bounds.height * window.devicePixelRatio;
			const rectWidth = Math.random() * canvasWidth / 10;
			const rectHeight = Math.random() * canvasHeight / 10;
			if(canvas.width != canvasWidth) canvas.width = canvasWidth;
			if(canvas.height != canvasHeight) canvas.height = canvasHeight;
			context.save();
			context.globalAlpha = 1;
			context.globalCompositeOperation = 'destination-in';
			context.fillStyle = 'rgba(0, 0, 0, 0.95)';
			context.fillRect(0, 0, canvasWidth, canvasHeight);
			context.restore();
			context.fillStyle = getRndColor();
			context.fillRect(Math.random() * (canvasWidth - rectWidth), Math.random() * (canvasHeight - rectHeight), rectWidth, rectHeight);
		},
	});

	const CanvasInstance = z.comp(Canvas);

	const SVG = z.compDef({
		draw: (vNode, oldChildren) => z.elem('svg',
			z.elem('circle', {
				cx: 25,
				cy: 25,
				r: 25,
				'data-vx': 1,
				'data-vy': 1,
			})
		),
		tick: vNode => {
			const svg = vNode.children[0].dom;
			const circle = svg.querySelector('circle');
			const bounds = svg.getBoundingClientRect();
			const vx = parseInt(circle.dataset.vx);
			const vy = parseInt(circle.dataset.vy);
			let x = parseInt(circle.getAttribute('cx'));
			let y = parseInt(circle.getAttribute('cy'));
			if(x + 25 > bounds.width) {
				x = bounds.width - 25;
				circle.dataset.vx = -1;
			} else if(x - 25 < 0) {
				x = 25;
				circle.dataset.vx = 1;
			} else {
				x += vx;
			}
			if(y + 25 > bounds.height) {
				y = bounds.height - 25;
				circle.dataset.vy = -1;
			} else if(y - 25 < 0) {
				y = 25;
				circle.dataset.vy = 1;
			} else {
				y += vy;
			}
			circle.setAttribute('cx', x);
			circle.setAttribute('cy', y);
		}
	});

	const KeptElems = z.compDef({
		draw: vNode => z.elem('div',
			z.elem('div'),
			z.elem('div'),
		)
	});

	const Header = z.compDef({
		draw: vNode => z.elem( 'header',
			{
				id: 'header'
			},
			z.elem('nav',
				[{
					name: 'Home',
					href: ''
				},{
					name: 'Quickstart',
					href: 'quickstart'
				},{
					name: 'Github',
					href: 'https://github.com/'
				}].map(item => z.elem('a', {
					href: item.href
				},z.text(item.name)))
			),
			z.elem('div',
				z.elem('div', {
					class: 'logo'
				},
					z.elem('img', {
						src: 'img/zenith-logo.min.svg'
					})
				),
				z.elem('div', {
					class: 'info'
				},
					z.elem('h1', z.text('Zenith.js is a tiny yet powerful GUI framework that is under 2.5kb minified and gzipped, and 2kb minified and brotlified.')),
					z.elem('p', z.text('Its virtual dom and diffing algorithm function on an entire page or on specific nodes — especially useful in cases where you know that only a portion of the tree will change. It allows for granular control over components that need to govern themselves and their own content — canvas, WebGL, SVG — and an opt-in object pool to minimize garbage collection.')),
					z.elem('p', z.text('Zenith.js is fast, flexible, and doesn’t require a compile step.'))
				)
			)
		)
	});

	const Main = z.compDef({
		draw: vNode => z.elem('main',
			z.elem('div',
				z.comp(vNode.attrs.comp),
			)
		)
	});

	const Demos = z.compDef({
		draw: vNode => z.elem('section',
			z.comp(Demo, {
				demo: Timer,
				code: `
				// Timer Demo
				const timer = 0;
				const Timer = z.compDef({
					init: vNode => {
						setInterval(() => {
							timer++;
							vNode.redraw();
						}, 1000);
					},
					draw: vNode => z.elem('div', z.text('Timer: ' + timer))
				});`
			}),
			z.comp(Demo, {
				demo: Counter,
				code: `
				// Counter Demo
				const counter = 0;
				const Counter = z.compDef({
					draw: vNode => [
						z.text('Counter: ' + counter),
						z.elem('button', {
							onclick() {
								counter++;
								vNode.redraw();
							}
						}, z.text('+')),
						z.elem('button', {
							onclick() {
								counter--;
								vNode.redraw();
							}
						}, z.text('-'))
					]
				});`
			}),
			z.comp(Demo, {
				demo: Todo,
				code: `
				// Todos Demo
				let todoText = '';
				let todos = [];
				const Todo = z.compDef( {
					draw: vNode => [
						z.elem('input', {
							oninput(e) {
								todoText = e.target.value;
							},
							placeholder: 'Enter a label.'
						}),
						z.elem('button', {
							onclick() {
								if(todoText.length) {
									todos.push(todoText);
									vNode.redraw();
								}
							}
						}, z.text('Add Todo')),
						z.elem('ul',
							todos.map((item, index) => 
								z.elem('li',
									z.text(item),
									z.elem('button', {
										onclick(e) {
											todos.splice(index, 1);
											vNode.redraw();
										}
									}, z.text('x'))
								)
							)
						)
					]
				});
				z.draw(document.querySelector('section#todo'), Todo);
				`
			}),
			z.comp(Demo, {
				demo: KeyedList,
				code: `
				// Keyed List Demo
				const firstNames = [
					'Aki', 'Adam', 'Amy', 'Ang',
					'Brianna', 'Bruce',
					'Cassandra', 'Charles', 'Colette',
					'Dae', 'Deion',
					'Elijah', 'Emma',
					'Han', 'Hiromi',
					'Jackie', 'Jamal', 'Jin',
					'Kalisha', 'Keysha', 'Lamonte',
					'Liang',
					'Naoki',
					'Osamu'
				];
				const lastNames = [
					'Anderson', 
					'Barnes',
					'Chan',
					'Diaz',
					'Ferguson',
					'Hunt',
					'James',
					'Lee',
					'McDonald',
					'Olson',
					'Ramirez',
					'Singh', 'Smith',
					'Wood'
				];
				const people = [];
				for(let i = 0; i < 250; i++) {
					people.push({
						id: i,
						firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
						lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
						age: Math.floor(Math.random() * 60 + 18)
					})
				}

				const shuffle = arr => {
					let currentIndex = arr.length, randomIndex;
					while (currentIndex !== 0) {
						randomIndex = Math.floor(Math.random() * currentIndex);
						currentIndex--;
						[arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
					}
				}

				const KeyedList = z.compDef({
					draw: vNode => [
						z.elem('div',
							z.text('Sort by:'),
							z.elem('select',
								{
									onchange(e) {
										switch(e.target.value) {
											case 'id':
												people.sort((a,b) => a.id-b.id);
												break;
											case 'firstname':
												people.sort((a,b) => {
													const nameA = a.firstName.toUpperCase();
													const nameB = b.firstName.toUpperCase();
													if (nameA < nameB) return -1;
													if (nameA > nameB) return 1;
													return 0;
												});
												break;
											case 'lastname':
												people.sort((a,b) => {
													const nameA = a.lastName.toUpperCase();
													const nameB = b.lastName.toUpperCase();
													if (nameA < nameB) return -1;
													if (nameA > nameB) return 1;
													return 0;
												});
												break;
											case 'age':
												people.sort((a,b) => a.age-b.age);
												break;
											case 'random':
												suffle(people);
												break;
										}
										vNode.redraw();
									}
								},
								z.elem('option', {
									value: 'id',
								}, z.text('ID')),
								z.elem('option', {
									value: 'firstname',
								}, z.text('First Name')),
								z.elem('option', {
									value: 'lastname',
								}, z.text('Last Name')),
								z.elem('option', {
									value: 'age',
								}, z.text('Age')),
								z.elem('option', {
									value: 'random',
								}, z.text('Random')),
							),
						),
						z.elem('table',
							z.elem('thead',
								z.elem('tr',
									z.elem('th', 'ID'),
									z.elem('th', 'First Name'),
									z.elem('th', 'Last Name'),
									z.elem('th', 'Age'),
								)
							),
							z.elem('tbody',
								people.map( person => z.elem('tr', {key: person.id},
									z.elem('td', z.text(person.id)),
									z.elem('td', z.text(person.firstName)),
									z.elem('td', z.text(person.lastName)),
									z.elem('td', {class: 'r'}, z.text(person.age)),
								))
							)
						)
					]
				});`
			}),
			z.comp(Demo, {
				demo: CanvasInstance,
				code: `
				// Canvas Demo
				// In cases where you want granular control over a
				// component’s DOM it is possible to draw it once,
				// and then use the tick callback to have GUI updates
				// synchronized with Zenith’s tick cycle.
				const Canvas = z.compDef({
					draw: (vNode, oldChildren) => oldChildren || z.elem('canvas', {
						width: '100%',
						height: '100%'
					}),
					tick: (vNode, tickCount) => {
						const canvas = vNode.dom[0];
						const context = canvas.getContext('2d');
						const bounds = canvas.getBoundingClientRect();
						const canvasWidth = bounds.width * window.devicePixelRatio;
						const canvasHeight = bounds.height * window.devicePixelRatio;
						const rectWidth = Math.random() * canvasWidth / 10;
						const rectHeight = Math.random() * canvasHeight / 10;
						if(canvas.width != canvasWidth) canvas.width = canvasWidth;
						if(canvas.height != canvasHeight) canvas.height = canvasHeight;
						context.save();
						context.globalAlpha = 1;
						context.globalCompositeOperation = 'destination-in';
						context.fillStyle = 'rgba(0, 0, 0, 0.95)';
						context.fillRect(0, 0, canvasWidth, canvasHeight);
						context.restore();
						context.fillStyle = getRndColor();
						context.fillRect(
							Math.random() * (canvasWidth - rectWidth),
							Math.random() * (canvasHeight - rectHeight),
							rectWidth,
							rectHeight
						);
					}
				});`
			}),
			z.comp(Demo, {
				demo: SVG,
				code: `
				// SVG Demo
				const radius = 25;
				const velocity = 1;
				const SVG = z.compDef({
					draw: (vNode, oldChildren) => z.elem('svg',
						z.elem('circle', {
							cx: radius,
							cy: radius,
							r: radius,
							'data-vx': velocity,
							'data-vy': velocity,
						})
					),
					tick: vNode => {
						const svg = vNode.children[0].dom;
						const circle = svg.querySelector('circle');
						const bounds = svg.getBoundingClientRect();
						const vx = parseInt(circle.dataset.vx);
						const vy = parseInt(circle.dataset.vy);
						let x = parseInt(circle.getAttribute('cx'));
						let y = parseInt(circle.getAttribute('cy'));
						if(x + radius > bounds.width) {
							x = bounds.width - radius;
							circle.dataset.vx = -velocity;
						} else if(x - radius < 0) {
							x = radius;
							circle.dataset.vx = velocity;
						} else {
							x += vx;
						}
						if(y + radius > bounds.height) {
							y = bounds.height - radius;
							circle.dataset.vy = -velocity;
						} else if(y - radius < 0) {
							y = radius;
							circle.dataset.vy = velocity;
						} else {
							y += vy;
						}
						circle.setAttribute('cx', x);
						circle.setAttribute('cy', y);
					}
				});`
			}),
		)
	});

	const Footer = z.compDef( {
		draw: vNode => z.elem('footer', {
			id: 'footer'
		}, z.elem('div',
			z.text('Copyright ©2022 Aleph1 / Daniel Barber'))
		)
	});

	const Layout = z.compDef( {
		draw: vNode => [
			z.comp(Header),
			z.comp(Main, {
				comp: vNode.attrs.comp
			}),
			z.comp(Footer),
		]
	});

	z.draw(document.querySelector('#app'), z.comp(Layout, {
		comp: Demos
	}));
	setTimeout(() => document.querySelector('html').classList.add('loaded'), 1);
})();
//console.log(performance.now() - now);