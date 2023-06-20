import { createInnerTRPCContext } from './trpc';
import superjson from 'superjson';
import { appRouter } from './root';
import { createServerSideHelpers } from '@trpc/react-query/server'

export function ssgHelper() {
    return createServerSideHelpers({
        router: appRouter,
        ctx: createInnerTRPCContext({ session: null, revalidateSSG: null }),
        transformer: superjson
    })
}