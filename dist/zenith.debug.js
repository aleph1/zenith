/*! Zenith v1.0.0-alpha.5 | MIT License | © 2022 Aleph1 Technologies Inc */
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
    const tickQueue = new Map();
    //const propSetters = {};
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
    //const redrawableUpdateQueue = new Map();
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
    const getChildrenDoms = (children) => {
        const doms = [];
        for (const child of children) {
            if (child == null)
                continue;
            else if (child.type === 4 /* comp */ || child.type === 6 /* html */)
                doms.push(...child.doms);
            else
                doms.push(child.dom);
        }
        return doms;
    };
    // cloning elements is faster than creating them in most browsers:
    // https://www.measurethat.net/Benchmarks/Show/25003/0/create-versus-clone-element
    const getElement = (name, ns, is) => {
        const fullName = name + ':' + (ns || '') + ':' + (is || '');
        return (ELEMENT_CLONERS[fullName] || (ELEMENT_CLONERS[fullName] = ns ? document.createElementNS(ns, name, is ? { is } : null) : document.createElement(name, is ? { is } : null))).cloneNode();
    };
    const getNextSibling = (vNodes, start, end) => {
        while (start < end) {
            if (vNodes[start] != null && vNodes[start].dom != null)
                return vNodes[start].dom;
            start++;
        }
    };
    const insertElements = (parentDom, nextSibling, elements) => {
        if (nextSibling != null && nextSibling.parentNode === parentDom) {
            for (const element of elements) {
                if (element)
                    parentDom.insertBefore(element, nextSibling);
            }
        }
        else {
            for (const element of elements) {
                if (element)
                    parentDom.appendChild(element);
            }
        }
    };
    const insertElement = (parentDom, nextSibling, element) => {
        if (nextSibling == null)
            parentDom.appendChild(element);
        else
            parentDom.insertBefore(element, nextSibling);
    };
    const updateChild = (parentNode, parentDom, nextSibling, newVNode, oldVNode, index, ns) => {
        if (oldVNode != null && oldVNode.dom != null) {
            newVNode.parent = oldVNode.parent;
            newVNode.root = oldVNode.root;
            const newVNodeType = newVNode.type;
            const oldVNodeType = oldVNode.type;
            //newVNode.parent = parentNode;
            if (newVNodeType === oldVNodeType) {
                // *** should we reenable .diff check?
                //if ((newVNode.attrs || FROZEN_EMPTY_OBJECT).diff !== false) {
                switch (newVNodeType) {
                    case 2 /* elem */:
                        if (newVNode.tag !== oldVNode.tag) {
                            // *** we don't pass the namespace in case the node type has changed from xhtml/svg/math
                            // but should we consider extracting it from the vNode tag and passing it as ns?
                            createVNode(parentNode, parentDom, oldVNode.dom, newVNode); //, ns);
                            removeVNode(parentNode, oldVNode);
                        }
                        else {
                            updateElement(parentNode, parentDom, nextSibling, newVNode, oldVNode, ns);
                            // *** adding this fixes a test but breaks the demos
                            //insertElement(parentDom, newVNode.dom, getNextSibling(parentNode.children, index + 1, parentNode.children.length));
                        }
                        break;
                    case 3 /* text */:
                        if (newVNode.tag !== oldVNode.tag) {
                            newVNode.dom = document.createTextNode(newVNode.tag);
                            insertElement(parentDom, oldVNode.dom, newVNode.dom);
                            oldVNode.dom.remove();
                        }
                        else {
                            newVNode.dom = oldVNode.dom;
                        }
                        break;
                    case 4 /* comp */:
                        if (newVNode.tag !== oldVNode.tag) {
                            //, getNextSibling(parentNode.children, index + 1, parentNode.children.length)
                            createVNode(parentNode, parentDom, nextSibling, newVNode, ns);
                            removeVNode(parentNode, oldVNode);
                        }
                        else {
                            newVNode.dom = oldVNode.dom;
                            newVNode.doms = oldVNode.doms;
                            newVNode.children = oldVNode.children;
                            updateComponent(parentNode, parentDom, nextSibling, newVNode, ns);
                            //insertElements(parentDom, newVNode.doms, getNextSibling(parentNode.children, index + 1, parentNode.children.length))
                        }
                        break;
                    case 6 /* html */:
                        if (newVNode.tag !== oldVNode.tag) {
                            //getNextSibling(parentNode.children, index + 1, parentNode.children.length)
                            createVNode(parentNode, parentDom, nextSibling, newVNode, ns);
                            removeVNode(parentNode, oldVNode);
                        }
                        else {
                            newVNode.dom = oldVNode.dom;
                            newVNode.doms = oldVNode.doms;
                        }
                        break;
                    case 5 /* node */:
                        if (newVNode.dom !== oldVNode.dom) {
                            insertElement(parentDom, oldVNode.dom, newVNode.dom);
                            oldVNode.dom.remove();
                        }
                }
                //}
            }
            else {
                //getNextSibling(parentNode.children, index + 1, parentNode.children.length)
                createVNode(parentNode, parentDom, nextSibling, newVNode, ns);
                removeVNode(parentNode, oldVNode);
            }
        }
        else {
            //getNextSibling(parentNode.children, index + 1, parentNode.children.length)
            createVNode(parentNode, parentDom, nextSibling, newVNode, ns);
        }
    };
    const updateChildren = (parentNode, parentDom, nextSibling, newChildren, oldChildren, ns) => {
        const newChildrenLength = newChildren.length;
        const oldChildrenLength = oldChildren.length;
        if (newChildrenLength > 0) {
            if (oldChildrenLength > 0) {
                let oldChild;
                let newChild;
                const doms = [];
                const isNewKeyed = newChildren[0] && newChildren[0].attrs && newChildren[0].attrs.key != null;
                const isOldKeyed = oldChildren[0] && oldChildren[0].attrs && oldChildren[0].attrs.key != null;
                // keyed diff
                // 1) get IDs for new children
                // 2) get IDs for old children
                // 3) get IDs for old children
                // 4) iterate through new children IDs and ***
                if (isNewKeyed === true && isOldKeyed === true) {
                    //const tempDom = getElement(parentDom.nodeName, ns);
                    const newChildrenByKey = {};
                    const oldChildrenByKey = {};
                    //const oldKeyOrder = [];
                    //const newKeyOrder = [];
                    //const lisPositions = [0];
                    //let lisIndex = 0;
                    // get keys for all new children
                    //let now = performance.now();
                    for (newChild of newChildren) {
                        //newChildrenByKey[child.attrs.key] = child;
                        newChildrenByKey[newChild.attrs.key] = true;
                    }
                    // get keys for all old children
                    for (oldChild of oldChildren) {
                        const key = oldChild.attrs.key;
                        // when old key is still in use, keep the old node
                        if (newChildrenByKey[key]) {
                            oldChildrenByKey[key] = oldChild;
                            //oldKeyOrder.push(key);
                            // otherwise, nullify the node and delete its DOM
                        }
                        else {
                            // removeNode returns null
                            removeVNode(parentNode, oldChild);
                            //oldKeyOrder.push(-1);
                            delete oldChildrenByKey[key];
                        }
                    }
                    // iterate through new children and diff with old children
                    let index = 0;
                    for (newChild of newChildren) {
                        if (newChild != null) {
                            //newChild.index = index;
                            updateChild(parentNode, parentDom, nextSibling, newChild, oldChildrenByKey[newChild.attrs.key], index, ns);
                            if (newChild.type === 4 /* comp */ || newChild.type === 6 /* html */)
                                doms.push(...newChild.doms);
                            else
                                doms.push(newChild.dom);
                        }
                        index++;
                    }
                    insertElements(parentDom, null, doms);
                    // non-keyed diff
                    // 1) iterate through oldChildren starting at index newChildrenLength
                    //    - attempt to remove node
                    //    - keep nodes that are being removed in the tree
                    // 2) iterate through newChildren starting at 0 up to newChildrenLength
                    //    - 
                }
                else {
                    //console.log('non-keyed diff');
                    const reusedDoms = new Set();
                    // 1iterate through old nodes and keep any that have been destroyed, but deferred
                    for (let i = newChildrenLength; i < oldChildrenLength; i++) {
                        oldChild = oldChildren[i];
                        // if old node is in the process of being removed, keep it in the tree
                        if (removeVNode(parentNode, oldChild) === false) {
                            //console.log('node is being removed, keep it in tree');
                            //console.log(oldChild.root);
                            oldChild.parent = parentNode;
                            oldChild.root = parentNode.root;
                            newChildren[i] = oldChild;
                        }
                    }
                    for (let i = 0; i < newChildrenLength; i++) {
                        oldChild = oldChildren[i];
                        newChild = newChildren[i];
                        if (newChild == null) {
                            if (oldChild != null) {
                                if (removeVNode(parentNode, oldChild) === false) {
                                    //console.log('node is being removed, keep it in tree');
                                    //console.log(oldChild.root);
                                    oldChild.parent = parentNode;
                                    oldChild.root = parentNode.root;
                                    newChildren[i] = newChild = oldChild;
                                    newChild && reusedDoms.add(newChildren[i].dom);
                                }
                            }
                        }
                        else {
                            if (oldChild == null || oldChild.dom == null || reusedDoms.has(oldChild.dom)) {
                                //console.log('node is being created');
                                createVNode(parentNode, parentDom, nextSibling, newChild, ns);
                                newChild && reusedDoms.add(newChild.dom);
                            }
                            else if (oldChild.removed == null) {
                                //console.log('node is being updated');
                                updateChild(parentNode, parentDom, nextSibling, newChild, oldChild, i, ns);
                                newChild && reusedDoms.add(newChild.dom);
                            }
                        }
                    }
                }
            }
            else {
                createVNodes(parentNode, parentDom, nextSibling, newChildren, 0, newChildrenLength, ns);
            }
        }
        else {
            removeVNodes(parentNode, oldChildren, 0, oldChildrenLength);
        }
        parentNode.children = newChildren;
    };
    const createVNodes = (parentNode, parentDom, nextSibling, children, start, end, ns) => {
        while (start < end) {
            createVNode(parentNode, parentDom, nextSibling, children[start++], ns);
        }
    };
    const createVNode = (parentNode, parentDom, nextSibling, vNode, ns) => {
        //if(typeof vNode === 'number') vNode = keepVNodes.get(vNode);
        if (vNode == null)
            return;
        //console.log(parentNode.root)
        vNode.parent = parentNode;
        vNode.root = parentNode.root;
        //let elements;
        switch (vNode.type) {
            case 2 /* elem */:
                createElement(parentNode, parentDom, nextSibling, vNode, ns);
                break;
            case 3 /* text */:
                vNode = vNode;
                vNode.dom = document.createTextNode(vNode.tag);
                insertElement(parentDom, nextSibling, vNode.dom);
                break;
            case 4 /* comp */:
                createComponent(parentNode, parentDom, nextSibling, vNode, ns);
                break;
            case 6 /* html */:
                createHTML(parentNode, parentDom, nextSibling, vNode, ns);
                break;
            case 5 /* node */:
                insertElement(parentDom, nextSibling, vNode.dom);
        }
    };
    const setDOMAttribute = (vNode, attr, value, oldValue, ns) => {
        if (value == null || attr === 'type' || attr === 'key' || attr === 'is' || attr === 'ns')
            return;
        if (attr === 'value') {
            // do we need this type check?
            //if (vNode.tag === 'input' || vNode.tag === 'option' || vNode.tag === 'textarea') (vNode.dom as HTMLInputElement).value = value + '';
            vNode.dom.value = value + '';
        }
        else if (value === true) {
            vNode.dom.setAttribute(attr, attr);
        }
        else if (value === false) {
            vNode.dom.removeAttribute(attr);
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
            if (Array.isArray(value))
                vNode.dom.setAttribute(attr, value.join(' '));
            else if (typeof value === 'object') {
                for (const style in value) {
                    vNode.dom[attr][style] = value[style];
                }
            }
            else {
                vNode.dom.setAttribute(attr, value); // add ''?
            }
        }
    };
    const createElement = (parentNode, parentDom, nextSibling, vNode, ns) => {
        vNode.events = {};
        vNode.dom = getElement(vNode.tag, ns = getNamespace(vNode, vNode.attrs.ns || ns), vNode.attrs.is);
        if (vNode.attrs.tick)
            tickQueue.set(vNode, vNode.attrs.tick);
        // ensure <input> has a type before doing additional attribute manipulation
        if (vNode.tag === 'input' && vNode.attrs.type != null)
            vNode.dom.setAttribute('type', vNode.attrs.type);
        //setDOMAttributes(vNode);
        for (const attr in vNode.attrs) {
            setDOMAttribute(vNode, attr, vNode.attrs[attr]);
        }
        createVNodes(vNode, vNode.dom, nextSibling, vNode.children, 0, vNode.children.length, ns);
        insertElement(parentDom, nextSibling, vNode.dom);
    };
    const updateElement = (parentNode, parentDom, nextSibling, newVNode, oldVNode, ns) => {
        newVNode.dom = oldVNode.dom;
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
        //setDOMAttributes(newVNode);
        // set new attributes
        for (const attr in newVNode.attrs) {
            setDOMAttribute(newVNode, attr, newVNode.attrs[attr], oldVNode.attrs[attr]);
        }
        updateChildren(newVNode, newVNode.dom, nextSibling, newVNode.children, oldVNode.children, ns);
    };
    const createComponent = (parentNode, parentDom, nextSibling, vNode, ns) => {
        if (vNode.tag.init)
            vNode.tag.init(vNode);
        const children = vNode.children = drawDrawable(vNode, vNode.tag.draw);
        createVNodes(vNode, parentDom, nextSibling, children, 0, children.length, ns);
        vNode.doms = getChildrenDoms(vNode.children);
        vNode.dom = vNode.doms[0];
        insertElements(parentDom, nextSibling, vNode.doms);
        if (vNode.tag.drawn)
            vNode.tag.drawn(vNode);
        if (vNode.tag.tick)
            tickQueue.set(vNode, vNode.tag.tick);
    };
    // *** ensure namespace is correct when updating
    const updateComponent = (parentNode, parentDom, nextSibling, vNode, ns) => {
        //console.log('updateComponent()');
        //if (vNode.tag.drawOnce != null) return;
        updateChildren(vNode, parentDom, nextSibling, drawDrawable(vNode, vNode.tag.draw, vNode.children), vNode.children, ns || vNode.dom.namespaceURI);
        vNode.doms = getChildrenDoms(vNode.children);
        vNode.dom = vNode.doms[0];
        if (vNode.tag.drawn)
            vNode.tag.drawn(vNode);
    };
    const createHTML = (parentNode, parentDom, nextSibling, vNode, ns) => {
        const tmpDom = getElement(parentDom.nodeName, ns);
        tmpDom.innerHTML = vNode.tag;
        vNode.doms = [...tmpDom.childNodes];
        vNode.dom = vNode.doms[0];
        insertElements(parentDom, nextSibling, vNode.doms);
    };
    const destroyVNode = (vNode) => {
        //console.log('destroyVNode()');
        if (vNode.type === 4 /* comp */) {
            if (vNode.tag.destroy)
                vNode.tag.destroy(vNode);
            //vNode.removed = null;
        }
        if (vNode.children) {
            removeVNodes(vNode, vNode.children, 0, vNode.children.length, true);
            vNode.children.length = 0;
        }
        else if (vNode.dom)
            vNode.dom.remove();
        if (vNode.doms) {
            for (const childDom of vNode.doms)
                childDom.remove();
        }
        else if (vNode.dom)
            vNode.dom.remove();
        delete vNode.dom;
        vNode.root = vNode.parent = null;
    };
    const removeVNodes = (parentNode, children, start, end, noBeforeDestroy) => {
        while (start < end) {
            removeVNode(parentNode, children[start++], noBeforeDestroy);
        }
    };
    const removeVNode = (parentNode, vNode, immediate) => {
        //console.log('removeVNode()');
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
                if (vNode.removed === true) {
                    return false;
                }
                else if (immediate !== true && typeof vNode.tag.remove === 'function') {
                    const delayed = vNode.tag.remove(vNode);
                    vNode.removed = true;
                    if (delayed) {
                        if (delayed instanceof Promise) {
                            //console.log(vNodeRef);
                            const destroy = () => {
                                //console.log('destroy callback');
                                //console.log(vNodeRef);
                                if (vNode) {
                                    if (vNode.root)
                                        vNode.root.redraw = true;
                                    if (vNode.parent)
                                        vNode.parent.children.splice(vNode.parent.children.indexOf(vNode), 1);
                                }
                                destroyVNode(vNode);
                            };
                            delayed.then(destroy, destroy);
                            return false;
                        }
                        else
                            throw new Error('comp.destroy must return falsy or Promise');
                    }
                    //if(typeof deferred === 'number' && isFinite(deferred)) {
                    //  vNode.remove = true;
                    //  setTimeout(() => {
                    //    vNode.removed = null;
                    //    vNode.parent.children.splice(vNode.parent.children.indexOf(vNode), 1);
                    //    destroyVNode(vNode as VNodeComp);
                    //  }, deferred);
                    //}
                }
                break;
            case 6 /* html */:
                for (const index in vNode.doms) {
                    vNode.doms[index].remove();
                }
                break;
        }
        destroyVNode(vNode);
        return true;
    };
    const drawDrawable = (vNode, drawFn, oldChildren) => {
        const children = drawFn(vNode, oldChildren);
        return normalizeChildren(Array.isArray(children) ? children : [children]);
    };
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
    //const deferUpdateRedrawable = (parentNode: VNodeAny, vNode: VNodeComp) => redrawableUpdateQueue.set(vNode, [parentNode]);
    //function compDef(inputDef: VNodeCompDefinition, extendDef?: VNodeCompDefinition): VNodeCompDefinition {
    const compDef = (inputDef) => {
        if (typeof inputDef.draw !== 'function')
            throw new Error('compDef requires draw function');
        return Object.assign({}, inputDef, { type: 7 /* compDef */ });
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
            attrs: attrs ? Object.freeze(attrs) : FROZEN_EMPTY_OBJECT
        };
        vNode.draw = immediate => {
            if (immediate)
                updateComponent(vNode.parent, vNode.parent.dom, getNextSibling(vNode.parent.children, vNode.parent.children.indexOf(vNode) + 1, vNode.parent.children.length), vNode);
            else {
                // *** add vNode.redraw = true to optimize redraws?
                vNode.root.redraw = true;
            }
        };
        return vNode;
    };
    const html = (value) => {
        const type = typeof value;
        return {
            type: 6 /* html */,
            tag: type === 'string' || type === 'number' || type === 'bigint' ? value + '' : '',
        };
    };
    const node = (dom) => {
        return {
            type: 5 /* node */,
            tag: dom.nodeName.toLowerCase(),
            attrs: FROZEN_EMPTY_OBJECT,
            dom: dom,
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
        const mountedNode = mountedNodes.get(dom) || mountedNodes.set(dom, {
            type: 1 /* root */,
            tag: dom.nodeName.toLowerCase(),
            attrs: FROZEN_EMPTY_OBJECT,
            dom: dom,
            children: [],
        }).get(dom);
        if (vNodeAnyOrArray == null || vNodeAnyOrArray.length === 0) {
            removeVNodes(mountedNode, mountedNode.children, 0, mountedNode.children.length);
            mountedNode.children.length = 0;
            mountedNodes.delete(dom);
        }
        else {
            mountedNode.root = mountedNode;
            updateChildren(mountedNode, dom, null, normalizeChildren(Array.isArray(vNodeAnyOrArray) ? vNodeAnyOrArray : [vNodeAnyOrArray]), mountedNode.children, getClosestElementNamespace(dom));
        }
        //console.log(mountedNode);
        return mountedNode;
    };
    const tick = () => {
        tickCount++;
        for (const [vNode, tick] of tickQueue) {
            tick(vNode, tickCount);
        }
        for (const [dom, vNode] of mountedNodes) {
            if (vNode.redraw === true) {
                // set this first in case a descendant node wants to force the tree to redraw on next tick
                vNode.redraw = false;
                updateChildren(vNode, dom, null, vNode.children, vNode.children, getClosestElementNamespace(dom));
            }
        }
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
        node,
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
            compDef: 7 /* compDef */,
            comp: 4 /* comp */,
            elem: 2 /* elem */,
            html: 6 /* html */,
            node: 5 /* node */,
            text: 3 /* text */,
        }),
        ns: ELEMENT_NAMESPACES
    };

    return index;

})();
