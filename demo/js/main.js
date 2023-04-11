//import { observable, observe, destroy } from './simple-observable-proxy.mjs';

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
		//keep: true,
		draw: vNode => z.html('<pre class="language-js"><code>' + fixIndentation(vNode.attrs.code) + '</code></pre>')
	});

	const Demo = z.compDef({
		draw: vNode => z.elem('article',
			z.elem('div',{
				class: 'code'
			}, z.comp(CodeBlock, {
					code: vNode.attrs.code
				})
			),
			z.elem('div',{
				class: 'demo'
			},
				z.comp(vNode.attrs.demo)
			)
		)
	})

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

	const firstNames = ['Aki', 'Amy', 'Andrew', 'Ang', 'Brianna', 'Bruce', 'Cassandra', 'Dae', 'Deion', 'Elijah', 'Emma', 'Han', 'Hiromi', 'Jackie', 'Jamal', 'Jin', 'Kalisha', 'Keysha', 'Lamonte', 'Liang', 'Naoki', 'Osamu'];
	const lastNames = ['Barnes', 'Diaz', 'Ferguson', 'Hunt', 'James', 'Lee', 'McDonald', 'Olson', 'Ramirez', 'Singh', 'Smith', 'Wood'];
	const people = [];
	for(let i = 0; i < 2000; i++) {
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
			// Pick a remaining element.
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;
			// And swap it with the current element.
			[arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
		}
	}

	const KeyedList = z.compDef({
		draw: vNode => [
			z.elem('div',
				//z.elem('div', z.text(people.map(person => person.id).join(', '))),
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
				),
				z.elem('button', {
					onclick(e) {
						shuffle(people);
						vNode.redraw();
					}
				}, z.text('shuffle'))
			),
			z.elem('table',
				z.html('<thead><tr><th>ID</th><th>First Name</th><th>Last Name</th><th>Age</th></thead'),
				z.elem('tbody',
					//people.map(person => z.elem('li', {key: person.id}, z.text(person.id + ': ' + person.firstName + ' ' + person.lastName + ' (' + person.age + ' years)'))))
					people.map( person => z.elem('tr', {diff: false, key: person.id},
						z.elem('td', z.text(person.id)),
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

	let context;

	const Canvas = z.compDef({
		draw: (vNode, oldChildren) => oldChildren || z.elem('canvas', {
			width: '100%',
			height: '100%'
		}),
		tick: (vNode, tickCount) => {
			//console.log(tickCount);
			if(!context) context = vNode.dom.getContext('2d');
			const canvasRect = vNode.dom.getBoundingClientRect();
			const canvasWidth = Math.min(canvasRect.width, window.innerWidth) * window.devicePixelRatio;
			const canvasHeight = canvasRect.height * window.devicePixelRatio;
			const rectWidth = Math.random() * canvasWidth / 10;
			const rectHeight = Math.random() * canvasHeight / 10;
			if(vNode.dom.width != canvasWidth) vNode.dom.width = canvasWidth;
			if(vNode.dom.height != canvasHeight) vNode.dom.height = canvasHeight;
			context.fillStyle = 'rgb(255,255,255,.1)';
			context.fillRect(0, 0, canvasWidth, canvasHeight);
			context.fillStyle = getRndColor();
			context.fillRect(Math.random() * (canvasWidth - rectWidth), Math.random() * (canvasHeight - rectHeight), rectWidth, rectHeight);
		}
	});

	const SVG = z.compDef({
		draw: vNode => z.elem('svg',
			z.elem('rect')
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
					z.elem('h1', z.text('Zenith.js is a tiny yet powerful GUI framework that is under 2kb minified and gzipped.')),
					z.elem('p', z.text('Its virtual dom and diffing algorithm function on an entire page or on specific nodes — especially useful in cases where you know that only a portion of the tree will change. Zenith.js is fast, flexible, and doesn’t require a compile step.'))
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
				const firstNames = ['Aki', 'Amy', 'Andrew', 'Ang', 'Brianna', 'Bruce', 'Cassandra', 'Dae', 'Deion', 'Elijah', 'Emma', 'Han', 'Hiromi', 'Jackie', 'Jamal', 'Jin', 'Kalisha', 'Keysha', 'Lamonte', 'Liang', 'Naoki', 'Osamu'];
				const lastNames = ['Barnes', 'Diaz', 'Ferguson', 'Hunt', 'James', 'Lee', 'McDonald', 'Olson', 'Ramirez', 'Singh', 'Smith', 'Wood'];
				const people = [];
				for(let i = 0; i < 100; i++) {
					people.push({
						id: i,
						firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
						lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
						age: Math.floor(Math.random() * 60 + 18)
					})
				}

				const KeyedList = z.compDef({
					draw: vNode => [
						z.elem('div',
							//z.elem('div', z.text(people.map(person => person.id).join(', '))),
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
								//people.map(person => z.elem('li', {key: person.id}, z.text(person.id + ': ' + person.firstName + ' ' + person.lastName + ' (' + person.age + ' years)'))))
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
				demo: Canvas,
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
					})
					tick: vNode => {
						const context = vNode.state.context || ( vNode.state.context = vNode.dom.getContext('2d') );
						const canvasRect = vNode.dom.getBoundingClientRect();
						const canvasWidth = canvasRect.width * window.devicePixelRatio;
						const canvasHeight = canvasRect.height * window.devicePixelRatio;
						const rectWidth = Math.random() * canvasWidth / 10;
						const rectHeight = Math.random() * canvasHeight / 10;
						if(vNode.dom.width != canvasWidth) vNode.dom.width = canvasWidth;
						if(vNode.dom.height != canvasHeight) vNode.dom.height = canvasHeight;
						context.fillStyle = 'rgb(255,255,255,.1)';
						context.fillRect(0, 0, canvasWidth, canvasHeight);
						context.fillStyle = getRndColor();
						context.fillRect(Math.random() * (canvasWidth - rectWidth), Math.random() * (canvasHeight - rectHeight), rectWidth, rectHeight);
					}
				});`
			}),
			z.comp(Demo, {
				demo: SVG,
				code: `
				// SVG Demo
				function SVG(vNode) {

				}`
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