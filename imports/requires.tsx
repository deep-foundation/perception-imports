import * as icons from '@chakra-ui/icons';
import * as chakra from '@chakra-ui/react';
import * as deeplinks from '@deep-foundation/deeplinks';
import axios from 'axios';
import * as axiosHooks from 'axios-hooks';
import * as classnames from 'classnames';
import React from 'react';
import * as perception from '../import.js';
// import * as reacticons from 'react-icons';
import * as debounce from '@react-hook/debounce';
import * as rjsfChakra from '@rjsf/chakra-ui';
import * as rjsfCore from '@rjsf/core';
import * as rjsfValidator from '@rjsf/validator-ajv8';
import * as motion from 'framer-motion';
import isHotkey from 'is-hotkey';
import $ from 'jquery';
import * as json5 from 'json5';
import * as Resizable from 're-resizable';
import * as reactHotkeysHook from 'react-hotkeys-hook';
import { IconContext } from 'react-icons';
import * as ai from 'react-icons/ai';
import * as bs from 'react-icons/bs';
import * as ci from 'react-icons/ci';
import * as fa from 'react-icons/fa';
import * as fi from 'react-icons/fi';
import * as gi from 'react-icons/gi';
import * as gr from 'react-icons/gr';
import * as io from 'react-icons/io';
import * as io5 from 'react-icons/io5';
import * as lu from 'react-icons/lu';
import * as md from 'react-icons/md';
import * as pi from 'react-icons/pi';
import * as si from 'react-icons/si';
import * as tb from 'react-icons/tb';
import * as vsc from 'react-icons/vsc';
import Linkify from 'react-linkify';
import * as editor from 'slate';
import * as slate from 'slate-react';
import { htmlToSlate, slateToHtml } from 'slate-serializers';
import SoftBreak from 'slate-soft-break';
// @ts-ignore
// import * as aframeReact from '@belivvr/aframe-react';
// import { Entity, Scene } from 'aframe-react';
import * as themeTools from '@chakra-ui/theme-tools';
import cookiesStore from '@deep-foundation/store/cookies.js';
import localStore from '@deep-foundation/store/local.js';
import queryStore from '@deep-foundation/store/query.js';
import * as reactYandexMaps from '@pbe/react-yandex-maps';
// import * as D3 from 'd3';
// import * as d3d from 'd3-force-3d';
import * as i18n from "i18next";
import * as LanguageDetector from 'i18next-browser-languagedetector';
import _ from 'lodash';
import md5 from "md5";
import * as reacti18next from "react-i18next";
import * as ReactResizeDetector from 'react-resize-detector';
import * as recharts from 'recharts';
import { v4 as uuidv4 } from 'uuid';
// import ReactCalendarTimeline from 'react-calendar-timeline'
import moment from 'moment';
import * as reactHookForm from 'react-hook-form';

import * as ApolloSandbox from '@apollo/sandbox/react/index.cjs';
import EmojiPicker from 'emoji-picker-react';
import * as matchSorter from 'match-sorter';
import * as ni from "next/image.js";
import * as InfiniteScroll from 'react-infinite-scroller';
import * as planet from "react-planet";
import * as useAsyncMemo from "use-async-memo";

import * as semver from 'semver';

export const requires: any = {
  'lodash': _,
  'jquery': $,
  '@chakra-ui/react': chakra,
  'react': React,
  'axios': axios,
  'axios-hooks': axiosHooks,
  'classnames': classnames,
  'slate-soft-break': SoftBreak,
  'slate-serializers': { slateToHtml, htmlToSlate },
  'react-hotkeys-hook': reactHotkeysHook,
  '@react-hook/debounce': debounce,
  'json5': json5,
  'framer-motion': motion,
  'slate': editor,
  'slate-react': slate,
  'is-hotkey': isHotkey,
  're-resizable': Resizable,
  // '@monaco-editor/react': MonacoEditor, DEPRICATED
  '@chakra-ui/icons': icons,
  // '@deep-foundation/deepcase': {
  //   useContainer,
  //   useSpaceId,
  //   useFocusMethods,
  //   useBreadcrumbs,
  //   useShowExtra,
  //   useTraveler,
  //   CytoEditorPreview,
  //   CustomizableIcon,
  //   Resize,
  //   EditorTextArea,
  //   ClientHandler,
  //   BubbleArrowLeft,
  //   CytoReactLinkAvatar,
  //   DeepWysiwyg,
  //   useStringSaver,
  //   BlockButton,
  //   MarkButton,
  //   useRefAutofill,
  //   useChackraColor,
  //   useChackraGlobal,
  //   CytoGraph,
  //   useEditorTabs,
  //   useCytoEditor,
  // },
  '@deep-foundation/deeplinks': deeplinks,
  'react-icons/pi': pi,
  'react-icons/bs': bs,
  'react-icons/fi': fi,
  'react-icons/ci': ci,
  'react-icons/tb': tb,
  'react-icons/gr': gr,
  'react-icons/io': io,
  'react-icons/md': md,
  'react-icons/fa': fa,
  'react-icons/ai': ai,
  'react-icons/si': si,
  'react-icons/lu': lu,
  'react-icons/gi': gi,
  'react-icons/io5': io5,
  'react-icons/vsc': vsc,
  'react-icons' : IconContext,
  'react-linkify': Linkify,

  '@rjsf/core': rjsfCore,
  '@rjsf/chakra-ui': rjsfChakra,
  '@rjsf/validator-ajv8': rjsfValidator,

  // '@belivvr/aframe-react': aframeReact,
  // 'aframe-react': { Entity, Scene },
  'md5': md5,
  'uuid': uuidv4,
  // 'd3-force-3d': d3d,
  // 'd3': D3,
  'react-resize-detector': ReactResizeDetector,
  '@deep-foundation/store/query': queryStore,
  '@deep-foundation/store/local': localStore,
  '@deep-foundation/store/cookies': cookiesStore,
  'recharts': recharts,
  '@chakra-ui/theme-tools': themeTools,
  "i18next": i18n,
  'i18next-browser-languagedetector': LanguageDetector,
  "react-i18next": reacti18next,
  // "@pbe/react-yandex-maps": reactYandexMaps,
  // "react-calendar-timeline": ReactCalendarTimeline,
  "moment": moment,
  "react-hook-form": reactHookForm,
  '@apollo/sandbox/react': ApolloSandbox,
  'react-infinite-scroller': InfiniteScroll,
  'match-sorter': matchSorter,
  'use-async-memo': useAsyncMemo,
  'react-planet': planet,
  'next/image': ni,
  'emoji-picker-react': EmojiPicker,

  'semver': semver,
};

