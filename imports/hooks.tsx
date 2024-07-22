import { useDeep } from "@deep-foundation/deeplinks/imports/client";
import { Id } from "@deep-foundation/deeplinks/imports/minilinks";
import { useTheme, useColorMode } from '@chakra-ui/react';

export function useCanByContain(id: Id) {
  const deep = useDeep();
  const { data } = deep.useQuery({
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
  return !!data?.length;
}

export function useChakraColor(color: string) {
  const theme = useTheme();
  return theme.__cssMap[`colors.${color}`]?.value;
}
