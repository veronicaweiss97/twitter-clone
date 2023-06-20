import { protectedProcedure } from './../trpc';
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { publicProcedure } from './../trpc';
import {
    createTRPCRouter,
} from "y/server/api/trpc";
import { z } from 'zod';


export const profileRouter = createTRPCRouter({
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input: { id }, ctx }) => {
            const currentUserId = ctx.session?.user.id
            const profile = await ctx.prisma.user.findUnique({
                where: { id },
                select: {
                    name: true,
                    image: true,
                    _count: { select: { followers: true, followes: true, tweets: true } },
                    followers: currentUserId == null
                        ? undefined
                        : {
                            where: { id: currentUserId }
                        }
                }
            })
            if (profile == null) return
            return {
                name: profile.name,
                image: profile.image,
                followersCount: profile._count.followers,
                followsCount: profile._count.followes,
                tweetsCount: profile._count.tweets,
                isFollowing: profile.followers.length > 0
            }
        }),
    toggleFollow: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .mutation(async ({ input: { userId }, ctx }) => {
            const currentUserId = ctx.session.user.id
            const existingFollow = await ctx.prisma.user.findFirst({
                where: {
                    id: userId,
                    followers: {
                        some: {
                            id: currentUserId
                        }
                    }
                }
            })
            let addedFollow;
            if (existingFollow == null) {
                await ctx.prisma.user.update({
                    where: {
                        id: userId
                    },
                    data: {
                        followers: {
                            connect: {
                                id: currentUserId
                            }
                        }
                    }
                })
                addedFollow = true
            } else {
                await ctx.prisma.user.update({
                    where: {
                        id: userId
                    },
                    data: {
                        followers: {
                            disconnect: {
                                id: currentUserId
                            }
                        }
                    }
                })
                addedFollow = false
            }
            void ctx.revalidateSSG?.(`/profiles/${userId}`)
            void ctx.revalidateSSG?.(`/profiles/${currentUserId}`)

            return { addedFollow }
        })
})
