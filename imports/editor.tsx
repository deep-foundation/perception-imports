import { Box, Button, useColorMode, VStack } from '@chakra-ui/react';
import { useDeep, Id } from '@deep-foundation/deeplinks';
import dynamic from 'next/dynamic';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash';
import { OnMount } from '@monaco-editor/react';
import ReactCodeMirror, { basicSetup } from '@uiw/react-codemirror';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { langs } from '@uiw/codemirror-extensions-langs';
import { useDebounceCallback } from '@react-hook/debounce';
import { history as History } from "@codemirror/commands";
import { keymap } from "@codemirror/view";
import { linter } from "@codemirror/lint";
import { esLint } from "@codemirror/lang-javascript";
import * as eslint from "eslint-linter-browserify";
import globals from "globals";
import isEqual from 'lodash/isEqual.js';
import { MdSaveAlt } from 'react-icons/md';
import { useResizeDetector } from 'react-resize-detector';

export interface IEditor {
  refEditor?: any;
  linkId?: Id;
  subscription?: boolean;
  value?: any;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  onClose?: () => void;
  onExit?: () => void;
  minimap?: boolean;
  lineNumbers?: boolean;
  defaultLanguage?: string;
  fillSize?: boolean;
  onMount?: (editor: any, monaco: any) => any;
  children?: any;
  [key: string]: any;
}

const eslintConfig = {
  // eslint configuration
  languageOptions: {
		globals: { ...globals.node },
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
  rules: {
    semi: ["error", "never"],
  },
};

export function usePsudoResize() {
  const ref = useRef();
  return useMemo(() => ({ width: 0, height: 0, ref }), [])
}

export const Editor = React.memo(function Editor({
  refEditor,
  linkId,
  subscription = false,
  value = '',
  onChange,
  onSave,
  onClose,
  onExit,
  saveButton = true,
  minimap = true,
  lineNumbers,
  defaultLanguage = "javascript",
  fillSize = false,
  onMount,
  children = null,
  ...props
}: IEditor) {
  const deep = useDeep();
  if (!!value && typeof(value) !== 'string') throw new Error(`Editor value must be string but ${deep.stringify(value)}`);
  const [startValue, setStartValue] = useState(value);
  const [v, setV] = useState(value);
  const { colorMode } = useColorMode();
  const [lang, setLang] = useState<any>(langs.tsx());

  const _refEditor = useRef();
  const eref = refEditor || _refEditor

  const useLoad = useMemo(() => {
    return linkId ? deep[subscription ? 'useSubscription' : 'useQuery'] : function useLoad() { return { data: [] } };
  }, []);

  const { data: [link] } = useLoad({ id: linkId });

  const update = useCallback(async () => {
    if (linkId && v?.length > 0) await deep.value(linkId, v);
    onSave && onSave(v)
  }, [link, v]);

  const customKeymap = useMemo(() => {
    const save = (editor) => {
      update();
      return true;
    };
    return keymap.of([
      { key: "cmd-s", run: save },
      { key: "ctrl-s", run: save },
    ]);
  }, [v]);

  const { width, height, ref } = (fillSize ? useResizeDetector : usePsudoResize)();
  const history = useMemo(() => History(), []);
  // console.log('history', history);
  const extensions = useMemo(() => [
    lang,
    customKeymap,
    linter(esLint(new eslint.Linter(), eslintConfig)),
    history,
    ...(props?.extensions || []),
  ], [customKeymap]);
  const basicSetup = useMemo(() => ({
    tabSize: 2,
    // @ts-ignore
    lineNumbers,
    lineWrapping: true,
    ...(props?.basicSetup || {}),
  }), [props?.basicSetup]);
  const _onChange = useCallback((value, viewUpdate) => {
    setV(value);
    onChange && onChange(value);
  }, [onChange]);
  const other = useMemo(() => ((fillSize ? { height: `${height}px`, width: `${width}px` } : {})), [fillSize, height, width]);

  return <Box {...(fillSize ? { h: '100%', w: '100%' } : {})} position='relative' overflow='hidden' ref={fillSize ? ref : undefined}>
    <Box {...(fillSize ? { position: 'absolute', left: '0', top: '0', right: '0', bottom: '0' } : {})} w='100%'>
      {(linkId ? !!link : true) && <ReactCodeMirror
        ref={eref}
        value={props?.editable !== false && !props?.readOnly ? (linkId ? deep.stringify(link?.value?.value) || startValue : startValue) || '' : value}
        theme={colorMode === 'light' ? githubLight : githubDark}
        extensions={extensions}
        basicSetup={basicSetup}
        onChange={_onChange}
        {...other}
        {...props}
      />}
    </Box>
    <VStack position='absolute' right='1em' top='1em' overflow='hidden'>
      {children}
      {!!saveButton && props?.editable !== false && !props?.readOnly && <Button
        w='3em' h='3em'
        transition='all 1s ease'
        position='relative' left={!subscription || !isEqual(v, link?.value?.value || value) ? '10em' : '0em'}
        boxShadow='dark-lg'
        variant={undefined}
        onClick={update}
      ><MdSaveAlt/></Button>}
    </VStack>
  </Box>
}, isEqual)