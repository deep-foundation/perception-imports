import { useDeep } from "@deep-foundation/deeplinks/imports/client";
import { memo } from "react";

export const Loader = memo(function Loader() {
  const deep = useDeep();
  deep.useDeepSubscription({
    limit: 100,
    order_by: { id: 'desc' },
  });
  return null;
}, () => true);