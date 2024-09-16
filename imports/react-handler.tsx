import { Id, Link, useDeep } from '@deep-foundation/deeplinks';
import { createContext, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ClientHandler, HandlerConfigContext, HandlersGoContext, useFindClientHandler, useHandlersGo } from './client-handler.js';

import { Alert, AlertIcon, AlertTitle, Box, Button, Flex, Modal, ModalBody, ModalContent, ModalOverlay, Skeleton, useDisclosure, VStack } from '@chakra-ui/react';
import React from 'react';

import { Editor } from './editor.js';
import { GoI, GoProvider, useGoCore } from './go.js';

import $ from 'jquery';
import flatten from 'lodash/flatten.js';
import isEqual from 'lodash/isEqual.js';

export const r: any = (path) => {
  if (r.requires[path]) return r.requires[path];
  throw new Error(`Module not found: Can't resolve ${path}`);
};
r.requires = {};

const dpl = '@deep-foundation/perception-links';
const dc = '@deep-foundation/core';

// @ts-ignore
if (typeof(window) === 'object') window._require = r;

export interface ReactHandlerProps {
  linkId?: Id;
  handlerId?: Id;
  context?: Id[];
  ml?: any;
  error?: any;
  onClose?: () => any;
  ErrorComponent?: any;
  [key: string]: any;
}

export function WatchLink({
  link
}: {
  link: Link<Id>;
}) {
  const deep = useDeep();
  deep.useSubscription({ id: link.id });
  return null;
}

export function ClientHandlerErrorComponent({
  error, reset,
  handlerId,
}: {
  error?: any;
  reset?: any;
  handlerId?: any;
}) {
  const deep = useDeep();
  const [mode, setMode] = useState('src');
  const { handler } = useFindClientHandler({ handlerId });
  const { data: [src], loading: _src } = deep.useQuery({ id: handler?.src_id && mode === 'src' ? handler?.src_id : 0 });
  const { data: [dist], loading: _dist } = deep.useQuery({ id: handler?.dist_id && mode === 'dist' ? handler?.dist_id : 0 });
  const loading = !_src && !_dist;
  const content = { src, dist };
  const disclosure = useDisclosure();
  const _mode = content[mode] ? mode : 'dist';
  const go = useGoCore();
  const ref = useMemo(() => go?.root().ref, []);
  const FinderButton = deep.idLocal('@deep-foundation/perception-links', 'FinderButton');

  const [h] = deep.useLinks(handlerId);

  return <>
    <Button w='100%' h='100%' variant='danger' onClick={disclosure.onOpen}>error</Button>
    <Modal
      blockScrollOnMount={false} isOpen={disclosure.isOpen} onClose={disclosure.onClose}
      portalProps={{ containerRef: ref }}
    >
      <ModalOverlay />
      <ModalContent maxW='90%' maxH='90%' h='100%' opacity={0.9}>
        <ModalBody p='1em'>
          <Flex direction={'column'} h='100%'>
            <Alert status={'error'}>
              <AlertIcon />
              <AlertTitle>Error:</AlertTitle>
              <Button variant='danger' onClick={reset}>
                reset
              </Button>
            </Alert>
            <Box>
              <Editor
                value={JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}
                editable={false} readOnly
              />
            </Box>
            <Alert status={'info'}>
              <AlertIcon />
              <go.Provider linkId={FinderButton}>
                <go.Handler handlerId={FinderButton} isActive={go.value === FinderButton}/>
              </go.Provider>
              <AlertTitle>Handled by {`${h}`}:</AlertTitle>
              <Button variant={mode === 'dist' ? 'active' : undefined} onClick={() => setMode('dist')}>dist</Button>
              <Button variant={mode === 'src' ? 'active' : undefined} onClick={() => setMode('src')}>src</Button>
            </Alert>
            {!!content?.[_mode] && [<Box flex={1} key={_mode}><Editor fillSize
              linkId={content?.[_mode]?.id}
            /></Box>]}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  </>;
}

export function ClientHandlerUnhandledComponent({ Component, reset }: { Component?: any; reset?: any }) {
  return <Box w='100%' h='100%' p='1em'>
    <Skeleton h='3em'/>
  </Box>;
}

export function ReactHandlerEditor({
  handler,
  disclosure,
}: {
  handler: Id;
  disclosure?: any;
}) {
  const deep = useDeep();
  const go = useGoCore();
  const hgo = useHandlersGo();
  const { data: handlers, loading } = deep.useQuery(handler && disclosure.isOpen ? {
    // handler_id: { _in: hgo?.parents()?.map(p => +(`${p.value}`).split('-')[1]) },
    handler_id: { _eq: handler },
    return: {
      src: { relation: 'src' },
      dist: { relation: 'dist' },
    },
    // @ts-ignore
  } : { limit: 0, handler_id: 0 }, { table: 'handlers' });
  const [file, setFile] = useState<Link<Id>>();
  useEffect(() => {
    if (!loading && !file && handlers?.[0]?.src) setFile(handlers?.[0]?.src);
  }, [loading, handlers]);
  const { reloadHandler } = useFindClientHandler({ handlerId: handler });

  return <Modal blockScrollOnMount={false} isOpen={disclosure.isOpen} onClose={disclosure.onClose}>
    <ModalOverlay />
    <ModalContent maxW='90%' maxH='90%' h='100%' opacity={0.9}>
      <ModalBody p='1em'>
        <Flex direction={'column'} h='100%'>
          {/* <Alert status={'info'}>
            <AlertIcon />
            <AlertTitle>Editor:</AlertTitle>
          </Alert> */}
          <Box>{handlers.map(f => <React.Fragment key={f.handler_id}>
            <Box display='inline-flex' p='0.2em' h='3em'>{deep.minilinks.byId[f?.handler_id]?.id} {deep.minilinks.byId[f?.handler_id]?.name}</Box>
            {!!f.src && <Button h='3em' variant={file === f.src ? 'active' : null} onClick={() => setFile(f.src)}>src</Button>}
            {!!f.dist && <Button h='3em' variant={file === f.dist ? 'active' : null} onClick={() => setFile(f.dist)}>dist</Button>}
          </React.Fragment>)}</Box>
          <Box flex={1}>
            {!loading && !!file && [<Editor key={file.id}
              linkId={file.id} fillSize
              onSave={() => {
                reloadHandler();
              }}
            />]}
          </Box>
        </Flex>
      </ModalBody>
    </ModalContent>
  </Modal>;
}

export const ReactHandlerTreeItem = memo(function ReactHandlerTreeItem({
  go,
  setHandler,
  goPath = [],
}: {
  go: any;
  setHandler?: any;
  goPath?: GoI[];
}) {
  const deep = useDeep();
  const hgo = go.hgo;
  const handlerId = hgo?.linkId;
  const handler = handlerId ? deep.get(handlerId) : undefined;
  const [open, setOpen] = useState(false);

  const keys = Object.keys(go.children);

  const v = deep.ml.byId[go.value];

  const isActive = useMemo(() => !!goPath.find(f => f.path === go.path), [goPath]);
  useEffect(() => {
    if (isActive) setOpen(true);
  }, [isActive]);

  return <Box mr='1em' textAlign='right'>
    <Box>
      <Box>
        {!!go && <Button bg='deepBgDark' size='xs' pointerEvents='all' onClick={() => {
          console.dir(go);
          // @ts-ignore
          window.go = go;
          setHandler(go.linkId);
        }}>{`${go.link}`}</Button>}
        {!!go && <Button bg='deepBgDark' size='xs' pointerEvents='all' isDisabled>{`(${v || go.value})`}</Button>}
        {!!handler && <>
          <Button size='xs' pointerEvents='all' onClick={() => {
            console.dir(hgo); 
            // @ts-ignore
            window.hgo = hgo;
            setHandler(handler.id);
          }}>{`${handler}`}</Button>
        </>}
        <Button size='xs' pointerEvents='all' variant={open ? 'active' : undefined} onClick={() => setOpen(!open)}>{open ? 'v' : '>'}</Button>
      </Box>
      {!!open && <Box pointerEvents='none'>
        {keys.map(k => <ReactHandlerTreeItem key={k} go={go.children[k]} setHandler={setHandler} goPath={goPath}/>)}
      </Box>}
    </Box>
  </Box>
}, isEqual);

export const ReactHandlersContext = createContext<any>(undefined);
export function ReactHandlersProvider({
  children = null,
  requires = {},
  sync: _sync = false,
}: {
  children?: any;
  requires?: any;
  sync?: boolean;
}) {
  r.requires = requires;
  const deep = useDeep();
  const [focuses, setFocuses] = useState([]);
  const focusedRef = useRef<any>([]);
  const focus = useCallback((id, hgo, go) => {
    const f = focusedRef.current;
    const now = new Date().valueOf();
    // console.log('HANDLER FOCUS', id, f, now);
    if (f.timer && now - (f.timer) > 1000) {
      while(f.length > 0) f.pop();
    }
    if (!f.timer || now - (f.timer)) {
      f.push({ handlerId: id, go, hgo });
    }
    // console.log([...f], focusedRef);
    setFocuses([...f]);
    f.timer = now;
  }, []);
  focusedRef.current.focus = focus;
  const disclosure = useDisclosure();
  const [handler, setHandler] = useState<any>();
  useEffect(() => {
    if (handler) disclosure.onOpen();
  }, [handler]);
  useEffect(() => {
    if (!disclosure.isOpen) setHandler(undefined);
  }, [disclosure.isOpen]);
  useEffect(() => {
    $(document).on('click', '.deep-link-id', function(e) {
      const handlerId = $(this).data('deep-link-id');
      const go = $(this).data('deep-link-go');
      const hgo = $(this).data('deep-link-handlers-go');
      if (e.shiftKey) {
        // e.preventDefault();
        // e.stopPropagation();
        focus(handlerId, hgo, go);
      } else {
        if (go) {
          go.do('click');
          if (go?.go && go?.go?.value != go?.linkId) go.go.focus(go.linkId);
        }
      }
    });
  }, []);
  // const renderFocuses = (list, level = 0, mode = 'hgo') => {
  //   return (uniqBy(list, 'handlerId') as any).map(({ handlerId, go, hgo }) => {
  //     return <React.Fragment key={handlerId}>
  //       <Box mr={`${level * 1}em`} pointerEvents='all'>
  //         {!!go && <Button bg='deepBgDark' size='xs' onClick={() => {
  //           console.dir(go);
  //           // @ts-ignore
  //           window.go = go;
  //         }}>go</Button>}
  //         {!!hgo && <Button bg='deepBgDark' size='xs' onClick={() => {
  //           console.dir(hgo);
  //           // @ts-ignore
  //           window.hgo = hgo;
  //         }}>hgo</Button>}
  //         <Button bg='deepBgDark' size='xs' onClick={() => {
  //           setHandler(deep.minilinks.byId[handlerId]);
  //           disclosure.onOpen();
  //         }}>{handlerId} {deep.minilinks.byId[handlerId]?.name}</Button>
  //         {!!go?.linkId && <Button size='xs' onClick={() => {
  //           setHandler(deep.minilinks.byId[go.linkId]);
  //           disclosure.onOpen();
  //         }}>{go.linkId} {deep.minilinks.byId[go.linkId]?.name}</Button>}
  //         {!!go?.value && <Button size='xs' variant='active' onClick={() => {
  //           setHandler(deep.minilinks.byId[go.value]);
  //           disclosure.onOpen();
  //         }}>{go.value} {deep.minilinks.byId[go.value]?.name}</Button>}
  //       </Box>
  //       {mode === 'hgo' && renderFocuses(Object.values(hgo.children).map((hgo: GoI) => ({ handlerId: hgo.linkId, hgo })), level + 1, mode)}
  //       {mode === 'go' && renderFocuses(Object.values(go.children).map((go: GoI) => ({ handlerId: go.linkId, go })), level + 1, mode)}
  //     </React.Fragment>;
  //   })
  // };
  const goRoot = focuses?.[0]?.go?.root();
  const [sync, setSync] = useState(_sync);
  const goPath = useMemo(() => flatten(focuses.map(f => f.go.parents())), [focuses]);

  return <ReactHandlersContext.Provider value={focusedRef}>
    <HandlerConfigContext.Provider value={{ sync, setSync }}>
    {children}
    {!!focuses.length && <VStack
      position='fixed' top='0' right='0' height='100%' zIndex={9999}
      alignItems={'end'} pointerEvents='none' userSelect={'none'}
      overflowY='scroll' css={goRoot.noScrollBar}
    >
      <Button bg='deepBgDark' size='md' pointerEvents='all' onClick={() => {
        setFocuses([]);
      }}>X</Button>
      <Box bg='deepBgDark' p='0.3em' pl='0.5em' pr='0.5em'>handlers:</Box>
      <ReactHandlerTreeItem go={goRoot} setHandler={setHandler} goPath={goPath}/>
      {/* {renderFocuses(focuses)}
      <Box bg='deepBgDark' p='0.3em' pl='0.5em' pr='0.5em'>go:</Box>
      {!!goRoot && renderFocuses([{ handlerId: goRoot?.linkId, go: goRoot }], 0, 'go')} */}
    </VStack>}
    {!!handler && [<ReactHandlerEditor key={handler} disclosure={disclosure} handler={handler}/>]}
    </HandlerConfigContext.Provider>
  </ReactHandlersContext.Provider>;
}

export const ReactHandler = memo(function ReactHandler({ ...props }: ReactHandlerProps) {
  const deep = useDeep();
  const go = useGoCore();

  const [h] = deep.useLinks(props?.handlerId);

  const ch = <ClientHandler key={deep.isLink(h) ? `${h}` : props.handlerId}
    ErrorComponent={ClientHandlerErrorComponent}
    UnhandledComponent={ClientHandlerUnhandledComponent}
    {...props}
    require={r}
  >
    <GoProvider context={HandlersGoContext}>
    {/* {!!hovered && <Box
      bg='deepBgDark' color='deepColor'
      position='absolute' top='0' right='0'
      h='2m'
      onClick={disclosure.onOpen}
      >🔧 {h?.id} {h?.name}</Box>} */}
      {props?.children || null}
    </GoProvider>
  </ClientHandler>;

  useEffect(() => {
    if (go?.go?.value === go?.linkId) {
      let counter = 0;
      const i = setInterval(() => {
        if (counter > 30) clearInterval(i);
        counter++;
        if (go()?.hgo()?.ref?.current) {
          clearInterval(i);
          go().go().focus(go.linkId);
        }
      }, 100);
      return () => clearInterval(i);
    }
  }, []);

  return <>
    {[ch]}
  </>;
}, isEqual);

export function createComponent(props: ReactHandlerProps) {
  return useCallback(function(_props: any) {
    return <ReactHandler {...props} {..._props}/>
  }, []);
}