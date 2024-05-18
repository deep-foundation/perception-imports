import { useDeep } from '@deep-foundation/deeplinks/imports/client';
import { Id } from '@deep-foundation/deeplinks/imports/minilinks';
import { GenericResponse, RecordingData, VoiceRecorder } from 'capacitor-voice-recorder';
import isNil from 'lodash/isNil';
import omitBy from 'lodash/omitBy';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useDevice } from "./device";
import { saverContext, useSaver } from "./saver";
import axios from 'axios';
import { base64ToBlob, blobToBase64 } from 'base64-blob';
import { gql } from 'graphql-tag';

interface Voice {
  id?: Id;
  record: string;
  duration: number;
  mimeType: string;
}

interface VoiceContext {
  status: boolean | null;
  recording: boolean;
  paused: boolean;
  check: () => Promise<boolean | null>;
  request: () => Promise<boolean | null>;
  start: () => Promise<boolean>;
  pause: () => Promise<boolean>;
  resume: () => Promise<boolean>;
  stop: () => Promise<Voice | null>;
}

interface VoiceProviderProps {
  children?: any;
  saver?: boolean;
  containerId?: Id | null;
}

export function useVoiceSync (_containerId) {
  const deep = useDeep();
  const { onSave } = useContext(saverContext);
  return useCallback(async (voice: Voice) => {
    if (deep && _containerId) {
      const Type = deep.idLocal('@deep-foundation/core', 'AsyncFile');
      const promise = (async () => {
        const { data: [{ id }] } = await deep.insert({
          type_id: Type,
          in: { data: {
            type_id: deep.idLocal('@deep-foundation/core', 'Contain'),
            from_id: _containerId,
          } },
        });
        if (!!id) {
          await deep.client.query({
            query: gql`query DEEPMEMO_UPLOAD($voice: Voice!) { deepmemo_upload(voice: $voice) }`,
            variables: { voice: { id, ...voice } },
          });
          // const audio = new Audio(`data:${voice.mimeType};base64,${voice.record}`);
          // const responce = await fetch(audio.src);
          // const blob = await responce.blob();
          // var formData = new FormData();
          // formData.append("file", blob);
          // console.log({ audio, responce, blob, formData });
          // await axios.post(`http${deep.client.ssl ? 's' : ''}://${deep.client.path.slice(0, -4)}/file`, formData, {
          //   headers: {
          //     'linkId': id,
          //     "Authorization": `Bearer ${deep.token}`,
          //   },
          // })
        }
        return id;
      })();
      onSave({ Type, object: voice, id: null, name: null, containerId: _containerId, promise, mode: 'voice' });
      return await promise;
    }
  }, [deep, _containerId]);
};

export const voiceContext = createContext<VoiceContext | null>(null);

export function useVoice() {
  return useContext(voiceContext);
}

export function VoiceProvider({
  children,
  containerId,
  saver = false,
}: VoiceProviderProps) {
  const device = useDevice();
  const _containerId = containerId || device?.id;
  const [status, setStatus] = useState<boolean | null>(null);
  const [recording, setRecording] = useState<boolean>(false);
  const pauseRef = useRef<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  useEffect(() => { pauseRef.current = paused; }, [paused]);
  const check: VoiceContext['check'] = useCallback(async (): Promise<VoiceContext['status']> => {
    const { value: can } = await VoiceRecorder.canDeviceVoiceRecord();
    const { value: allowed } = await VoiceRecorder.hasAudioRecordingPermission();
    return allowed && can;
  }, []) as any;
  const request: VoiceContext['request'] = useCallback(async (): Promise<VoiceContext['status']> => {
    const { value: can } = await VoiceRecorder.canDeviceVoiceRecord();
    const { value: allowed } = await VoiceRecorder.hasAudioRecordingPermission();
    let status;
    if (can && !allowed) {
      const { value: request } = await VoiceRecorder.requestAudioRecordingPermission();
      status = request;
    } else {
      status = allowed && can;
    }
    setStatus(status);
    return status;
  }, []) as any;
  const start: VoiceContext['start'] = useCallback(async (): Promise<VoiceContext['status']> => {
    // "MISSING_PERMISSION", "ALREADY_RECORDING", "MICROPHONE_BEING_USED", "DEVICE_CANNOT_VOICE_RECORD", or "FAILED_TO_RECORD"
    const started = await VoiceRecorder.startRecording()
      .then((result: GenericResponse) => result.value)
      .catch(error => {
        if (['MICROPHONE_BEING_USED','MISSING_PERMISSION','DEVICE_CANNOT_VOICE_RECORD','FAILED_TO_RECORD'].includes(error.message)) {
          return false;
        }
      });
    setRecording(started);
    return started;
  }, []) as any;
  const pause: VoiceContext['pause'] = useCallback(async (): Promise<VoiceContext['paused']> => {
    const paused = await VoiceRecorder.pauseRecording()
      .then((result: GenericResponse) => result.value)
      .catch(error => false);
    setPaused(paused);
    return paused;
  }, []) as any;
  const resume: VoiceContext['resume'] = useCallback(async (): Promise<VoiceContext['paused']> => {
    const resumed = await VoiceRecorder.resumeRecording()
      .then((result: GenericResponse) => result.value)
      .catch(error => false);
    setPaused(!resumed);
    return !resumed;
  }, []) as any;
  const stop: VoiceContext['stop'] = useCallback(async (): Promise<Voice | null> => {
    const v = await VoiceRecorder.stopRecording()
      .then((result: RecordingData) => result.value)
      .catch(error => false);
    // @ts-ignore
    setRecording(false);
    if (typeof(v) === 'object') {
      const voice: Voice = { record: v.recordDataBase64, duration: v.msDuration, mimeType: v.mimeType };
      if (saver && _containerId) {
        voice.id = await sync(voice);
      }
      return voice;
    } else {
      return null;
    }
  }, [_containerId, saver]) as any;
  useEffect(() => {
    request().then(() => {});
  }, []);
  const sync = useVoiceSync(_containerId);
  return <>
    <voiceContext.Provider value={{ status, recording, paused, check, request, start, stop, pause, resume }}>
      {children}
    </voiceContext.Provider>
  </>
}