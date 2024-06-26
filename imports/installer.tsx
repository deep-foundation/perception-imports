import { registerPlugin } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Geolocation, GeolocationPlugin, PermissionStatus } from "@capacitor/geolocation";
import {
  createGeolocation,
  createGeolocationWatcher,
} from "@solid-primitives/geolocation";
import { useDeep } from '@deep-foundation/deeplinks/imports/client';
import { Id, LinkPlain } from '@deep-foundation/deeplinks/imports/minilinks';
import { useLocalStore } from '@deep-foundation/store/local';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from "@capacitor/core";
import isEqual from 'lodash/isEqual';
import isNil from 'lodash/isNil';
import omitBy from 'lodash/omitBy';
import { useSaver } from "./saver";
import { useDevice } from "./device";
import { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { GeolocationContext, Position, useGeolocationSync } from "./geolocation";

interface InstallerProviderProps {
  children?: any;
}

interface InstallerContextData {
  'isAdmin'?: boolean;
  '@deep-foundation/chatgpt-azure'?: LinkPlain<Id>[];
  '@deep-foundation/chatgpt-azure-deep'?: LinkPlain<Id>[];
  '@deep-foundation/chatgpt-azure-templates'?: LinkPlain<Id>[];
  '@deep-foundation/voice-to-sync-text-file'?: LinkPlain<Id>[];
  '@deep-foundation/deepmemo-links'?: LinkPlain<Id>[];
  '@deep-foundation/telegram-bot'?: LinkPlain<Id>[];
  '@deep-foundation/deepmemorybot'?: LinkPlain<Id>[];
  'ApiKey'?: LinkPlain<Id>[];
  'UsesApiKey'?: LinkPlain<Id>[];
  'Model'?: LinkPlain<Id>[];
  'UsesModel'?: LinkPlain<Id>[];
  'TelegramToken'?: LinkPlain<Id>[];
  'TelegramActive'?: LinkPlain<Id>[];
  'DeepmemoryActive'?: LinkPlain<Id>[];

  space: LinkPlain<Id>;

  installed: boolean;
  status: boolean;

  installing: boolean;
  install?: () => Promise<void>;
  saveApiKey?: (value: string) => Promise<void>;
  saveUsesModel?: (id: Id) => Promise<void>;
  defineSpace?: () => Promise<void>;

  saveDeepmemoryTelegramToken?: (token: string) => Promise<void>;
  telegramDeepmemoryBotStatus?: (status: boolean) => Promise<void>;
  deepmemoryBotStatus?: (status: boolean) => Promise<void>;

  reset?: () => void;
}

export const installerContext = createContext<InstallerContextData>(null);

export function useInstaller() {
  return useContext(installerContext);
}

const fields = [
  '@deep-foundation/chatgpt-azure',
  '@deep-foundation/chatgpt-azure-deep',
  '@deep-foundation/chatgpt-azure-templates',
  '@deep-foundation/voice-to-sync-text-file',
  '@deep-foundation/deepmemo-links',
  '@deep-foundation/telegram-bot',
  '@deep-foundation/deepmemorybot',
];

export function InstallerProviderCore({
  children
}: InstallerProviderProps) {
  const deep = useDeep();
  const [isAdmin, setIsAdmin] = useState(null);
  const [_installing, setInstalling] = useLocalStore('deepmemo-links-installing', false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const installing = !mounted ? false : _installing;

  useEffect(() => { (async () => {
    if (deep?.linkId) setIsAdmin(await deep.can(null, deep.linkId, deep.idLocal('@deep-foundation/core', 'AllowAdmin')));
    else setIsAdmin(null);
  })() }, [deep, deep?.linkId]);

  const { data: ApiKey } = deep.useDeepId('@deep-foundation/openai', 'ApiKey');
  const { data: UsesApiKey } = deep.useDeepId('@deep-foundation/openai', 'UsesApiKey');
  const { data: Model } = deep.useDeepId('@deep-foundation/openai', 'Model');
  const { data: UsesModel } = deep.useDeepId('@deep-foundation/openai', 'UsesModel');
  const { data: TelegramToken } = deep.useDeepId('@deep-foundation/telegram-bot', 'Token');
  const { data: TelegramActive } = deep.useDeepId('@deep-foundation/telegram-bot', 'Active');
  const { data: DeepmemoryActive } = deep.useDeepId('@deep-foundation/deepmemorybot', 'Active');

  const idsLoaded = ApiKey && UsesApiKey && Model && UsesModel && TelegramToken;

  deep.useDeepSubscription({
    type_id: deep.idLocal('@deep-foundation/core', 'Package'),
    string: { value: { _in: fields } }
  });

  deep.useDeepSubscription({
    ...(idsLoaded ? { type_id: { _in: [ApiKey, UsesApiKey, Model, UsesModel, TelegramToken, TelegramActive] } } : { id: 0 }),
  });

  const { data: [space] } = deep.useDeepSubscription({
    type_id: deep.idLocal('@deep-foundation/core', 'Space'),
    in: {
      type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: deep?.linkId,
      string: { value: 'deepmemo' }
    }
  });

  const find = useCallback((name) => ({
    type_id: deep.idLocal('@deep-foundation/core', 'Package'),
    string: { value: name },
  }), []);

  const value: InstallerContextData = {
    installing: installing,
    'isAdmin': isAdmin,
    '@deep-foundation/chatgpt-azure': deep.useMinilinksSubscription(find('@deep-foundation/chatgpt-azure')).map(l => l.toPlain()),
    '@deep-foundation/chatgpt-azure-deep': deep.useMinilinksSubscription(find('@deep-foundation/chatgpt-azure-deep')).map(l => l.toPlain()),
    '@deep-foundation/chatgpt-azure-templates': deep.useMinilinksSubscription(find('@deep-foundation/chatgpt-azure-templates')).map(l => l.toPlain()),
    '@deep-foundation/voice-to-sync-text-file': deep.useMinilinksSubscription(find('@deep-foundation/voice-to-sync-text-file')).map(l => l.toPlain()),
    '@deep-foundation/deepmemo-links': deep.useMinilinksSubscription(find('@deep-foundation/deepmemo-links')).map(l => l.toPlain()),
    '@deep-foundation/telegram-bot': deep.useMinilinksSubscription(find('@deep-foundation/telegram-bot')).map(l => l.toPlain()),
    '@deep-foundation/deepmemorybot': deep.useMinilinksSubscription(find('@deep-foundation/deepmemorybot')).map(l => l.toPlain()),
    'ApiKey': deep.useMinilinksSubscription({ type_id: ApiKey || 0 }).map(l => l.toPlain()),
    'UsesApiKey': deep.useMinilinksSubscription({ type_id: UsesApiKey || 0 }).map(l => l.toPlain()),
    'Model': deep.useMinilinksSubscription({ type_id: Model || 0 }).map(l => l.toPlain()),
    'UsesModel': deep.useMinilinksSubscription({ type_id: UsesModel || 0 }).map(l => l.toPlain()),
    'TelegramToken': deep.useMinilinksSubscription({ type_id: TelegramToken || 0 }).map(l => l.toPlain()),
    'TelegramActive': deep.useMinilinksSubscription({ type_id: TelegramActive || 0 }).map(l => l.toPlain()),
    'DeepmemoryActive': deep.useMinilinksSubscription({ type_id: DeepmemoryActive || 0 }).map(l => l.toPlain()),

    space: space?.toPlain(),
    
    installed: false,
    status: null,
  };
  value.installed = fields.every(key => !!value[key]?.length);
  value.status = value.installed && value.isAdmin;

  value.defineSpace = async () => {
    const { data: [space] } =await deep.insert({
      type_id: deep.idLocal('@deep-foundation/core', 'Space'),
      in: { data: {
        type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: deep?.linkId,
        string: { data: { value: 'deepmemo' } }
      } },
    });
  }

  value.install = async () => {
    if (!!deep && !installing && !value.status) {
      setInstalling(true);

      const Install = await deep.id('@deep-foundation/npm-packager', 'Install');

      await deep.insert({
        type_id: deep.idLocal('@deep-foundation/core', 'Join'),
        from_id: await deep.id('deep','users','packages'),
        to_id: deep?.linkId,
        in: { data: [
          { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: deep?.linkId },
        ]}
      });

      const installPackage = async (name) => {
        const { data: [chatgptAzure] } = await deep.insert({
          type_id: deep.idLocal('@deep-foundation/core', 'PackageQuery'),
          string: { data: { value: name } },
          in: { data: [
            { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: deep?.linkId },
            {
              type_id: Install,
              from_id: deep?.linkId,
              in: { data: [
                { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: deep?.linkId },
              ] },
            },
          ] },
        });
        const { data: [chatgptAzureInstall] } = await deep.select({ to_id: chatgptAzure?.id, type_id: Install });
        await deep.await(chatgptAzureInstall?.id);
      };
      await installPackage('@deep-foundation/chatgpt-azure');
      await installPackage('@deep-foundation/chatgpt-azure-deep');
      await installPackage('@deep-foundation/chatgpt-azure-templates');
      await installPackage('@deep-foundation/voice-to-sync-text-file');
      await installPackage('@deep-foundation/telegram-bot');
      await installPackage('@deep-foundation/deepmemorybot');
      await deep.insert({
        type_id: await deep.id('@deep-foundation/telegram-bot', 'Bot'),
        in: { data: [
          {
            type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: deep?.linkId,
            string: { data: { value: 'telegramBotDeepmemory' } },
          },
        ] },
      });
      await deep.insert({
        type_id: await deep.id('@deep-foundation/deepmemorybot', 'Active'),
        from_id: await deep.id(deep?.linkId, 'telegramBotDeepmemory'),
        to_id: await deep.id(deep?.linkId, 'telegramBotDeepmemory'),
        in: { data: [
          { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: deep?.linkId },
        ] },
      });
      await deep.insert({
        type_id: await deep.id('@deep-foundation/telegram-bot', 'Token'),
        string: { data: { value: '' } },
        in: { data: [
          {
            type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: deep?.linkId,
            string: { data: { value: 'telegramBotDeepmemoryToken' } },
          },
        ] },
      });

      await deep.insert({
        type_id: deep.idLocal('@deep-foundation/core', 'HandleInsert'),
        from_id: deep.idLocal('@deep-foundation/core', 'AsyncFile'),
        to_id: await deep.id('@deep-foundation/voice-to-sync-text-file', 'handler'),
        in: { data: {
          type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: deep?.linkId,
        } },
      });

      await installPackage('@deep-foundation/deepmemo-links');
      
      await value.defineSpace();

      setInstalling(false);
    }
  };

  value.reset = useCallback(() => setInstalling(false), [value.status, installing]);

  value.saveApiKey = useCallback(async (input: string) => {
    if (value.UsesApiKey.length) {
      await deep.update({ value: input }, { link_id: value.UsesApiKey[0].id });
    } else {
      await deep.insert({
        type_id: ApiKey,
        string: { data: { value: input } },
        in: { data: [
          {
            type_id: UsesApiKey,
            from_id: value['@deep-foundation/chatgpt-azure-templates'][0].id,
            in: { data: [
              { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: deep?.linkId },
            ] },
          },
          {
            type_id: UsesApiKey,
            from_id: value['@deep-foundation/chatgpt-azure'][0].id,
            in: { data: [
              { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: deep?.linkId },
            ] },
          },
        ] },
      });
    }
  }, [deep, value]);
  value.saveDeepmemoryTelegramToken = useCallback(async (input: string) => {
      await deep.update({ link_id: await deep.id(deep?.linkId, 'telegramBotDeepmemoryToken') }, { value: input }, { table: 'strings' });
  }, [deep, value]);
  value.telegramDeepmemoryBotStatus = useCallback(async (status: boolean) => {
    const { data: [active] } = await deep.select({
      type_id: await deep.id('@deep-foundation/telegram-bot', 'Active'),
      from_id: await deep.id(deep?.linkId, 'telegramBotDeepmemory'),
      to_id: await deep.id(deep?.linkId, 'telegramBotDeepmemoryToken'),
    });
    if (status && !active) {
      await deep.insert({
        type_id: await deep.id('@deep-foundation/telegram-bot', 'Active'),
        from_id: await deep.id(deep?.linkId, 'telegramBotDeepmemory'),
        to_id: await deep.id(deep?.linkId, 'telegramBotDeepmemoryToken'),
        in: { data: [
          { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: deep?.linkId },
        ] },
      })
    } else if (!status && !!active) {
      await deep.delete(active.id);
    }
  }, [deep, value]);
  value.deepmemoryBotStatus = useCallback(async (status: boolean) => {
    const { data: [active] } = await deep.select({
      type_id: await deep.id('@deep-foundation/deepmemorybot', 'Active'),
      from_id: await deep.id(deep?.linkId, 'telegramBotDeepmemory'),
      to_id: await deep.id(deep?.linkId, 'telegramBotDeepmemory'),
    });
    if (status && !active) {
      await deep.insert({
        type_id: await deep.id('@deep-foundation/deepmemorybot', 'Active'),
        from_id: await deep.id(deep?.linkId, 'telegramBotDeepmemory'),
        to_id: await deep.id(deep?.linkId, 'telegramBotDeepmemory'),
        in: { data: [
          { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: deep?.linkId },
        ] },
      })
    } else if (!status && !!active) {
      await deep.delete(active.id);
    }
  }, [deep, value]);
  value.saveUsesModel = useCallback(async (id: Id) => {
    await deep.delete({ _or: [
      { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), to: { type_id: UsesModel } },
      { type_id: UsesModel },
    ] });
    await deep.insert({
      type_id: UsesModel,
      from_id: value['@deep-foundation/chatgpt-azure-templates'][0].id,
      to_id: id,
      in: { data: [
        { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: deep?.linkId },
      ] },
    });
  }, [deep, value]);

   return <>
    <installerContext.Provider value={value}>
      {children}
    </installerContext.Provider>
  </>
}

export function InstallerProvider({
  children
}: InstallerProviderProps) {
  const deep = useDeep();
  return <>{!!deep ? <InstallerProviderCore>{children}</InstallerProviderCore> : children}</>
}
