/*! Zenith v1.0.0-alpha.4 | MIT License | © 2022 Aleph1 Technologies Inc */
const z = (function () {
    'use strict';

    // ----------------------------------------
    //import {
    //  grow,
    //  pools,
    //  poolSizes
    //} from './pool';
    // ----------------------------------------
    // CONSTANTS
    // ----------------------------------------
    //let drawMode = DrawModes.raf;
    let tickCount = 0;
    //let keepCount = 0;
    const mountedNodes = new Map();
    // for createElementNS calls
    const ELEMENT_NAMESPACES = Object.freeze({
        math: 'http://www.w3.org/1998/Math/MathML',
        svg: 'http://www.w3.org/2000/svg'
    });
    // for finding namespace for createElement(NS) calls
    const ELEMENT_NAMESPACES_QUERY = 'math,svg';
    const ELEMENT_CLONERS = {};
    // used on elements with no attrs to avoid creating new objects
    const FROZEN_EMPTY_OBJECT = Object.freeze({});
    // used to queue component updates when drawMode is DRAW_MODE_RAF
    const redrawableUpdateQueue = new Map();
    const tickQueue = new Map();
    //const keepVNodes: Map<number, VNodeAny> = new Map();
    const normalizeChildren = (children) => {
        const normalizedChildren = children.flat(Infinity);
        const firstChild = normalizedChildren[0];
        const isKeyed = firstChild != null && typeof firstChild !== 'boolean' && (firstChild.type === 2 /* elem */ || firstChild.type === 4 /* comp */) && 'key' in firstChild.attrs;
        for (const [index, child] of normalizedChildren.entries()) {
            // convert all falsy children to null
            // if (!child || child as unknown as boolean === true) {
            if (child == null || typeof child === 'boolean') {
                normalizedChildren[index] = null;
            }
            else {
                if ((child.type === 2 /* elem */ || child.type === 4 /* comp */) && isKeyed !== 'key' in child.attrs)
                    throw new Error('children must be keyed or keyless');
            }
        }
        return normalizedChildren;
    };
    const getClosestElementNamespace = (dom) => {
        return dom.closest(ELEMENT_NAMESPACES[(dom.closest(ELEMENT_NAMESPACES_QUERY) || dom).nodeName.toLowerCase()]);
    };
    const getNamespace = (vNode, ns) => {
        return vNode.attrs && vNode.attrs.xmlns || ELEMENT_NAMESPACES[vNode.tag] || ns;
    };
    // cloning elements is faster than creating them in most browsers:
    // https://www.measurethat.net/Benchmarks/Show/25003/0/create-versus-clone-element
    const getElement = (name, ns, is) => {
        const fullName = name + ':' + (ns || '') + ':' + (is || '');
        return (ELEMENT_CLONERS[fullName] || (ELEMENT_CLONERS[fullName] = ns ? document.createElementNS(ns, name, is ? { is } : null) : document.createElement(name, is ? { is } : null))).cloneNode();
    };
    //const getNextSibling = (vNodes: VNodeFlatArray, start: number, end: number, nextSibling?: Element): Element => {
    //  while(start < end) {
    //    if (vNodes[start] != null && vNodes[start].dom != null) return vNodes[start].dom as Element;
    //    start++;
    //  }
    //  return nextSibling;
    //}
    const updateChild = (parentVNode, newVNode, oldVNode, index, ns) => {
        parentVNode.children[index] = newVNode;
        if (oldVNode != null && oldVNode.dom != null) {
            const newVNodeType = newVNode.type;
            const oldVNodeType = oldVNode.type;
            //newVNode.parent = parentVNode;
            if (newVNodeType === oldVNodeType) {
                // *** should we reenable .diff check?
                //if ((newVNode.attrs || FROZEN_EMPTY_OBJECT).diff !== false) {
                switch (newVNodeType) {
                    case 2 /* elem */:
                        if (newVNode.tag !== oldVNode.tag) {
                            const oldDomIndex = parentVNode.type === 4 /* comp */ ? parentVNode.doms.indexOf(oldVNode.dom) : -1;
                            createVNode(parentVNode, newVNode, ns);
                            oldVNode.dom.replaceWith(newVNode.dom);
                            removeVNode(parentVNode, oldVNode);
                            if (oldDomIndex !== -1)
                                parentVNode.doms[oldDomIndex] = newVNode.dom;
                        }
                        else {
                            newVNode.dom = oldVNode.dom;
                            updateElement(parentVNode, newVNode, oldVNode, ns);
                        }
                        break;
                    case 3 /* text */:
                        newVNode.dom = oldVNode.dom;
                        if (newVNode.tag !== oldVNode.tag) {
                            newVNode.dom.replaceWith(newVNode.dom = document.createTextNode(newVNode.tag));
                        }
                        break;
                    case 4 /* comp */:
                        if (newVNode.tag !== oldVNode.tag) {
                            removeVNode(parentVNode, oldVNode);
                            createVNode(parentVNode, newVNode, ns);
                        }
                        else {
                            newVNode.dom = oldVNode.dom;
                            newVNode.doms = oldVNode.doms;
                            newVNode.children = oldVNode.children;
                            updateComponent(parentVNode, newVNode, ns);
                        }
                        break;
                    case 5 /* html */:
                        if (newVNode.tag !== oldVNode.tag) {
                            removeVNode(parentVNode, oldVNode);
                            createVNode(parentVNode, newVNode, ns);
                        }
                        else {
                            newVNode.dom = oldVNode.dom;
                            newVNode.doms = oldVNode.doms;
                        }
                }
                //}
            }
            else {
                removeVNode(parentVNode, oldVNode);
                createVNode(parentVNode, newVNode, ns);
            }
        }
        else {
            createVNode(parentVNode, newVNode, ns);
        }
    };
    const updateChildren = (parentNode, newChildren, oldChildren, ns) => {
        const newChildrenLength = newChildren.length;
        // *** in theory updateChildren is always called with an oldChildren array,
        // but we should make sure of this
        //const oldChildrenLength = oldChildren == null ? 0 : oldChildren.length;
        const oldChildrenLength = oldChildren.length;
        if (newChildrenLength > 0) {
            if (oldChildrenLength > 0) {
                let oldChild;
                const doms = [];
                //const isNewKeyed = newChildren[0] && newChildren[0].attrs && 'key' in newChildren[0].attrs && newChildren[0].attrs.key != null;
                const isNewKeyed = newChildren[0] && newChildren[0].attrs && newChildren[0].attrs.key != null;
                //const isOldKeyed = oldChildren[0] && oldChildren[0].attrs && 'key' in oldChildren[0].attrs && oldChildren[0].attrs.key != null;
                const isOldKeyed = oldChildren[0] && oldChildren[0].attrs && oldChildren[0].attrs.key != null;
                // keyed diff
                // 1) get IDs for new children
                // 2) get IDs for old children
                // 3) get IDs for old children
                // 4) iterate through new children IDs and ***
                if (isNewKeyed && isOldKeyed) {
                    //const tempDom = getElement(parentDom.nodeName, ns);
                    const newChildrenByKey = {};
                    const oldChildrenByKey = {};
                    //const oldKeyOrder = [];
                    //const newKeyOrder = [];
                    //const lisPositions = [0];
                    //let lisIndex = 0;
                    // get keys for all new children
                    //let now = performance.now();
                    for (const child of newChildren) {
                        //newChildrenByKey[child.attrs.key] = child;
                        newChildrenByKey[child.attrs.key] = true;
                    }
                    // get keys for all old children
                    for (const child of oldChildren) {
                        const key = child.attrs.key;
                        // when old key is still in use, keep the old node
                        if (newChildrenByKey[key]) {
                            oldChildrenByKey[key] = child;
                            //oldKeyOrder.push(key);
                            // otherwise, nullify the node and delete its DOM
                        }
                        else {
                            // removeNode returns null
                            removeVNode(parentNode, child);
                            //oldKeyOrder.push(-1);
                            delete oldChildrenByKey[key];
                        }
                    }
                    // iterate through new children and diff with old children
                    let index = 0;
                    for (const child of newChildren) {
                        if (child != null) {
                            //child.index = index;
                            updateChild(parentNode, child, oldChildrenByKey[child.attrs.key], index, ns);
                            doms.push(child.dom);
                            child.dom.remove();
                            //if (Array.isArray(child.dom)) {
                            //  for(const index in child.dom) {
                            //    doms.push(child.dom[index]);
                            //    child.dom[index].remove();
                            //  }
                            //} else {
                            //  doms.push(child.dom);
                            //  child.dom.remove();
                            //}
                        }
                        index++;
                    }
                    insertElements(parentNode.dom, doms);
                    // non-keyed diff
                    // 1) remove nodes that have an index greater than newChildrenLength
                    // 2) loop through the oldChildren and store references to their DOM
                    // 3) 
                }
                else {
                    const reusedDoms = new Set();
                    //if(oldChildrenLength > newChildrenLength) {
                    // iterate through old nodes and keep any that have been destroyed, but deferred
                    for (let i = newChildrenLength; i < oldChildrenLength; i++) {
                        oldChild = oldChildren[i];
                        removeVNode(parentNode, oldChild);
                        // if old node is in the process of being removed, keep it in the tree
                        if (oldChild.removing === true) {
                            oldChild.parent = parentNode;
                            newChildren[i] = oldChild;
                        }
                    }
                    //}
                    for (let i = 0; i < newChildrenLength; i++) {
                        oldChild = oldChildren[i];
                        if (newChildren[i] == null && oldChild != null) {
                            removeVNode(parentNode, oldChild);
                            if (oldChild.removing === true) {
                                oldChild.parent = parentNode;
                                newChildren[i] = oldChild;
                                newChildren[i] && reusedDoms.add(newChildren[i].dom);
                            }
                        }
                        else if (oldChild == null || oldChild.dom == null || reusedDoms.has(oldChild.dom)) {
                            createVNode(parentNode, newChildren[i], ns);
                            newChildren[i] && reusedDoms.add(newChildren[i].dom);
                        }
                        else if (oldChild.removing == null) {
                            updateChild(parentNode, newChildren[i], oldChild, i, ns);
                            newChildren[i] && reusedDoms.add(newChildren[i].dom);
                        }
                    }
                }
            }
            else {
                createVNodes(parentNode, newChildren, 0, newChildrenLength, ns);
            }
        }
        else {
            removeVNodes(parentNode, oldChildren, 0, oldChildrenLength);
        }
        parentNode.children = newChildren;
    };
    const createVNodes = (parentNode, children, start, end, ns) => {
        while (start < end) {
            createVNode(parentNode, children[start++], ns);
        }
    };
    const insertElements = (parentDom, elements) => {
        for (const element of elements) {
            if (element) {
                parentDom.appendChild(element);
            }
        }
    };
    const createVNode = (parentNode, vNode, ns) => {
        //if(typeof vNode === 'number') vNode = keepVNodes.get(vNode);
        if (vNode == null)
            return;
        vNode.parent = parentNode;
        //let elements;
        switch (vNode.type) {
            case 2 /* elem */:
                createElement(parentNode, vNode, ns);
                break;
            case 3 /* text */:
                vNode = vNode;
                vNode.dom = document.createTextNode(vNode.tag);
                insertElements(parentNode.dom, [vNode.dom]);
                break;
            case 4 /* comp */:
                createComponent(parentNode, vNode, ns);
                break;
            case 5 /* html */:
                createHTML(parentNode, vNode, ns);
                break;
        }
    };
    const createHTML = (parentNode, vNode, ns) => {
        const tmpDom = getElement(parentNode.dom.nodeName, ns);
        tmpDom.innerHTML = vNode.tag;
        vNode.doms = [...tmpDom.childNodes];
        vNode.dom = vNode.doms[0];
        insertElements(parentNode.dom, vNode.doms);
    };
    const setDOMAttribute = (vNode, attr, value, oldValue, ns) => {
        if (value == null || attr === 'type' || attr === 'key' || attr === 'is' || attr === 'ns')
            return;
        if (attr === 'class') {
            vNode.dom.setAttribute(attr, Array.isArray(value) ? value.join(' ') : value);
        }
        else if (attr === 'style') {
            if (typeof value === 'string') {
                vNode.dom.setAttribute(attr, value);
            }
            else {
                for (const style in value) {
                    vNode.dom.style[style] = value[style];
                }
            }
        }
        else if (attr === 'value') {
            if (vNode.tag === 'input' || vNode.tag === 'option' || vNode.tag === 'textarea')
                vNode.dom.value = value + '';
        }
        else if (typeof value === 'boolean') {
            if (value === true) {
                vNode.dom.setAttribute(attr, attr);
            }
            else {
                vNode.dom.removeAttribute(attr);
            }
            // Setting "on*" handlers using setAttribute does not work,
            // so we need a conditional to detect those attrs
            // Benchmarking the following shows that array access is faster
            // https://www.measurethat.net/Benchmarks/Show/26286/0/strings-starts-with-using-startswith-array-access-slice
            // - String.substr
            // - String.startsWith
            // - attr[0] === 'o' && attr[1] === 'n'
            // - nested object: attrs = { on:{ click(){}, etc. } };
        }
        else if (attr[0] === 'o' && attr[1] === 'n') {
            vNode.events[attr] = vNode.dom[attr] = value;
        }
        else {
            vNode.dom.setAttribute(attr, value);
        }
    };
    const createElement = (parentNode, vNode, ns) => {
        vNode.events = {};
        vNode.dom = getElement(vNode.tag, ns = getNamespace(vNode, vNode.attrs.ns || ns), vNode.attrs.is);
        if (vNode.attrs.tick)
            tickQueue.set(vNode, vNode.attrs.tick);
        // ensure <input> has a type before doing additional attribute manipulation
        if (vNode.tag === 'input' && vNode.attrs.type != null)
            vNode.dom.setAttribute('type', vNode.attrs.type);
        // iterate attributes
        for (const attr in vNode.attrs) {
            setDOMAttribute(vNode, attr, vNode.attrs[attr]);
        }
        createVNodes(vNode, vNode.children, 0, vNode.children.length, ns);
        insertElements(parentNode.dom, [vNode.dom]);
    };
    const updateElement = (parentNode, newVNode, oldVNode, ns) => {
        newVNode.events = oldVNode.events;
        //if (newVNode.attrs === oldVNode.attrs && newVNode.attrs !== FROZEN_EMPTY_OBJECT) throw new Error('must not reuse attrs object across calls to z.elem()');
        // input type must be set before other attributes
        if (newVNode.tag === 'input' && newVNode.attrs.type != null)
            newVNode.dom.setAttribute('type', newVNode.attrs.type);
        // remove old attrs
        for (const attr in oldVNode.attrs) {
            if (attr[0] === 'o' && attr[1] === 'n') {
                newVNode.events[attr] = newVNode.dom[attr] = null;
            }
            else if (attr !== 'type') {
                newVNode.dom.removeAttribute(attr);
            }
        }
        // set new attributes
        for (const attr in newVNode.attrs) {
            setDOMAttribute(newVNode, attr, newVNode.attrs[attr], oldVNode.attrs[attr]);
        }
        updateChildren(newVNode, newVNode.children, oldVNode.children, ns);
    };
    const tempUpdateComponent = (parentNode, vNode) => {
        vNode.children;
        updateComponent(parentNode, vNode);
        let reinsert = vNode.doms.length > 0;
        for (const dom of vNode.doms) {
            if (dom.parentNode) {
                reinsert = false;
                break;
            }
        }
        if (reinsert) {
            vNode.doms = [...vNode.dom.childNodes];
            vNode.dom = vNode.doms[0];
            insertElements(parentNode.dom, vNode.doms);
        }
    };
    const redrawComponent = (vNode, immediate) => {
        if (immediate)
            tempUpdateComponent(vNode.parent, vNode);
        else
            deferUpdateRedrawable(vNode.parent, vNode);
    };
    //const redrawFunction = (vNode: VNodeFunc, immediate?: boolean): void => {
    //  if (immediate) updateFunction(vNode.parent, vNode);
    //  else deferUpdateRedrawable(vNode.parent, vNode);
    //};
    const createComponent = (parentNode, vNode, ns) => {
        if (vNode.tag.init)
            vNode.tag.init(vNode);
        vNode.dom = getElement(parentNode.dom.nodeName, ns);
        vNode.children = drawDrawable(vNode, vNode.tag.draw);
        createVNodes(vNode, vNode.children, 0, vNode.children.length, ns);
        vNode.doms = [...vNode.dom.childNodes];
        vNode.dom = vNode.doms[0];
        insertElements(parentNode.dom, vNode.doms);
        if (vNode.tag.tick)
            tickQueue.set(vNode, vNode.tag.tick);
        if (vNode.tag.drawn)
            vNode.tag.drawn(vNode);
    };
    const updateComponent = (parentNode, vNode, ns) => {
        //if (vNode.tag.drawOnce != null) return;
        vNode.dom = getElement(parentNode.dom.nodeName, ns);
        updateChildren(vNode, drawDrawable(vNode, vNode.tag.draw, vNode.children), vNode.children, ns || vNode.dom.namespaceURI);
        //vNode.doms = [...vNode.dom.childNodes];
        //vNode.dom = vNode.doms[0] as Element;
        if (vNode.tag.drawn)
            vNode.tag.drawn(vNode);
    };
    const removeVNodes = (parentNode, children, start, end, noBeforeDestroy) => {
        while (start < end) {
            removeVNode(parentNode, children[start++], noBeforeDestroy);
        }
    };
    const destroyVNode = (vNode) => {
        if (vNode.type === 4 /* comp */) {
            if (vNode.tag.destroy)
                vNode.tag.destroy(vNode);
            vNode.removing = null;
        }
        if (vNode.children) {
            removeVNodes(vNode, vNode.children, 0, vNode.children.length, true);
            vNode.children.length = 0;
        }
        else if (vNode.dom && vNode.dom.remove)
            vNode.dom.remove();
        if (vNode.doms) {
            for (const childDom of vNode.doms)
                childDom.remove();
        }
        else if (vNode.dom && vNode.dom.remove)
            vNode.dom.remove();
        delete vNode.dom;
        vNode.parent = null;
    };
    const removeVNode = (parentNode, vNode, immediate) => {
        if (vNode == null)
            return;
        switch (vNode.type) {
            case 2 /* elem */:
                if (vNode.attrs.tick)
                    tickQueue.delete(vNode);
                break;
            case 4 /* comp */:
                if (vNode.tag.tick)
                    tickQueue.delete(vNode);
                if (vNode.removing === true) {
                    return;
                }
                else if (immediate !== true && typeof vNode.tag.remove === 'function') {
                    const delayed = vNode.tag.remove(vNode);
                    if (delayed != null && typeof delayed.then === 'function') {
                        vNode.removing = true;
                        const destroy = () => {
                            vNode.removing = false;
                            vNode.parent.children.splice(vNode.parent.children.indexOf(vNode), 1);
                            destroyVNode(vNode);
                        };
                        delayed.then(destroy, destroy);
                        return;
                    }
                    //if(typeof deferred === 'number' && isFinite(deferred)) {
                    //  vNode.removing = true;
                    //  setTimeout(() => {
                    //    vNode.removing = false;
                    //    vNode.parent.children.splice(vNode.parent.children.indexOf(vNode), 1);
                    //    destroyVNode(vNode as VNodeComp);
                    //  }, deferred);
                    //  remove = false;
                    //}
                }
                break;
            case 5 /* html */:
                // *** fix this as TypeScript insists el can be a String
                for (const index in vNode.doms) {
                    vNode.doms[index].remove();
                }
                break;
        }
        destroyVNode(vNode);
    };
    const drawDrawable = (vNode, drawFn, oldChildren) => {
        const children = drawFn(vNode, oldChildren);
        return normalizeChildren(Array.isArray(children) ? children : [children]);
    };
    // *** unused
    //const emptyDom = (dom: Element): void => {
    //  while(dom.lastChild) dom.lastChild.remove();
    //};
    // ----------------------------------------
    // VNODES
    // ----------------------------------------
    // All of the following functions are
    // designed to create one or more vnodes.
    // ----------------------------------------
    const text = (value) => {
        const type = typeof value;
        return {
            type: 3 /* text */,
            tag: type === 'string' || type === 'number' || type === 'bigint' ? value + '' : ''
        };
    };
    const elem = (selector, ...args) => {
        const children = [];
        let index = 0;
        let attrs = args[index];
        // if no passed attributes
        if (!attrs || typeof attrs !== 'object' || attrs.tag != null || Array.isArray(attrs)) {
            attrs = FROZEN_EMPTY_OBJECT;
            // otherwise, copy attributes
        }
        else {
            attrs = Object.freeze(Object.assign({}, attrs));
            index++;
        }
        while (index < args.length) {
            const child = args[index++];
            children.push(child != null && typeof child === 'object' ? child : null);
        }
        // *** consider implementing object pooling
        return {
            type: 2 /* elem */,
            tag: selector,
            attrs,
            children: normalizeChildren(children),
        };
    };
    const deferUpdateRedrawable = (parentNode, vNode) => redrawableUpdateQueue.set(vNode, [parentNode]);
    //function compDef(inputDef: VNodeCompDefinition, extendDef?: VNodeCompDefinition): VNodeCompDefinition {
    const compDef = (inputDef) => {
        if (typeof inputDef.draw !== 'function')
            throw new Error('compDef requires draw function');
        return Object.assign({}, inputDef, { type: 1 /* compDef */ });
    };
    // A component should include:
    // - optional state (ideally reactive)
    // - lifecycle hooks
    //   - create: called once upon creation
    //   - draw: called whenever state is changed or component is redrawn due to parent vnodes being redrawn
    //   - destroy: called once upon destruction
    const comp = (componentDefinition, attrs) => {
        const vNode = {
            type: 4 /* comp */,
            tag: componentDefinition,
            redraw: now => redrawComponent(vNode, now),
            attrs: attrs ? Object.freeze(attrs) : FROZEN_EMPTY_OBJECT
        };
        return vNode;
    };
    const html = (value) => {
        const type = typeof value;
        return {
            type: 5 /* html */,
            tag: type === 'string' || type === 'number' || type === 'bigint' ? value + '' : '',
        };
    };
    const mount = (dom, vNodeAnyOrArray) => {
        if (dom == null)
            throw new Error('dom must be an Element');
        // first check to see if DOM is a child node of a mounted node
        let ancestor = dom.parentNode;
        while (ancestor) {
            if (mountedNodes.get(ancestor))
                throw new Error('dom ancestor is already drawn');
            ancestor = ancestor.parentNode;
        }
        // we wrap the node to be able to get its previous vNode children
        const mountedNode = mountedNodes.get(dom) || mountedNodes.set(dom, Object.assign(elem(dom.nodeName.toLowerCase()), {
            dom: dom
        })).get(dom);
        if (vNodeAnyOrArray == null || vNodeAnyOrArray.length === 0) {
            removeVNodes(mountedNode, mountedNode.children, 0, mountedNode.children.length);
            mountedNode.children.length = 0;
        }
        else {
            updateChildren(mountedNode, normalizeChildren(Array.isArray(vNodeAnyOrArray) ? vNodeAnyOrArray : [vNodeAnyOrArray]), mountedNode.children, getClosestElementNamespace(dom));
        }
        return mountedNode;
    };
    const tick = () => {
        tickCount++;
        for (const [vNode, value] of redrawableUpdateQueue) {
            if (vNode.type === 4 /* comp */)
                tempUpdateComponent(value[0], vNode);
        }
        redrawableUpdateQueue.clear();
        for (const [vNode, tick] of tickQueue) {
            tick(vNode, tickCount);
        }
        // *** refactor if we end up caching other vNode types
        //if (pools[VNodeTypes.elem].length > poolSizes[VNodeTypes.elem]) pools[VNodeTypes.elem].length = poolSizes[VNodeTypes.elem];
        requestAnimationFrame(tick);
    };
    tick();
    // ----------------------------------------
    // EXPORT
    // ----------------------------------------
    const index = {
        elem,
        text,
        comp,
        html,
        //func,
        compDef,
        mount,
        //diff: {
        //  none: 0,
        //  self: 1,
        //  children: 2,
        //},
        //grow,
        type: Object.freeze({
            none: 0 /* none */,
            compDef: 1 /* compDef */,
            elem: 2 /* elem */,
            text: 3 /* text */,
            comp: 4 /* comp */,
            html: 5 /* html */,
        }),
        ns: ELEMENT_NAMESPACES
    };

    return index;

})();
