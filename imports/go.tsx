import {
  Toast,
  useToast,
  Button as B,
} from '@chakra-ui/react';
import * as c from '@chakra-ui/react';
import { DeepClient, DeepClientPathItem, DeepClientStartItem, random, useDeep, Id, Link, QueryLink } from '@deep-foundation/deeplinks';
import { Subscription, Query } from '@deep-foundation/deeplinks/imports/client.js';
import EventEmitter from 'events';
import isEqual from 'lodash/isEqual.js';
import React, { Context, createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { HandlerConfigContext, HandlersGoContext, useClientHandler, useHandlersGo } from './client-handler.js';
// import { Editor } from './editor.js';
import { ReactHandler } from './react-handler.js';
import { MdSaveAlt } from 'react-icons/md';

import { useCookiesStore } from '@deep-foundation/store/cookies.js';
import { useLocalStore } from '@deep-foundation/store/local.js';
import { useQueryStore } from '@deep-foundation/store/query.js';
import { getChakraVar, loader, useChakraColor, useHandlersContext, useLoader, usePreload } from './hooks.js';
import { useDebounceCallback } from '@react-hook/debounce';
import { useAsyncMemo } from "use-async-memo";
import { Editor } from './editor-async.js';

const dpl = '@deep-foundation/perception-links';
const dc = '@deep-foundation/core';
const dtsx = '@deep-foundation/tsx';

export type onEnterI = (link: Link<Id>) => void;
export type onChangeI = (link: Link<Id>) => void;
export type PathI = string;

export interface GoI {
  _i: number;
  __p: number;

  (path?: PathI): GoI | null;
  linkId: Id;
  link?: Link<Id>;
  value: Id;
  current: GoI;

  deep: DeepClient<any>;
  path: string;
  do: DoI;
  focus?: FocusI;
  set?: FocusI;
  parents: ParentsI;
  parent: typeof parent;
  focused: typeof focused;
  log: typeof log;
  scroll: typeof scroll;
  toString: typeof toString;
  save: typeof save;
  Save: typeof Save;
  root: typeof root;
  await: typeof _await;
  awaitRef: typeof _awaitRef;
  all: AllI;
  go?: GoI;
  _go: typeof _go;
  __go?: GoI;
  __actualGoRef?: { current: GoI };
  emitter: EventEmitter;

  children?: { [key: string]: GoI };
  ref?: { current: any; };

  useGo: typeof useGo;
  useNav: typeof useNav;
  Provider: typeof GoProvider;
  Input: typeof Input;
  Editor: typeof Editor;
  Handler: typeof Handler;
  Subscription: typeof Subscription;
  useLocalStore: typeof useLocalStore;
  useQueryStore: typeof useQueryStore;
  useCookiesStore: typeof useCookiesStore;
  getChakraVar: typeof getChakraVar;
  useChakraColor: typeof useChakraColor;
  HandlerConfigContext: typeof HandlerConfigContext;
  Component: typeof Component;
  Button: typeof Button;
  useHook: typeof useHook;
  Query: typeof Query;
  useLoader: typeof useLoader;
  loader: (query: any) => any;
  On: typeof On;
  on: typeof _on;
  emit: typeof emit;
  noScrollBar: typeof noScrollBar;
  context: GoContextI;

  activator: typeof activator;
  next: typeof next;
  prev: typeof prev;

  delay: typeof delay;
  useRefValue: typeof useRefValue;

  _focus?: any;
  _setValue?: any;
  hgo?: GoI;

  data?: { [key:string]: any };

  componentTemplate: typeof componentTemplate;
  hookTemplate: typeof hookTemplate;

  [key:string]: any;
}

export interface GoCallbackI {
  (go: GoI): any;
}

export interface FocusI {
  (value: Id, ...args: any[]): { go: GoI; data?: Promise<any> | any };
}

export interface ParentsI {
  (): GoI[];
}

export interface AllI {
  (path: string): { steps: Id[], data: GoI[] };
}

export interface DoI {
  (...args: any[]): { data?: Promise<any>, go: GoI };
}

export interface DoHandleI {
  (go, value: Id, ...args: any[]): any | Promise<any>;
}

export type onDoI = onDoObjectI | DoHandleI;
export interface onDoObjectI {
  [name: string]: DoHandleI;
}

export const GoCustomContext = createContext<any>({});
export function GoCustomProvider({ value, children = null }) {
  return <GoCustomContext.Provider value={value}>{children}</GoCustomContext.Provider>;
}

export type GoContextI = Context<GoI | undefined>;

export const GoContext: GoContextI = createContext<GoI | undefined>(undefined);
GoContext.displayName = 'GoContext';
export function useGoCore(context?: GoContextI) { return useContext(context || GoContext); }

export const ValueContext = createContext<any>(undefined);

let _i = 0;
let _p = 0;

export const GoProvider = memo(function GoProvider({
  linkId,
  value: _value,
  on,

  context = GoContext,

  children = null,

  hotkeys = false,
}: {
  linkId?: Id;
  value?: Id; // update on's when optional, not create new go
  on?: { [name: string]: onDoI };

  context?: GoContextI;

  children?: any;

  hotkeys?: boolean;
}) {
  const deep = useDeep();
  const __p = useMemo(() => { return _p++; }, []);
  const _parentGo: GoI = useGoCore(context);
  const hgo: GoI = useGoCore(HandlersGoContext);
  const stateContext = useState(_value);
  const selectedValue = linkId ? stateContext : [_parentGo.value, _parentGo._setValue];
  const [value, setValue] = useMemo(() => selectedValue, [selectedValue]);
  const ref = useRef<any>();
  const childrenRef = useRef<{ [key:string]: GoI }>({});

  const parentRef = useRef<any>(_parentGo);
  const valueRef = useRef<any>(value);
  const isChanged = value !== valueRef.current || _parentGo !== parentRef.current;
  valueRef.current = value;
  parentRef.current = _parentGo;
  const pgoRef = useRef<any>();
  const __actualGoRef = useRef<any>(_parentGo);

  const custom = useContext(GoCustomContext) || {};

  const { go, parentGo }: { go: GoI, parentGo: GoI } = useMemo(() => {
    const _go = (linkId ? function go(path?: PathI) { return _go._go(path); } : _parentGo) as GoI;
    if (linkId) {
      _go._i = _i++;
      _go.__p = __p;
      _go.go = _parentGo;
      _go.ref = ref;
      _go.children = childrenRef.current;
      if (_parentGo) _parentGo.children[linkId] = _go;
      _go.data = {};
    } else {
      _go.ref = _parentGo.ref;
      _go.children = _parentGo.children;
      _go.data = _parentGo.data;
    }
    // console.log('go init', 'provider', __p, deep.nameLocal(linkId), _go === parentGo ? `parent ${parentGo.__p}` : 'new', _go._i, deep.nameLocal(_go.linkId));
    return { go: _go, parentGo: _parentGo };
  }, [value, _parentGo]);

  go.emitter = useMemo(() => {
    const e = linkId ? go.emitter || new EventEmitter() : parentGo.emitter;
    return e;
  }, []);

  useEffect(() => {
    return () => {
      // if (linkId && go?.go?.children?.[go.linkId]) delete go.go.children[go.linkId];
    };
  }, []);

  const toast = useToast();

  const _loader = useCallback((query) => loader({ query, deep }), []);

  useMemo(() => {
    const pgo = pgoRef.current;

    go.linkId = linkId || parentGo.linkId;
    go.link = deep?.minilinks?.byId[go.linkId]
    go.context = context;
    go.path = linkId ? `${parentGo ? parentGo.path+'.' : ''}${linkId}` : parentGo.path;
    go.value = value;
    go.go = linkId ? parentGo : parentGo?.go;
    go._go = _go;
    go.current = go?.children?.[value];
    
    // @ts-ignore
    go.deep = deep;
    go.log = log;
    go.scroll = scroll;
    go.toString = toString;
    go.save = save;
    go.Save = Save;
    // @ts-ignore
    go.Provider = GoProvider;
    go.Handler = Handler;
    go.Input = Input;
    go.Editor = Editor;
    go.Subscription = Subscription;
    go.Query = Query;
    go.useLocalStore = useLocalStore;
    go.useQueryStore = useQueryStore;
    go.useCookiesStore = useCookiesStore;
    go.getChakraVar = getChakraVar;
    go.useChakraColor = useChakraColor;
    go.HandlerConfigContext = HandlerConfigContext;
    go.Component = Component;
    go.Button = Button;
    go.useHook = useHook;
    go.useLoader = useLoader;
    go.loader = _loader;
    go.On = On;
    go.on = _on;
    go.emit = emit;
    go.noScrollBar = noScrollBar;

    go.do = _do;
    go.useGo = useGo;
    go.useNav = useNav;
    go.parents = parents;
    go.parent = parent;
    go.focused = focused;
    go.root = root;
    go.await = _await;
    go.awaitRef = _awaitRef;
    go.all = all;

    go.activator = activator;
    go.next = next;
    go.prev = prev;

    go.delay = delay;
    go.useRefValue = useRefValue;

    go._setValue = setValue;
    go.hgo = hgo;

    go.__go = parentGo;
    go.__actualGoRef = (linkId ? __actualGoRef : parentGo?.__actualGoRef) || __actualGoRef;

    for (let c in custom) {
      go[c] = custom[c];
    }

    go.componentTemplate = componentTemplate;
    go.hookTemplate = hookTemplate;

    // console.log('go fields', 'provider', __p, deep.nameLocal(linkId), go === parentGo ? `parent ${parentGo.__p}` : 'new', go._i, deep.nameLocal(go.linkId), deep.nameLocal(go.value));
  }, [go, value, deep]);

  const _set = useCallback((_value, ...args) => {
    go.value = _value;
    if (go.children?.[go.value]) {
      go.current = go.children?.[go.value];
    }
    if (value === _value) return { go };
    setValue(_value);
    return { go };
  }, [go, value]);
  const _setRef = useRef<any>(_set);
  _setRef.current = _set;

  const _focus = useCallback((_value, ...args) => {
    // console.log('focus', go.value, '=>', _value, go.toString(), go?.linkId, { go });
    go.value = _value;
    if (go.children?.[go.value]) {
      go.current = go.children?.[go.value];
      go.children[go.value].do('focus', undefined, ...args);
    }
    const parents = go.parents();
    for (let p = 1; p < parents.length; p++) {
      if (parents[p]?.value != (parents[(+p)-1]?.linkId)) parents[p].set((parents[(+p)-1]?.linkId))
    }
    // if (go.go && go.go.value != go.linkId) go.go.focus(go.linkId);
    go.emit('focus', _value, ...args);
    if (value === _value) return { go };
    setValue(_value);
    return { go };
  }, [go, value]);
  const _focusRef = useRef<any>(_focus);
  _focusRef.current = _focus;

  useMemo(() => {
    go.set = linkId ? function set(value: Id, ...args: any[]) {
      return _setRef.current(value, ...args);
    } : parentGo?.set;
    go.focus = linkId ? function focus(value: Id, ...args: any[]) {
      return _focusRef.current(value, ...args);
    } : parentGo?.focus;
  }, [go, parentGo, value]);

  pgoRef.current = go;

  if (go?._i > go.__actualGoRef?.current?._i || !go.__actualGoRef.current) go.__actualGoRef.current = go;

  // console.log(`GoProvider ${__p} [${value}] (${go._i} ${go.link?.name} ${go.value}) ^ (${parentGo?._i} ${parentGo?.link?.name} ${parentGo?.value})`);

  return <context.Provider key={__p} value={go}>
    <On {...on}/>
    {!parentGo && hotkeys && <Hotkeys context={context}/>}
    {children}
  </context.Provider>;
}, isEqual);

function Hotkeys({ context }) {
  const deep = useDeep();
  const go = useGoCore(context);
  // const goRef = useRef<any>(go);
  // goRef.current = go;
  useEffect(() => {
    // console.log('go hotkeys goeffect', 'fromProvider', go.__p, go._i, deep.nameLocal(go.linkId), deep.nameLocal(go.value));
  }, [go]);
  useHotkeys('up,down,right,left,space,enter,shift+up,shift+down,shift+right,shift+left,shift+space,shift+enter,meta+down,meta+right,meta+left,meta+space,meta+enter,ctrl+down,ctrl+right,ctrl+left,ctrl+space,ctrl+enter', async (e, h) => {
    // console.log('useHotkeys', 'current', go, 'root',go.root().toString(), 'focused', go.root().focused().map(f => f.toString()));
    const fs = go.root().focused();
    const ids = fs.map(f => f.linkId)
    const f = fs.pop();
    // console.log('go hotkey keypress', 'fromProvider', f.__p, deep.nameLocal(f.linkId), deep.nameLocal(f.value), ids.join(','));
    if (f) f.do(h.keys[0], { keyboardEvent: e, hotkeyEvent: h });
  }, { preventDefault: true, enableOnFormTags: false }, [go]);
  return null;
}

const On = function On(on) {
  const Go = useGo();
  const offsRef = useRef<any>([]);
  
  const onsRef = useRef<any>({});
  onsRef.current.on = on;

  useMemo(() => {
    const go = Go();
    const offs = offsRef.current;
    const ons = onsRef;
    for (let l in offs) offs[l]();
    if (on) {
      for (let name in on) {
        for (let a in on[name]) {
          const { off } = go.on(name, a, (...args) => args.slice(-1)[0]?.current?.on?.[name]?.[a] && args.slice(-1)[0]?.current?.on?.[name]?.[a](...args.slice(0, -1)), onsRef);
          offs.push(off);
        }
      }
    }
    // console.log('On', go.link.name, { go, on, offs });
  }, []);

  useEffect(() => {
    return () => {
      const offs = offsRef.current;
      for (let l in offs) offs[l]();
    };
  }, []);

  return on?.children || null;
}

const delay = (time) => new Promise((res) => setTimeout(() => res(true), time));

function useRefValue(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

const _on = function on(name, value, handler, onsRef) {
  const go = this();
  // console.log('go on', go.link.name, { go }, name, value, handler);
  const listener = (g, v, ...args) => {
    const vl = go.deep.minilinks.byId[v];
    const vlc = go.deep.minilinks.byId[go.value];
    // go.toast({
    //   position: 'bottom-left',
    //   render: () => <Box bg='deepBgDark' p='1em' fontSize='xs'>
    //     go({`${g.link}: ${vlt ? `${vlt}` : g.value}`}) call go({`${go.link}: ${vlc ? `${vlc}` : go.value}`}) .{name}({vl ? `${vl}` : v})
    //   </Box>
    // });
    handler(g, v, ...args, onsRef);
    console.log(`{ ${g.link} } go.${name}() ${go.link}(${go?.link?.type}): ${vlc ? `${vlc}(${vlc?.type})` : go.value} > ${vl ? `${vl}(${vl?.type})` : v}`, args);
  }
  const emitter = go.emitter.on(`${name}.${value}`, listener);
  const off = () => go.emitter.removeListener(`${name}.${value}`, listener);
  return { go, emitter, name, value, listener, off };
}

const emit = function emit(name, value, ...args): boolean {
  const go = this();
  const ps = go.parents();
  // const root = go.root();
  // go.root().emit('_emit', go, `${name}.${value}`, value, ...args);
  for (let p in ps) {
    // console.log('go emit', ps[p]?.link?.name, { go: ps[p] }, name, value, args);
    const result = ps[p].emitter.emit(`${name}.${value}`, go, value, ...args);
    // root.emit('__emit', go, ps[p], `${name}.${value}`, value, ...args);
    if (result) return result;
  }
  return false;
}

const _do: DoI = function _do(value: Id, ...args) {
  const go = this();
  // console.log(go.__p, go.link.name, value, go.on);
  go.emit('do', value, ...args);
  if (value === 'enter' || value === 'space') go.emit('do', 'exec', ...args);
  return { go };
}

const parents: ParentsI = function parents(): GoI[] {
  const go = this();
  let root, target, pointer: any = go, parents: GoI[] = [];
  while (!root) {
    parents.push(pointer);
    if (pointer.go) pointer = pointer.go;
    else root = pointer;
  }
  return parents;
}

const parent = function parent(id): GoI | undefined {
  const go = this();
  const parents = go.parents();
  for (let i = 0; i < parents.length - 1; i++) {
    if (parents[i].linkId == id) return parents[i];
  }
};

const all: AllI = function all(path: string): { steps: Id[]; data: GoI[] } {
  const go = this();
  let pointer: any = go;
  const steps: Id[] = path.split('.');
  const data = [pointer];
  for (let s in steps) {
    const next = pointer?.children?.[steps[s]];
    if (next) data.push(next);
    else break;
  }
  return { steps, data };
}

export function useGo() {
  return useGoCore(this?.context || GoContext);
}

// <c.Button {...go.activator(state, 'name')}/>
function activator(state: [any, React.Dispatch<React.SetStateAction<any>>], mustbe, ifthen = 'active', elsethen = undefined, prop = 'variant') {
  return { [prop]: isEqual(state[0], mustbe) ? ifthen : elsethen, onClick: () => state[1](mustbe), children: mustbe };
}

function prev(list) {
  const go = this();
  const v = arguments.length === 2 ? arguments[1] : go.value;
  if (!Array.isArray(list)) return null;
  const i = list.findIndex(l => l.id === v);
  const ni = (!~i || i == 0 ? list[list.length - 1] : list[i - 1])?.id;
  // console.log('go prev', go.link.name, go.value, i, list.map(l => l.id), '-', ni, { go });
  return ni;
}

function next(list) {
  const go = this();
  const v = arguments.length === 2 ? arguments[1] : go.value;
  if (!Array.isArray(list)) return null;
  const i = list.findIndex(l => l.id === v);
  const ni = (!~i || i == list.length - 1 ? list[0] : list[i + 1])?.id;
  // console.log('go next', go.link.name, go.value, i, list.map(l => l.id), '-', ni, { go });
  return ni;
}

interface NavI {
  (name: Id, left: Id, up: Id, right: Id, down: Id): void;
  get?: (from: Id, to: Id) => Id;
  map?: { [key: Id]: { name: Id; left: Id; up: Id; right: Id; down: Id; } };
}

function useNav() {
  const ref = useRef({});
  const nav: NavI = useCallback((name, left, up, right, down) => { ref.current[name] = { left, up, right, down } }, []);
  nav.get = useCallback((from, to) => {
    return ref.current?.[from]?.[to] || 'current';
  }, []);
  nav.map = ref.current;
  return nav;
}

function root() {
  const go = this();
  return go?.go ? go?.go.root() : go;
}

function focused() {
  return [this, ...(this?.value && this?.children?.[this?.value] ? this?.children?.[this?.value].focused() : [])];
}

function log(value: string) {
  if (value) console.log(value);
  // console.log(this.toString());
  console.dir(this);
}

function scroll(options: any = { block: "center", inline: "center", behavior: 'smooth' }) {
  const go = this();
  // console.log('scroll', go.linkId, go.value);
  (go.ref?.current || go?.hgo()?.ref?.current)?.scrollIntoView(options);
  return { go };
}

function _go(path?: PathI | GoCallbackI): GoI {
  if (typeof(path) === 'function') return path(this);
  const go = this.__actualGoRef.current;
  if (!path) return go;
  const _path = `${path}`;
  const { data, steps } = go.all(_path);
  // console.log(`go(${path})`, data.map(d => `${d.link}`), steps);
  if (steps.length > data.length + 1 || data[data.length - 1].linkId != steps[steps.length - 1]) return null;
  else return data[data.length - 1];
}

function toString() {
  return `p${this.__p} i${this._i} ${this.link} ${this.current?.link || this.value}`;
}

function Save({ handlerId }) {
  const go = useGoCore();
  useEffect(() => { go.save(handlerId) }, [handlerId]);
}

async function __await(_go, id, check, result = check) {
  return new Promise((res, rej) => {
    let count = 0;
    const i = setInterval(() => {
      const go = _go()
      if (check(go)) {
        clearInterval(i);
        res(result(go));
      } else if (count++ > 30) rej(`${go} await(${id}) not rejected`);
    }, 100);
  });
}

async function _await(id) {
  return __await(this(), id, (go) => go.children?.[id]);
}

async function _awaitRef(id) {
  return __await(this(), id, (go) => go.children?.[id]?.ref?.current, (go) => go.children?.[id]);
}

async function save(handlerId) {
  const go = this();
  const deep = go.deep;
  const { data: [history] } = await deep.select({
    from_id: deep.linkId,
    type_id: deep.idLocal(dpl, 'History'),
    to_id: go.linkId,
    order_by: { id: 'desc' },
    limit: 1,
  });
  if (!go._inserted && !history) {
    go._inserted = true;
    const { data: [h] } = await go.deep.insert({
      type_id: deep.idLocal(dpl, 'History'),
      from_id: deep.linkId,
      to_id: go.linkId,
      containerId: deep.linkId,
      string: `${go.value}`,
      out: {
        type_id: deep.idLocal(dpl, 'HistoryHandler'),
        to_id: handlerId,
        containerId: deep.linkId,
      },
    });
    go._inserted = h;
  } else if(typeof(go._inserted) === 'number') {
    return go.deep.value(history?.id || go._inserted, `${go.value}`);
  }
}

// css={go.noScrollBar}
export const noScrollBar = ((s) => ({
  '&::-webkit-scrollbar': s,
  '&::-webkit-scrollbar-track': s,
  '&::-webkit-scrollbar-thumb': s,
  'scrollbar-width': 'none !important',
}))({ display: 'none' });

const componentTemplate = ({ children } = { children: null }) => `({ deep, data, require, Go }) => {
  const React = require('react');
  const c = require('@chakra-ui/react');
  
  const dc = '@deep-foundation/core';
  const dpl = '@deep-foundation/perception-links';

  return ({
    go,
    goHandler,

    handlerId,
    Component,

    linkId,
    link,

    children,

    isActive,

    ...props
  }, ref) => {
    return <go.On
      do={{
      }}
    >
      ${!!children ? children : `<c.Box ref={ref} h='3em'>{\`\$\{go\}\`}</c.Box>`}
    </go.On>;
  };
}`;
componentTemplate.toString = () => componentTemplate();

const hookTemplate = () => `({ deep, data, require, Go }) => {
  const React = require('react');

  return function() {
    const go = Go.useGo();
    const rerendersRef = React.useRef(0);
    return React.useMemo(() => ++rerendersRef.current);
  };
}`;
hookTemplate.toString = () => hookTemplate();

const useHook = function useHook({ path, extendInsert = {}, postfix = 'Hook' }) {
  const go = useGoCore();
  const [isPreloaded, repreload] = usePreload();
  const deep = useDeep();
  const [name] = useState(random());
  const [handlerId, setHandlerId] = useState<Id>();
  const [links, setLinks] = useState<any>({ data: [] });
  deep.useMinilinksApply(name, links);
  const { data: _hook } = useClientHandler({ handlerId });
  (typeof (_hook) === 'function' && _hook.name !== deep.nameLocal(handlerId)) && Object.defineProperty(_hook, "name", { value: deep.nameLocal(handlerId) });
  const handlersRef = useHandlersContext();

  useEffect(() => {
    if (links?.data?.length) try { localSelectHandlerId(deep, path, handlerId, setHandlerId, handlersRef.current); } catch(e) {}
  }, [links]);

  useMemo(() => {
    try { localSelectHandlerId(deep, path, handlerId, setHandlerId, handlersRef.current); }
    catch(e) { selectHandler(path, go, deep, setLinks, hookTemplate(), extendInsert, postfix).then(() => repreload()); }
  }, []);

  return _hook;
}

let _ComponentInserted: any = {};
const selectHandler = async (path: [Id, ...Id[]], go, deep, setLinks, template, extendInsert, postfix) => {
  const results = await deep.select(go.loader({ id: { _id: [...path] }, return: { code: { relation: 'to' } } }));
  if (!results?.data?.[0]) return await insertHandler(path, go, deep, setLinks, template, extendInsert, postfix)
  else if (results?.data?.[0]?.code) {
    setLinks(results);
    return results?.data?.[0]?.id;
  } else return await insertCode(path, go, deep, setLinks, results?.data?.[0]?.id, template, extendInsert, postfix);
};
const insertHandler = async (path: [Id, ...Id[]], go, deep, setLinks, template, extendInsert, postfix) => {
  const containerId = await deep.id(...path.slice(0, -1));
  const last = path[path.length - 1];
  if (_ComponentInserted[`${path.join(',')}`]) {
    await go.delay(300);
    return await selectHandler(path, go, deep, setLinks, template, extendInsert, postfix);
  } else {
    _ComponentInserted[`${path.join(',')}`] = true;
    const { data: [{ id }] } = await deep.insert({
      type_id: deep.idLocal(dc, 'Handler'),
      from_id: deep.idLocal(dc, 'clientSupportsJs'),
      containerId: containerId,
      name: typeof(last) === 'string' ? last as string : undefined,
      to: {
        type_id: deep.idLocal(dtsx, 'TSX'),
        string: template,
        containerId: containerId,
        name: typeof(last) === 'string' ? `${last}${postfix}` : undefined,
      },
      ...extendInsert,
    })
    return await selectHandler([id], go, deep, setLinks, template, extendInsert, postfix);
  }
};
const insertCode = async (path: [Id, ...Id[]], go, deep, setLinks, handlerId, template, extendInsert, postfix) => {
  const { data: [{ id }] } = await deep.insert({
    type_id: deep.idLocal(dtsx, 'TSX'),
    string: template,
    containerId: await deep.id(...path.slice(0, -1)),
    name: typeof(path[path.length - 1]) === 'string' ? `${path[path.length - 1]}${postfix}` : undefined,
  });
  await deep.update({ id: handlerId }, { to_id: id });
  return await selectHandler(path, go, deep, setLinks, template, extendInsert, postfix);
};
const localSelectHandlerId = (deep, path, handlerId, setHandlerId, handlers) => {
  let id, handler, code;
      // @ts-ignore
  if (handlerId) return;
  id = deep.idLocal(...path);
  handler = deep.minilinks.byId[id];
  const localHandler = (handlers || []).find(h => h.handler_id === id);
  code = localHandler?.dist;
  if (handler && code) setHandlerId(id);
  else throw new Error('no local handler');
}

const Handler = memo(function Handler({
  provide = false,
  handlerId,
  linkId,
  on,
  ...props
}: {
  provide?: boolean;
  handlerId?: Id;
  linkId?: Id;
  on?: any;
  [key: string]: any;
}) {
  const go = useGoCore();
  const handler = <ReactHandler handlerId={handlerId} linkId={linkId} {...props}/>;
  return provide ? <go.Provider linkId={linkId || handlerId} on={on}>
    {handler}
  </go.Provider> : handler;
});

const Component = memo(function Component({
  path,
  linkId,
  extendInsert = {},
  provide = false,
  on,
  postfix = 'Component',
  ...props
}: {
  path: [Id, ...Id[]];
  linkId?: Id;
  extendInsert?: any;
  provide?: boolean;
  on?: any;
  [key:string]: any;
}) {
  const go = useGoCore();
  const [isPreloaded, repreload] = usePreload();
  const deep = useDeep();
  const [name] = useState(random());
  const [handlerId, setHandlerId] = useState<Id>();
  const handlersRef = useHandlersContext();
  const [links, setLinks] = useState<any>({ data: [] });
  deep.useMinilinksApply(links, name);

  useEffect(() => {
    if (links?.data?.length) try { localSelectHandlerId(deep, path, handlerId, setHandlerId, handlersRef.current); } catch(e) {}
  }, [links]);
  

  useMemo(() => {
    try { localSelectHandlerId(deep, path, handlerId, setHandlerId, handlersRef.current); }
    catch(e) {
      console.log('Component local error', e);
      selectHandler(path, go, deep, setLinks, componentTemplate(), extendInsert, postfix).then(() => repreload()).catch(e => {
        console.log('Component remote error', e);
      });
    }
  }, []);

  return !!handlerId ? (
    provide ? <go.Provider linkId={handlerId} on={on}>
      <go.Handler handlerId={handlerId} linkId={linkId} {...props}/>
    </go.Provider> : <go.Handler handlerId={handlerId} linkId={linkId} {...props}/>
   ) : null;
}, isEqual);

const Button = memo(function Button(props: any) {
  const go = useGoCore();
  const hgo = useHandlersGo();
  return <B ref={hgo.ref} variant={props?.isActive ? 'active' : undefined} onClick={() => go.do('exec', { id: go.linkId })} {...props}/>;
}, isEqual);

const Input = React.memo(({
  path,
  insert,
  title,
  type = 'string',

  ...props
}: {
  path: [DeepClientStartItem | QueryLink, ...DeepClientPathItem[]],
  insert?: any;
  title?: any;
  type?: 'string' | 'number';

  [key:string]: any;
}) => {
  const deep = useDeep();
  const { name, containerId } = useAsyncMemo<any>(async () => ({
    name: (path || []).slice(-1)[0],
    containerId: await deep.id((path || []).slice(0, -1) as any),
  }), [path], {});
  const insertedRef = React.useRef(false);
  const skip = !(path && containerId);
  const { data: [link], loading } = deep.useSubscription(skip ? {} : {
    id: { _id: [containerId, name] },
  }, { skip } as any);
  const [v, setV] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  return <>
    {!!title && <c.Box color='deepColor'>{title}</c.Box>}
    <c.InputGroup position='relative'>
      <c.Input
        value={v} onChange={(e) => setV(e?.target?.value)}
        h='3em'
        {...props}
      />
      {!!link && <c.Text
        position='absolute' left='1.4em' bottom='0.1em'
        pointerEvents='none' fontSize='xs'
        noOfLines={1} color='deepColorDisabled'
      >
        {`${link?.value?.value || ''}`}
      </c.Text>}
      <c.InputRightElement h='3em' w='3em'>
        <c.Button
          h='3em' w='3em'
          isLoading={saving}
          isDisabled={props?.isDisabled}
          onClick={async () => {
            if (loading) return;
            setSaving(true);
            if (!link && !insertedRef.current) {
              insertedRef.current = true;
              if (!insert) return;
              const { data: [inserted] } = await deep.insert({
                containerId, name,
                [type]: type === 'number' ? +v : v,
                ...insert,
              });
            } else if(!!link) {
              await deep.value(link.id, v);
            }
            setSaving(false);
          }}
        ><MdSaveAlt/></c.Button>
      </c.InputRightElement>
    </c.InputGroup>
  </>;
}, isEqual);