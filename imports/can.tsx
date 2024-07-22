import { useDeep } from "@deep-foundation/deeplinks/imports/client";
import { Id } from "@deep-foundation/deeplinks/imports/minilinks";

export function useCanByContain(id: Id) {
  const deep = useDeep();
  const { data: [result] } = deep.useQuery({
    id: id,
    up: {
      tree_id: deep.idLocal('@deep-foundation/core', 'containTree'),
      parent: {
        up: {
          tree_id: deep.idLocal('@deep-foundation/core', 'joinTree'),
          parent: {
            down: {
              tree_id: deep.idLocal('@deep-foundation/core', 'containTree'),
              link_id: id
            }
          }
        }
      },
    },
  });
  return !!result;
}