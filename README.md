[![npm](https://img.shields.io/npm/v/@deep-foundation/deepmemo-imports.svg)](https://www.npmjs.com/package/@deep-foundation/deepmemo-imports)
[![Gitpod](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/deep-foundation/deepmemo-imports) 
[![Discord](https://badgen.net/badge/icon/discord?icon=discord&label&color=purple)](https://discord.gg/deep-foundation)

> Based on deeplinks config (tsconfig/npmignore/gitignore/gitpod/nvmrc)

### Development

When deepmemo-imports and deepmemo-app cloned in one directory, you can sync deepmemo-imports/imports with deepmemo-app/node_modules/@deep-foundation/deepmemo-links/imports, AND run deepmemo-app with one command:
```
npm run package:app:dev
```

## Description

| Feature | foreground | background | save-to-deep |
| --- | --- | --- | --- |
| [`<DeviceProvider>`](https://github.com/deep-foundation/deepmemo-imports/blob/main/imports/device.tsx) | 🟢 | 🔴 | 🟢 |
| [`<GeolocationProvider>`](https://github.com/deep-foundation/deepmemo-imports/blob/main/imports/geolocation.tsx) | 🟢 | 🔴 | 🟢 |
| Voice | 🔴 | 🔴 | 🔴 |
| Contacts | 🔴 | 🔴 | 🔴 |
| Camera | 🔴 | 🔴 | 🔴 |
| Action | 🔴 | 🔴 | 🔴 |
| Haptics | 🔴 | 🔴 | 🔴 |
| Motion | 🔴 | 🔴 | 🔴 |
| Network | 🔴 | 🔴 | 🔴 |
| Reader | 🔴 | 🔴 | 🔴 |

- 🔴 not realized
- 🟣 in process
- 🟠 has problem, may  be link to issue
- 🔵 realized but not tested
- 🟢 tested