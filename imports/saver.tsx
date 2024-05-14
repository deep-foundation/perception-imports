import { useDeep } from '@deep-foundation/deeplinks/imports/client';
import { Id } from '@deep-foundation/deeplinks/imports/minilinks';
import React, { createContext, useCallback, useContext, useRef } from 'react';

interface SaverState {
  Type: Id;
  object: any;
  id: Id;
  name: string;
  containerId: Id;
  promise: Promise<Id>;
  mode: string;
}

interface SaverContext {
  onSave: (state: SaverState) => void;
}
interface SaverProviderProps extends SaverContext {
  children: any
}

export const saverContext = createContext<SaverContext | null>(null);

export function SaverProvider({ onSave, children }: SaverProviderProps) {
  return <saverContext.Provider value={{ onSave }} children={children}/>;
}

export function useSaver({
  mode,
  getType
}: {
  mode: string;
  getType?: () => Promise<Id>;
}) {
  const saver = useContext(saverContext);
  const deep = useDeep();
  const TypeRef = useRef<Id | null>(null);
  const save = useCallback(async (object: any, id: Id, name: string, containerId: Id, Type: Id) => {
    const Contain = deep.idLocal('@deep-foundation/core', 'Contain');
    if (id) {
      await deep.update({ link_id: id }, { value: object }, { table: 'objects' });
    } else {
      const { data: contains } = await deep.select({ type_id: Contain, from_id: containerId, string: { value: name } });
      if (!contains.length) {
        const { data: [{ id: _id }] } = await deep.insert({
          type_id: Type,
          in: { data: { type_id: Contain, from_id: containerId, string: name } },
          object: object,
        });
        id = _id;
      } else {
        id = contains[0].to_id;
        await deep.update({ link_id: id }, { value: object }, { table: 'objects' });
      }
    }
    return id;
  }, [deep]);
  return useCallback(async (object: any, id: Id, name: string, containerId: Id) => {
    if (deep && containerId) {
      const Type = TypeRef.current = TypeRef.current || await getType();
      const promise = save(object, id, name, containerId, Type);
      if (saver?.onSave) saver.onSave({
        Type, object, id, name, containerId, promise, mode,
      });
      return promise;
    }
  }, [deep]);
}