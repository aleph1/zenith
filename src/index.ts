// ----------------------------------------
// WORKFLOW
// ----------------------------------------
// Creating vnodes:
// 
// Component lifecycle:
// - fn(vNode) (calls constructor function)
// - beforeDraw (not called until component is drawn once)
// - draw(vNode,children,oldChidren?)
// - afterDraw(vNode)*
// - destroy(vNode)

// ----------------------------------------
// GLOBALS
// ----------------------------------------

declare global {
  // used to specify debug or production build
  var DEBUG: boolean;
}
const DEBUG = window.DEBUG;

// ----------------------------------------
// TYPE DEFINITIONS
// ----------------------------------------

// definition types and values
const sealedEmptyObject: object = Object.seal({});

import {
  DefTypeComp,
  DEF_TYPE_COMP,
  VNodeTypeNone,
  VNodeTypeElem,
  VNodeTypeText,
  VNodeTypeComp,
  VNodeTypeHTML,
  VNODE_TYPE_NONE,
  VNODE_TYPE_ELEM,
  VNODE_TYPE_TEXT,
  VNODE_TYPE_COMP,
  VNODE_TYPE_HTML,
  VNodeElem,
  VNodeText,
  VNodeComp,
  VNodeHTML,
  VNodeAny,
  VNodeAnyOrArray,
  VNodeArray,
  VNodeFlatArray,
  VNodeElemAttributes,
  VNodeCompAttributes,
  VNodeCompDefinition,
  //VNodeCompInstance,
  VNodeContainer
} from './vnode.defs';

// ----------------------------------------
// CONSTANTS
// ----------------------------------------

const wrappedNodes = new Map();
const elementNamespaces = {
  math: 'http://www.w3.org/1998/Math/MathML',
  svg: 'http://www.w3.org/2000/svg'
};
const namespacedElements = Object.keys(elementNamespaces).join(',');

// ----------------------------------------
// VNODES
// ----------------------------------------
// All of the following functions are
// designed to create one of more vnodes.
// ----------------------------------------

function elem(selector: string): VNodeElem;
function elem(selector: string, attrs:VNodeElemAttributes, ...vNodeChildren:VNodeArray): VNodeElem;
function elem(selector: string, ...vNodeChildren:VNodeArray): VNodeElem;
function elem(selector: string): VNodeElem {
  const children:VNodeArray = [];
  let start = 1;
  let attrs = arguments[1];

  // if no passed attributes
  if(attrs == null || typeof attrs !== 'object' || attrs.tag != null || Array.isArray(attrs)) {
    attrs = sealedEmptyObject;
  // otherwise, copy attributes
  } else {
    attrs = Object.assign( {}, attrs );
    start++;
  }
  while( start < arguments.length ) {
    const child:VNodeAny = arguments[start++];
    children.push( typeof child === 'object' ? child : text( child ) );
  }
  return {
    type: VNODE_TYPE_ELEM,
    tag: selector,
    attrs,
    children: normalizeChildren(children)
  }
}

function text(value: string): VNodeText {
  return {
    type: VNODE_TYPE_TEXT,
    tag: value && value.toString() || '',
  }
}

//function compDef(inputDef: VNodeCompDefinition, extendDef?: VNodeCompDefinition): VNodeCompDefinition {
function compDef(inputDef: VNodeCompDefinition): VNodeCompDefinition {
  if(DEBUG) {
    if(typeof inputDef.draw !== 'function') throw new Error('component requires draw function');
    //if(inputDef.keep === true && inputDef.update) throw new Error('components with keep: true will never update');
  }
  const outputDef:VNodeCompDefinition = Object.assign({}, inputDef);

  //outputDef.type = DEF_TYPE_COMP;
  //// only allow overrides on state
  //if(extendDef) {
  //  for(const prop in outputDef) {
  //    if(typeof outputDef[prop] === 'function' && typeof extendDef[prop] === 'function'){
  //      const fn = outputDef[prop];
  //      outputDef[prop] = instance => {
  //        extendDef[prop](instance);
  //        fn(instance);
  //      }
  //    }
  //  }
  //}
  return outputDef;
}

// A component should include:
// - optional state (ideally reactive)
// - lifecycle hooks
//   - create: called once upon creation
//   - draw: called whenever state is changed or component is redrawn due to parent vnodes being redrawn
//   - destroy: called once upon destruction
function comp(componentDefinition: VNodeCompDefinition, attrs?: VNodeCompAttributes): VNodeComp {
  return {
    type: VNODE_TYPE_COMP,
    tag: componentDefinition,
    attrs: attrs || sealedEmptyObject
  }
}

function html(value: string): VNodeHTML {
  // create a fragment from the passed string
  const dom = new DocumentFragment();
  // create an HTML container element 
  const containerEl = document.createElement('div');
  // copy the value to the inner html of the container elements
  containerEl.innerHTML = value;
  // iterate through container element while it has a firstChild
  while( containerEl.firstChild ) {
    // copy firstChild from container element to fragment
    dom.appendChild( containerEl.firstChild );
  }
  // Very basic injection prevention by removing script tags.
  // If you want to disable this then create you own function,
  // or if you want better protection use a dedicated lib.
  if(value.indexOf('<script') !== -1) {
    let stack = Array.from(dom.children);
    while (stack.length > 0) {
      const node = stack.pop();
      if(node.nodeName.toLowerCase() === 'script') {
        node.remove();
      } else {
        stack = stack.concat(Array.from(node.children));
      }
    }
  }
  return {
    type: VNODE_TYPE_HTML,
    tag: '<',
    dom,
    domLength: dom.children.length
  };
}

function wrapDom(dom:Element): VNodeElem {
  if(DEBUG) {
    // why do we need to cast dom as any to not get a Typescript compile error?
    if(<any> dom instanceof Element) throw new Error('wrap requires DOM Element');
  }
  return wrappedNodes.get(dom) || wrappedNodes.set(dom, Object.assign(elem(dom.nodeName.toLowerCase()), {
    dom: dom
  })).get(dom);
}

// ----------------------------------------
// RENDERING
// ----------------------------------------

function emptyDom(dom:Element): Element {
  while(dom.lastChild) dom.removeChild(dom.lastChild);
  return dom;
}

function getElementNamespace(dom:Element | undefined): string | undefined {
  return elementNamespaces[dom && dom.nodeName.toLowerCase()];
}

function getNamespace(vNode:VNodeElem, ns:string | undefined): string | undefined {
  return vNode.attrs && vNode.attrs.xmlns || elementNamespaces[vNode.tag] || ns;
}

function getElement(name:string, ns?:string, is?:string): Element {
  // *** explore whether cloning elements is faster
  return ns ?
    document.createElementNS( ns, name, is ? {is: is} : null ) :
    document.createElement( name, is ? {is: is} : null );
}

function normalizeChildren(children:VNodeArray): VNodeFlatArray {
  return children.flat(Infinity) as VNodeFlatArray;
}

function renderDrawable(vNode:VNodeAny, drawFn:Function, oldChildren?:VNodeFlatArray): VNodeFlatArray {
  //console.log('renderDrawable()');
  const children:VNodeAnyOrArray = drawFn(vNode, oldChildren);
  return Array.isArray(children) ? normalizeChildren(children) : [children];
}

function createElement(parent:VNodeAny, vNode:VNodeElem, ns?:string) {
  ns = getNamespace(vNode, ns);
  const dom: Element = getElement(vNode.tag, ns, vNode.attrs.is);
  vNode.dom = dom;
  // Setting on* handlers using setAttribute does not work,
  // benchmark to compare various approaches:
  // https://www.measurethat.net/Benchmarks/Show/19171/0/compare-detecting-object-keys-starting-with-on
  // Array access performs better in most current browsers,
  // however, it might be worth considering a couple of other
  // approaches:
  // - nested object: attrs = { on:{ click(){}, etc. } };
  // - object containing all on* attributes that has a property
  //   added when a new match is made
  for(const attr in vNode.attrs) {
    if(attr[0] === 'o' && attr[1] === 'n') {
      dom[attr] = vNode.attrs[attr];
    } else {
      dom.setAttribute(attr, vNode.attrs[attr]);
    }
  }
  diffVNodeChildren(vNode as VNodeContainer, vNode.children, null, ns);
}

function createComponent(parent:VNodeAny, vNode:VNodeComp, ns:string) {
  // we check
  if(vNode.tag.state !== false) {
    vNode.state = {};
  }
  vNode.redraw = () => updateComponent(parent, vNode);
  //const instance:VNodeCompInstance = {
  //  attrs: vNode.attrs,
  //  redraw: () => updateComponent(parent, vNode),
  //  state: vNode.tag.state !== false ? {} : undefined
  //};
  // ensure this component isn't stateless
  if(vNode.tag.init) vNode.tag.init(vNode);
  // we only allow for state listening after init
  if(typeof vNode.tag.state === 'function' ) {
    // allows for 3rd party integration, passes vNode state and redraw function
    vNode.stateDestructor = vNode.tag.state(vNode.state, vNode.redraw);
  }
  vNode.dom = document.createDocumentFragment();
  diffVNodeChildren(vNode, renderDrawable(vNode, vNode.tag.draw), null, ns);
}

function updateComponent(parent:VNodeAny, vNode:VNodeComp) {
  if(vNode.tag.tick) vNode.tag.tick(vNode);
  if(!vNode.tag.autoDraw) diffVNodeChildren(vNode, renderDrawable(vNode, vNode.tag.draw, vNode.children), vNode.children);
  if(vNode.tag.drawn) vNode.tag.drawn(vNode);
}

// *** partial implementation
function destroyComponent(parent:VNodeAny, vNode:VNodeComp) {
  // in cases of component, destroy them
  if(vNode.tag.destroy) vNode.tag.destroy(vNode);
}

// Partial implementation, thinking this should become our diff
function diffVNode(parent: VNodeAny, vNode: VNodeAny, vNodeOld?: VNodeAny, ns?: string) {
  //console.log('diffVNode()');
  // *** do we need a different check here?
  vNode.parent = parent;
  if(vNodeOld != null) {
    //console.log('comparing vNodes');
    const vNodeType = vNode.type;
    const vNodeOldType = vNodeOld.type;
    if(vNodeType === vNodeOldType && (vNode.tag === vNodeOld.tag || vNodeType === VNODE_TYPE_TEXT)) {
      vNode.dom = vNodeOld.dom;
      switch(vNodeType) {
        case VNODE_TYPE_ELEM:
          vNode = vNode as VNodeElem;
          // *** do we need to diff the old vNode's children?
          diffVNodeChildren(vNode, vNode.children, vNodeOld.children);
          break;
        case VNODE_TYPE_COMP:
          vNode = vNode as VNodeComp;
          vNodeOld = vNodeOld as VNodeComp;
          updateComponent(parent, vNode);  
          break;
        case VNODE_TYPE_TEXT:
          (vNode.dom as Text).data  = vNode.tag;
          break;
      }
    } else {
      // handle components
      if(vNodeOldType === VNODE_TYPE_COMP) {
        destroyComponent(parent, vNodeOld as VNodeComp);
      }
      createVNode(parent, vNode, ns);
    }
    // *** compare tag
    //if(vNode == vNodeOld || vNode)
  } else {
    createVNode(parent, vNode, ns);
  }
}

function diffVNodeChildren(vNode: VNodeAny, children:VNodeFlatArray, childrenOld?:VNodeFlatArray, ns?:string) {
  //console.log('diffVNodeChildren()');
  // we need to do a diff
  if(childrenOld) {
    const childrenLength = children.length;
    const childrenOldLength = childrenOld.length;
    if(childrenLength < childrenOldLength) {
      removeVNodes(vNode, childrenOld, childrenLength, childrenOldLength);
    }
    for(let i = 0; i < childrenLength; i++ ) {
      diffVNode(vNode, children[i], childrenOld[i], ns);
    }
  // or we don't
  } else {
    createVNodes(vNode, children, 0, children.length, ns);
  }
  vNode.children = children;
  // *** this works but it's not great
  //if( children === childrenOld || children == null && childrenOld == null) return;
  //const childrenLength = children.length;
  //const childrenOldLength = childrenOld && childrenOld.length || 0;
  //if (childrenOldLength === 0) createVNodes(vNode, children, 0, childrenLength);
  //else if (childrenLength === 0) removeVNodes(vNode, childrenOld, 0, childrenOldLength);
  //else {
  //  // *** eventually implement keys and diffing
  //  removeVNodes(vNode, childrenOld, 0, childrenOldLength);
  //  createVNodes(vNode, children, 0, childrenLength);
  //}
}

function createVNodes(parent: VNodeAny, children: VNodeFlatArray, start: number, end: number, ns:string) {
  //console.log('createVNodes()');
  while(start < end) {
    createVNode(parent, children[start++], ns);
  }
  //parent = parent as VNodeContainer;
  //parent.children = children;
}

// *** if only components will be updated this function isn't necessary
//function updateVNode(parent: VNodeAny, vNode: VNodeAny) {
//  switch(vNode.type) {
//    case VNODE_TYPE_COMP:
//      vNode = vNode as VNodeComp;
//      updateComponent(parent, vNode);
//      break;
//  }
//}

function createVNode(parent: VNodeAny, vNode: VNodeAny, ns: string) {
  //console.log('createVNode()');
  switch(vNode.type) {
    case VNODE_TYPE_ELEM:
      vNode = vNode as VNodeElem;
      createElement(parent, vNode as VNodeElem, ns);
      break;
    case VNODE_TYPE_COMP:
      vNode = vNode as VNodeComp;
      createComponent(parent, vNode, ns);
      break;
    case VNODE_TYPE_TEXT:
      vNode = vNode as VNodeText;
      vNode.dom = document.createTextNode(vNode.tag);
      break;
  }
  parent.dom.appendChild(vNode.dom);
}

function removeVNodes(parent: VNodeAny, children: VNodeFlatArray, start: number, end: number) {
  //console.log('removeVNodes()');
  while(start < end) {
    removeVNode(parent, children[start++]);
  }
}

function removeVNode(parent: VNodeAny, vNode: VNodeAny) {
  //console.log('removeVNode()');
  //console.log(vNode);
  if(typeof vNode.tag === 'string') {
    vNode = vNode as VNodeElem;
    vNode.dom && vNode.dom.remove();
  } else {
    vNode = vNode as VNodeContainer;
    removeVNodes(vNode, vNode.children, 0, vNode.children.length);
  }
}

function tick() {
  // /const now = Date.now();
  wrappedNodes.forEach(vNode => tickVNode(vNode));
  window.requestAnimationFrame(tick);
  //console.log('tick took : ' + (Date.now() - now));
}

function tickVNode(vNode) {
  switch(vNode.type) {
    case VNODE_TYPE_COMP:
      if(vNode.tag.tick) vNode.tag.tick(vNode);
    case VNODE_TYPE_ELEM:
      vNode.children.forEach(childVNode => tickVNode(childVNode));
  }
}

tick();

// ----------------------------------------
// EXPORT
// ----------------------------------------

export default {
  elem,
  text,
  comp,
  html,
  compDef,
  draw(dom:Element, vNode:VNodeAny) {
    const wrapper = wrapDom(emptyDom(dom));
    diffVNode(wrapper, vNode, null, getElementNamespace(dom.closest(namespacedElements)));
    wrapper.children = [vNode];
  }
};