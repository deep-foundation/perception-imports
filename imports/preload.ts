import type { NextApiRequest, NextApiResponse } from 'next';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { DeepClient } from '@deep-foundation/deeplinks';
import axios from 'axios';

let _path, ssl = true;
try { _path = process.env.GQL || process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://deeplinks.deep.foundation/gql' } catch(e) {}
try { ssl = new URL(_path).protocol === "https:" } catch(e) {}
_path = _path.replace(/(^\w+:|^)\/\//, '');

const _secret = process.env.SECRET || process.env.DEEPLINKS_HASURA_SECRET;
const _token = process.env.TOKEN || process.env.NEXT_PUBLIC_DEEP_TOKEN;

type Preloaded = {
    handlers: any[];
    packages: any[];
}

export function preloadQueries(deep) {
    const packagesQ = {
        type_id: {
            _nin: [
                deep.idLocal('@deep-foundation/core', 'Promise'),
                deep.idLocal('@deep-foundation/core', 'Then'),
                deep.idLocal('@deep-foundation/core', 'Rejected'),
                deep.idLocal('@deep-foundation/core', 'Resolved'),
                deep.idLocal('@deep-foundation/core', 'PromiseResult'),
            ]
        },
        up: {
            tree_id: { _eq: deep.idLocal('@deep-foundation/core', 'containTree') },
            parent: {
                type_id: { _eq: deep.idLocal('@deep-foundation/core', 'Package') },
                string: { value: { _neq: 'deep' } },
            },
        },
        return: {
            _version: {
                relation: 'in',
                type_id: deep.idLocal('@deep-foundation/core', 'PackageVersion')
            },
        },
    };

    const packagesO = { apply: 'packages' };

    const handlersQ = {
        execution_provider_id: { _eq: deep.idLocal('@deep-foundation/core', 'JSExecutionProvider') },
        return: {
            dist: { relation: 'dist' }
        },
    };

    const handlersO: any = { table: 'handlers' };

    return { packagesQ, packagesO, handlersQ, handlersO, };
}

export function preloadApi(path = _path, secret = _secret, token = _token) {
    const deep = new DeepClient({
        apolloClient: generateApolloClient({
            path: path,
            ssl: ssl,
            secret: secret,
            token: token,
            ws: true,
        }),
    });

    const preloaded = {
        packages: [],
        handlers: [],
    };

    const { packagesQ, packagesO, handlersQ, handlersO } = preloadQueries(deep);

    deep.subscribe(packagesQ, packagesO).subscribe({
        // @ts-ignore
        next: ({ plainLinks: packages }) => {
            // console.log('packages', packages);
            preloaded.packages = packages;
        },
    });
    
    deep.subscribe(handlersQ, handlersO).subscribe({
        // @ts-ignore
        next: ({ data: handlers }) => {
            preloaded.handlers = handlers;
        },
    });

    let initial = false;
    return async function handler(
        req: NextApiRequest,
        res: NextApiResponse<Preloaded>
    ) {
        if (initial) {
            preloaded.packages = (await deep.select(packagesQ, packagesO))?.plainLinks;
            preloaded.handlers = (await deep.select(handlersQ, handlersO))?.data;
        }
        res.status(200).json(preloaded);
    }
}

export async function getServerSidePropsPreload(arg, result) {
  const preload = await axios.get(`${process.env.__NEXT_PRIVATE_ORIGIN}/api/preload`);
  result.props = result?.props || {};
  result.props.preloaded = preload.data;
  return result;
}