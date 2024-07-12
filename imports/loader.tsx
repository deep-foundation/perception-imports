import { useDeep } from "@deep-foundation/deeplinks/imports/client";

export function Loader() {
  const deep = useDeep();
  deep.useDeepSubscription({
  });
  return null;
}