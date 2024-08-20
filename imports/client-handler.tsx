import { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Id, Link } from '@deep-foundation/deeplinks/imports/minilinks';
import { DeepClient, useDeep } from '@deep-foundation/deeplinks/imports/client';
import { gql } from '@apollo/client/index';
import $ from 'jquery';
import isEqual from 'lodash/isEqual';

import React from 'react';
import { WatchLink } from './react-handler';
import { GoContextI, GoProvider, useGoCore } from './go';
import { useHandlersContext } from './hooks';
import classNames from 'classnames';

export class CatchErrors extends React.Component<{
  error?: any;
  onMounted?: (setError: (error?: any) => void) => void;
  errorRenderer?: (error: Error, reset: () => any) => React.ReactNode;
  reset?: () => any;
  children: any;
},any> {
  reset: () => any;

  constructor(props) {
    super(props);
    this.state = { error: undefined };

    this.reset = () => {
      this.setState({ error: undefined });
      this?.props?.reset && this?.props?.reset();
    };
  }

  static getDerivedStateFromError(error) {
    console.log('getDerivedStateFromError', error);
    return { error };
  }
  componentDidCatch(error, errorInfo) {
    var err = error.constructor('Error in Evaled Script: ' + error.message);
    // +3 because `err` has the line number of the `eval` line plus two.
    err.lineNumber = error.lineNumber - err.lineNumber + 3;
    console.log('componentDidCatch', err, errorInfo);
  }
  componentDidMounted() {
    this?.props?.onMounted && this?.props?.onMounted((error) => this.setState({ error: error }));
  }

  errorRenderer = (error, reset) => <>error native</>;

  render() {
    const error = this.props.error || this.state.error;
    if (error) {
      return this?.props?.errorRenderer ? this?.props?.errorRenderer(error, this.reset) : this?.errorRenderer(error, this.reset);
    }

    return this.props.children; 
  }
}

/**
 * Evaluates a client handler
 * @returns A promise that resolves to an object with either an error property that contains error or data property that contains result of the handler.
 */
export async function evalClientHandler(options: {
  value: string;
  deep: DeepClient;
  input?: any;
}): Promise<{
  error?: any;
  data?: any;
}> {
  const {
    value,
    deep,
    input = {},
  } = options;
  try {
    // console.log('evalClientHandler', 'value', value);
    // const evalResult = (new Function(`return ${value}`))();
    // console.log('evalClientHandler', 'evalResult', evalResult);
    const evalResult = eval(value);
    if (typeof evalResult === 'function') {
      return {
        data: await evalResult({ deep, gql, ...input }),
      };
    } else {
      return {
        error: new Error(`Client handler must return a function, got ${typeof evalResult}`),
      };
    }
  } catch(error) {
    console.error('evalClientHandler', 'error', error);
    return { error };
  }
  return {};
}

export const HandlersGoContext: GoContextI = createContext(undefined);
HandlersGoContext.displayName = 'HandlersGoContext';
export function useHandlersGo() { return useContext(HandlersGoContext); }

export const ClientHandler = memo(function ClientHandler(_props: ClientHandlerProps) {
  const deep = useDeep();
  const ml = deep.minilinks;

  const go = useGoCore();
  const goHandler = useHandlersGo();

  const {
    ErrorComponent,
    UnhandledComponent,
  } = _props;
  const {
    data: Component,
    file, sync,
    link,
    linkId,
    handlerId,
    context = [],
    onClose,
    outerError,
    error,
    require,
    errored,
    erroredResetRef,
    setErrorRef,
    ...props
  } = useClientHandler(_props);

  return (<>
    <GoProvider context={HandlersGoContext} linkId={handlerId}>
      {!!file && !!sync && <WatchLink link={file}/>}
      <CatchErrors
        error={errored || outerError}
        errorRenderer={(error, reset) => {
          erroredResetRef.current = async () => {
            // console.log('error reset', file.id);
            const founded = await deep.select(file.id);
            // console.log('error reset apply', founded, deep.minilinks.update(founded?.data));
            reset();
          }
          return <div><ErrorComponent
            UnhandledComponent={UnhandledComponent}
            ErrorComponent={ErrorComponent}
            Component={Component}
            link={ml?.byId?.[linkId]}
            file={file}
            {...props}
            handlerId={handlerId}
            linkId={linkId}
            error={error}
            reset={erroredResetRef.current}
            goHandler={goHandler}
            go={go}
          /></div>
        }}
        onMounted={(setError) => setErrorRef.current = setError}
      >
        {Component ? <>
          {[<ClientHandlerRenderer key={file?.value?.value}
            Component={Component}
            link={ml?.byId?.[linkId]}
            {...props}
            linkId={linkId}
            handlerId={handlerId}
            goHandler={goHandler}
            go={go}
          />]}
        </> : <><UnhandledComponent
          UnhandledComponent={UnhandledComponent}
          ErrorComponent={ErrorComponent}
          Component={Component}
          file={file}
          link={ml?.byId?.[linkId]}
          {...props}
          linkId={linkId}
          handlerId={handlerId}
          goHandler={goHandler}
          go={go}
        /></>}
      </CatchErrors>
    </GoProvider>
  </>);
});

export const HandlerConfigContext = createContext<{
  sync: boolean;
  setSync: React.Dispatch<React.SetStateAction<boolean>>;
}>({ sync: false, setSync: (value) => {} });

export function useClientHandler(_props: UseClientHandlerProps) {
  const { sync: __sync = false } = useContext(HandlerConfigContext);
  const {
    link: _link,
    linkId: _linkId,
    handlerId,
    context = [],
    onClose,
    error: outerError,
    require,
    sync: _sync = __sync,
    ...props
  } = _props;
  const deep = useDeep();
  const go = useGoCore();
  const goHandler = useHandlersGo();
  const ml = deep?.minilinks;
  const hid = useFindClientHandler(_props);

  const [{ Component, errored } = {} as any, setState] = useState<any>({ Component: undefined, errored: undefined });
  const [sync, setSync] = useState<boolean>(_sync);

  const link = _link || ml?.byId?.[_linkId];
  const linkId = link?.id || _linkId;

  const files = deep.useMinilinksSubscription({
    id: hid?.dist_id || 0,
  });
  const file = files?.[0];
  const fileRef = useRef<any>(file);
  fileRef.current = file;

  // console.log('ClientHandler root', { linkId, handlerId, context, file, hid, files, Component });
  const lastEvalRef = useRef(0);
  useEffect(() => {
    if (!hid) return;
    const value = deep.minilinks.byId[file?.id]?.value?.value;
    if (!value) {
      return;
    }
    const evalId = ++lastEvalRef.current;
    evalClientHandler({ value, deep, input: { require, Go: go } }).then(({ data, error }) => {
      try {
        if (evalId === lastEvalRef.current) {
          // console.log('ClientHandler evalClientHandler setState', { file, data, error });
          if (!error) {
            setState(() => ({ Component: React.memo(React.forwardRef(data), isEqual) }));
            erroredResetRef?.current && (erroredResetRef?.current(), erroredResetRef.current = undefined);
          }
          else {
            setErrorRef.current && setErrorRef.current(error);
            setState({ Component: undefined, errored: error });
          }
        } else {
          // console.log('ClientHandler evalClientHandler outdated', { file, data, error, evalId, 'lastEvalRef.current': lastEvalRef.current });
        }
      } catch(error) {
        setErrorRef.current && setErrorRef.current(error);
        setState({ Component: undefined, errored: error });
      }
    });
  }, [files, file?.value?.value, hid]);

  const erroredResetRef = useRef<any>();
  const setErrorRef = useRef<any>();

  useEffect(() => {
    if (!!errored && !sync) setSync(true);
  }, [errored, sync]);

  return { ..._props, ...props, data: Component, handlerId, file, sync, errored, outerError, erroredResetRef, setErrorRef, link, linkId, require };
}

export interface ClientHandlerRendererProps {
  Component: any;
  fillSize?: boolean;
  onClose?: () => any;
  [key: string]: any;
};

export const ClientHandlerRenderer = React.memo(function ClientHandlerRenderer({
  Component,
  fillSize = false,
  onClose,
  ...props
}: ClientHandlerRendererProps) {
  const hgo = useHandlersGo();
  const go = useGoCore();
  const goRef = useRef<any>(go); goRef.current = go;
  const hgoRef = useRef<any>(hgo); hgoRef.current = hgo;
  useEffect(() => {
    setAttrs(go, hgo);
  }, [go, hgo]);
  const setAttrs = useCallback((go, hgo) => {
    if (!!hgo.ref.current) {
      const el = hgo.ref.current as HTMLElement;
      // console.log('add class', props.handlerId, el);
      if (el) {
        $(el).addClass("deep-link-id")
        $(el).data('deep-link-id', props.handlerId);
        $(el).data('deep-link-go', go);
        $(el).data('deep-link-handlers-go', hgo);
      }
    }
  }, []);
  useEffect(() => {
    const i = setInterval(() => {
      const go = goRef.current;
      const hgo = hgoRef.current;
      if (!!hgo.ref.current) {
        clearInterval(i);
        setAttrs(go, hgo);
      }
    }, 100);
    return () => clearInterval(i);
  }, []);
  return <>{!!Component && <Component
    onClose={onClose}
    fillSize={fillSize}
    {...props}
    ref={hgo.ref}
  />}</>;
});

export interface ClientHandlerProps extends Partial<ClientHandlerRendererProps> {
  linkId: Id;
  handlerId?: Id;
  handlerQuery?: any;
  context?: Id[];
  error?: any;
  onClose?: () => any;
  ErrorComponent: (props: ClientHandlerProps) => any;
  UnhandledComponent: (props: ClientHandlerProps) => any;
  sync?: boolean;
  [key: string]: any;
}

export interface UseClientHandlerProps extends Partial<ClientHandlerRendererProps> {
  linkId?: Id;
  handlerId?: Id;
  handlerQuery?: any;
  context?: Id[];
  error?: any;
  onClose?: () => any;
  sync?: boolean;
  [key: string]: any;
}

export function useFindClientHandler({
  handlerId,
  handlerQuery,
  context = [],
}: {
  handlerId?: Id;
  handlerQuery?: any;
  context?: Id[];
}) {
  const deep = useDeep();
  const [asyncHandler, setAsyncHandler] = useState<any>();
  const handlers = useHandlersContext();
  // if (!deep.isId(handlerId)) throw new Error(`useFindClientHandler !handlerId ${deep.stringify(handlerId)}`);
  const memoHandler = useMemo(() => {
    // console.log(handlers, handlerId);
    return handlerId ? handlers.current.find(h => h.handler_id === handlerId) : undefined;
  }, [handlerId]);
  useEffect(() => {
    // if (memoHandler) console.log(`find client handlerId ${handlerId} handler ${JSON.stringify(memoHandler)} founded sync`);
    if (!memoHandler) (async () => {
      if (asyncHandler) return;
      const handlerIds = handlerQuery ? (await deep.select({
        type_id: deep.idLocal('@deep-foundation/core', 'Handler'),
        ...handlerQuery,
      }))?.data : [];
      const _handlerId = handlerId || handlerIds[0]?.id;
      if (deep.isId(_handlerId)) {
        const handler = await deep._findHandler({ context, handlerId: _handlerId });
        if (handler) {
          setAsyncHandler(handler);
          // console.log(`find client handlerId ${handlerId} handler ${JSON.stringify(memoHandler)} founded async`);
        }
      }
      // console.log(`find client handlerId ${handlerId} handler ${JSON.stringify(memoHandler)} not founded async`);
    })();
  }, [context, handlerId, handlerQuery, asyncHandler]);
  return memoHandler || asyncHandler;
}