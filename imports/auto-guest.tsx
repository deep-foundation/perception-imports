import { useDeep } from "@deep-foundation/deeplinks/imports/client";
import { useTokenController } from "@deep-foundation/deeplinks/imports/react-token";
import { useLocalStore } from "@deep-foundation/store/local";
import Debug from 'debug';
import React, { useEffect, useState } from "react";

const debug = Debug('perception:auto-guest');

export const AutoGuest = React.memo(function AutoGuest({
  children,
}: {
  children?: any;
}) {
  const deep = useDeep();
  const [token] = useTokenController();
  const [isAuth, setIsAuth] = useState(false);
  // console.log({ token, deep, t });
  useEffect(() => {
    // const isAuth = !!(deep.linkId && token && token === deep.token);
    // We use as axiom - deep.token already synced with token
    const isAuth = !!(deep?.linkId && token && token === deep.token);
    debug('useCheckAuth', 'token', token, 'deep.token', deep?.token, 'isAuth', isAuth);
    // validate
    if (isAuth) (async () => {
      const result = await deep.select({ id: deep.linkId });
      if (!result?.data?.length) {
        debug(`user ${deep.linkId} invalid`);
        deep.logout();
      } else {
        debug(`user ${deep.linkId} valid`);
      }
    })();
    // fill
    if (!token) (async () => {
      const g = await deep.guest();
      debug(`guest ${deep.linkId} inserted and logged in`);
    })();
    setIsAuth(isAuth);
  }, [token, deep?.linkId]);
  return <>
    {isAuth ? children : null}
  </>
});