
import { useTheme } from '@chakra-ui/react';
import { useDeep } from "@deep-foundation/deeplinks/imports/client";
import { Id } from "@deep-foundation/deeplinks/imports/minilinks";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useGoCore } from './go';

export function Packages() {
  const deep = useDeep();
  // @ts-ignore
  const { data, refetch, loading } = deep.useQuery({
    type_id: { _nin: [
      deep.idLocal('@deep-foundation/core', 'Promise'),
      deep.idLocal('@deep-foundation/core', 'Then'),
      deep.idLocal('@deep-foundation/core', 'Rejected'),
      deep.idLocal('@deep-foundation/core', 'Resolved'),
      deep.idLocal('@deep-foundation/core', 'PromiseResult'),
    ] },
    up: {
      tree_id: { _eq: deep.idLocal('@deep-foundation/core', 'containTree') },
      parent: {
        type_id: { _eq: deep.idLocal('@deep-foundation/core', 'Package') },
        string: {}
      },
    },
  });
  // const count = deep.useMinilinksSubscription({ type_id: deep.idLocal('@deep-foundation/core', 'Package') }, { aggregate: 'count' }));
  // const [count, setCount] = useState(0);
  // useEffect(() => {
  //   // @ts-ignore
  //   setCount(deep.minilinks.select({ type_id: deep.idLocal('@deep-foundation/core', 'Package') }, { aggregate: 'count' }));
  // }, [data]);
  return null;
}

export const PreloadContext = createContext<[boolean, () => Promise<void>]>(undefined);
export function usePreload() { return useContext(PreloadContext); }
export const HandlersContext = createContext<any>([]);
export function useHandlersContext() { return useContext(HandlersContext); }

export function PreloadProviderCore({
  preloaded = {},
  children = null,
}: {
  preloaded?: { packages?: any[]; handlers?: any[]; };
  children?: any;
}) {
  const deep = useDeep();
  const [handlers, setHandlers] = useState(preloaded?.handlers || []);
  useMemo(() => {
    // @ts-ignore
    console.log('preloaded useMemo[]', preloaded?.packages);
    deep.minilinks.add(preloaded?.packages || [], 'preloader-packages');
    // const i = setInterval(() => {
    //   if (!!deep?.minilinks?.links?.length) {
    //     setIsPreloaded(true);
    //     clearInterval(i);
    //   }
    // }, 100);
    // return () => clearInterval(i);
  }, []);
  const [isPreloaded, setIsPreloaded] = useState(!!deep?.minilinks?.links?.length);
  const reload = useCallback(async () => {
    deep.minilinks.apply(await deep.select({
      type_id: { _nin: [
        deep.idLocal('@deep-foundation/core', 'Promise'),
        deep.idLocal('@deep-foundation/core', 'Then'),
        deep.idLocal('@deep-foundation/core', 'Rejected'),
        deep.idLocal('@deep-foundation/core', 'Resolved'),
        deep.idLocal('@deep-foundation/core', 'PromiseResult'),
      ] },
      up: {
        tree_id: { _eq: deep.idLocal('@deep-foundation/core', 'containTree') },
        parent: {
          type_id: { _eq: deep.idLocal('@deep-foundation/core', 'Package') },
          string: {}
        },
      },
    }), 'preloader');
  }, []);
  const _handlers = deep.useSubscription({
    execution_provider_id: { _eq: deep.idLocal('@deep-foundation/core', 'JSExecutionProvider') },
    return: {
      dist: { relation: 'dist' }
    },
  }, { table: 'handlers' });
  useEffect(() => {
    if (!!_handlers?.data?.length) setHandlers(_handlers?.data);
  }, [_handlers]);
  const value: [boolean, () => Promise<void>] = useMemo(() => ([isPreloaded, reload]), [isPreloaded]);
  const handlersRef = useRef<any>(handlers);
  handlersRef.current = handlers;
  return <PreloadContext.Provider value={value}>
    <HandlersContext.Provider value={handlersRef}>
      {children}
    </HandlersContext.Provider>
  </PreloadContext.Provider>
}

export function PreloadProvider({
  preloaded = {},
  children = null,
}: {
  preloaded?: { packages?: any[]; handlers?: any[]; };
  children?: any;
 }) {
  const deep = useDeep();
  return deep ? <PreloadProviderCore preloaded={preloaded} children={children}/> : children;
}

export function useSymbol() {
  const deep = useDeep();
  return (link) => symbol(link, deep);
}
export function symbol(link, deep) {
  return link?.type?.inByType[deep.idLocal('@deep-foundation/core', 'Symbol')]?.[0]?.value?.value;
}
export const loader = ({ query = { limit: 30 }, deep }: { query?: any; deep; }) => {
  return {
    order_by: { id: 'desc' },
    limit: 30,
    ...query,
    return: {
      ...(query?.return || {}),
      names: {
        relation: 'in',
        type_id: deep.idLocal('@deep-foundation/core', 'Contain'),
        return: {
          parent: { relation: 'from' },
        },
      },
      from: { relation: 'from' },
      to: { relation: 'to' },
    },
  };
};
export function useLoader({
  query, ref, interval = 10000
}: {
  query: any;
  ref: any;
  interval: number;
}) {
  const deep = useDeep();
  const q = useMemo(() => {
    return loader({ query, deep });
  }, [query, deep]);
  const results = deep.useQuery(q);
  const refResults = useRef(results);
  refResults.current = results;
  useEffect(() => {
    const i = setInterval(async () => {
      var style = (ref?.current ? window.getComputedStyle(ref?.current) : undefined) || undefined;
      // @ts-ignore
      return (style?.display !== 'none') && await refResults.current.refetch();
    }, interval);
    return () => clearInterval(i);
  }, []);
  return results;
}

export function useCanByContain(id: Id) {
  const deep = useDeep();
  const { data } = deep.useQuery({
    id: id,
    up: {
      tree_id: deep.idLocal('@deep-foundation/core', 'containTree'),
      parent: {
        up: {
          tree_id: deep.idLocal('@deep-foundation/core', 'joinTree'),
          parent: {
            down: {
              tree_id: deep.idLocal('@deep-foundation/core', 'containTree'),
              link_id: id
            }
          }
        }
      },
    },
  });
  return !!data?.length;
}

export function useChakraColor(color: string) {
  const theme = useTheme();
  return getChakraColor(theme, color);
}
export function getChakraColor(theme, color: string) {
  return theme.__cssMap?.[`colors.${color}`]?.value || color;
}

export function getChakraVar(e, v) {
  return v && typeof(window) === 'object' && window.getComputedStyle(e)? (window.getComputedStyle(e).getPropertyValue(v.slice(4, -1)) || v) : (v || 'transparent');
}

export function useChakraVar(): (color: string) => string {
  const theme = useTheme();
  const go = useGoCore();
  return (color: string) => {
    return getChakraVar(go().root().ref.current, getChakraColor(theme, color));
  };
}