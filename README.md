[![npm](https://img.shields.io/npm/v/@deep-foundation/perception-imports.svg)](https://www.npmjs.com/package/@deep-foundation/perception-imports)
[![Gitpod](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/deep-foundation/perception-imports) 
[![Discord](https://badgen.net/badge/icon/discord?icon=discord&label&color=purple)](https://discord.gg/deep-foundation)

> Based on deeplinks config (tsconfig/npmignore/gitignore/gitpod/nvmrc)

# Documentation

## Imports

```js
import {
    GoProvider,
    useGo,
    GoContext,
    theme,
    usePreload,
    AutoGuest,
    ValueContext,
    noScrollBar,
    GoCustomContext,
    useGoCore,
    GoCustomProvider,
    Editor,
    usePsudoResize,
    CatchErrors,
    evalClientHandler,
    useHandlersGo,
    useClientHandler,
    useFindClientHandler,
    HandlersGoContext,
    ClientHandler,
    HandlerConfigContext,
    ClientHandlerRenderer,
    ReactHandlerEditor,
    WatchLink,
    ClientHandlerErrorComponent,
    ClientHandlerUnhandledComponent,
    ReactHandlersProvider,
    createComponent,
    ColorMode,
    Packages,
    useHandlersContext,
    PreloadProviderCore,
    PreloadProvider,
    useSymbol,
    symbol,
    useLoader,
    useCanByContain,
    useChakraColor,
    getChakraColor,
    getChakraVar,
    useChakraVar,
    PreloadContext,
    HandlersContext,
    loader,
} from './imports/auto-guest';
```

```ts
import {
    onEnterI,
    onChangeI,
    PathI,
    onDoI,
    GoContextI,
    GoI,
    GoCallbackI,
    FocusI,
    ParentsI,
    AllI,
    DoI,
    DoHandleI,
    onDoObjectI,
    IEditor,
    ClientHandlerRendererProps,
    ClientHandlerProps,
    UseClientHandlerProps,
    ReactHandlerProps,
} from '@deep-foundation/perception-imports';
```

### Development

When perception-imports and perception-app cloned in one directory, you can sync perception-imports/imports with perception-app/node_modules/@deep-foundation/perception-links/imports, AND run perception-app with one command:
```
npm run package:app:dev
```
