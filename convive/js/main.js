import { observable, observe, destroy } from './simple-observable-proxy.mjs';

(() => {

	// ------------------------------
	// IS* FUNCTIONS
	// ------------------------------

	const isVisible = el => el && el.offsetParent !== null && window.getComputedStyle(el).display !== 'none';
	const isHidden = el => !isVisible(el);
	const isFunction = x => typeof x === 'function';
	const isRegExp = x => x instanceof RegExp;
	const isString = x => typeof x === 'string';
	const isWindow = x => !!x && x === x.window;
	const isDocument = x => !!x && x.nodeType === 9;
	const isElement = x => !!x && x.nodeType === 1;
	const isNumeric = x => !isNaN(parseFloat(x)) && isFinite(x);
	const isPlainObject = x => {
		if( typeof x !== 'object' || !x ) return false;
		const proto = Object.getPrototypeOf( o );
		return proto === null || proto === Object.prototype;
	}
	const isArray = Array.isArray;

	// ------------------------------
	// COMPONENTS
	// ------------------------------

	const MenuButton = z.compDef({
		draw: vNode => z.elem('button', vNode.attrs.text)
	})

	const CreateMenu = z.compDef({
		draw: vNode => z.elem('div',
				z.comp(MenuButton, {text: 'Preferences'}),
				//z.comp(MenuButton, {text: 'Create'}),
				//z.comp(MenuButton, {text: 'Preferences'}),
				//z.comp(MenuButton, {text: 'Preferences'}),
				//z.comp(MenuButton, {text: 'Preferences'}),
			)
	});

	const Header = z.compDef({
		draw: vNode => z.elem( 'header',
			z.elem('div',
				{
					class: 'primary'
				},
				z.elem('div', 'Convive')
			)
		)
	});

	const Content = z.compDef({
		draw: vNode => z.elem( 'main',
			z.comp( vNode.attrs.comp )
		)
	});

	const Tools = z.compDef({
		draw: vNode => z.elem('div',
			{
				class: 'tools'
			},
			z.elem('div', {
				class: 'tool'
			}),
			z.elem('div', {
				class: 'tool'
			}),
			z.elem('div', {
				class: 'tool'
			}),
			z.elem('div', {
				class: 'tool'
			}),
			z.elem('div', {
				class: 'tool'
			})
		)
	});

	const Page = z.compDef({
		draw: vNode => {
			
		}
	});

	const Canvas = z.compDef({
		draw: vNode => z.elem( 'canvas')
	});

	const Footer = z.compDef({
		draw: vNode => z.elem( 'footer')
	});

	const App = z.compDef({
		draw: vNode => [
			z.comp(Header),
			z.comp(Canvas),
			z.comp(Footer)
		]
	});

	// ------------------------------
	// AJAX
	// ------------------------------

	const Ajax = {
		get: function( url, options )
		{
			// create request
			var xhr = new XMLHttpRequest();
			// assign handlers
			if(options.onload) xhr.onload = function(){
				options.onload(xhr);
			};
			if(options.onerror) xhr.onerror = function(){
				options.onerror(xhr);
			}
			if(options.onabort) xhr.onabort = function(){
				options.onabort(xhr);
			}
			if(options.ontimeout) xhr.ontimeout = function(){
				options.ontimeout(xhr);
			}
			// *** if there is data then format it
			
			// initiate request
			xhr.open(options.method || 'GET', url);
			xhr.send();
		}
	};

	// ------------------------------
	// STATE
	// ------------------------------

	const applicationState = {
		autoplay: false,
		captions: true,
		dialogs: [],
		menu: false,
		plugin: {
			instance: null,
			navigation: [],
		}
	};

	function simpleProxyState(data, redrawFn) {
		const state = observable(data);
		observe(state, redrawFn);
		return {
			state,
			destroy: () => destroy(state)
		};
	};

	// ------------------------------
	// ACTIONS
	// ------------------------------

	const applicationActions = {
		menu: params => {
			applicationState.dialogs.push(z.comp())
		},
		toc: params => {

		},
		search: params => {
			
		},
		history: params => {
			
		}
	};

	// If an action starts with 'e:'
	function resolveAction(action) {
		// event action
		if(action.substr(0,2) === 'e:') {
			const actionInfo = action.slice(2).split('|');
			const actionName = actionInfo.shift();
			if(applicationActions[actionName]) {
				applicationActions[actionName](actionInfo);
			}
		} else if(action.length) {
			// assume we are opening a url
		}
	}

	document.addEventListener('keydown', e => {
		let preventDefault = false;
		if(applicationState.plugin) {
			if(applicationState.plugin.keydown) {
				console.log('keydown should be executed on plugin');
				preventDefault = applicationState.plugin.keydown(e);
			}
		}
		if(preventDefault) e.preventDefault();
	});

	z.draw(document.querySelector('#app'), z.comp(App));
	setTimeout(() => document.querySelector('html').classList.add('loaded'), 1);

})();