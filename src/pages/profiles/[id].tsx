/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  type GetStaticPropsContext,
  type NextPage,
  type GetStaticPaths,
  type InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import { ssgHelper } from "y/server/api/ssgHelper";
import { api } from "y/utils/api";
import ErrorPage from "next/error";
import Link from "next/link";
import { IconHoverEffect } from "y/components/IconHoverEffect";
import { VscArrowLeft } from "react-icons/vsc";
import { ProfileImage } from "y/components/ProfileImage";
import { FollowButton } from "y/components/FollowButton";
import { InfiniteTweetList } from "y/components/InfiniteTweetList";

const ProfilePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  id,
}) => {
  const { data: profile } = api.profile.getById.useQuery({ id });
  const tweets = api.tweet.infiniteProfileFeed.useInfiniteQuery(
    { userId: id },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  const trpcUtils = api.useContext();
  const toggleFollow = api.profile.toggleFollow.useMutation({
    onSuccess: ({ addedFollow }) => {
      trpcUtils.profile.getById.setData({ id }, (oldData) => {
        if (oldData == null) return;
        const countModifier = addedFollow ? 1 : -1;
        return {
          ...oldData,
          isFollowing: addedFollow,
          followersCount: Number(oldData.followsCount) + countModifier,
        };
      });
    },
  });
  if (profile == null || profile.name == null)
    return <ErrorPage statusCode={404} />;
  return (
    <>
      <Head>
        <title>{`Twitter Clone ${profile.name}`}</title>
      </Head>
      <header className="sticky top-0 z-10 flex items-center border-b bg-white px-4 py-2">
        <Link href=".." className="mr-2">
          <IconHoverEffect>
            <VscArrowLeft className="h-6 w-6" />
          </IconHoverEffect>
        </Link>
        <ProfileImage
          src="https://veronica-dev.ru/src/img/me.jpg"
          className="flex-shrink-0"
        />
        <div
          className="ml-2 flex-grow
        "
        >
          <h1 className="text-lg font-bold">{profile.name}</h1>
          <div className="text-gray-500">
            {profile.tweetsCount}{" "}
            {getPlural(profile.tweetsCount, "Tweet", "Tweets")} -{" "}
            {profile.followersCount}{" "}
            {getPlural(profile.followersCount, "Follower", "Followers")} -{" "}
            {profile.followsCount} Following
          </div>
        </div>
        <FollowButton
          isFollowing={profile.isFollowing}
          isLoading={toggleFollow.isLoading}
          userId={id}
          onClick={() => {
            toggleFollow.mutate({ userId: id });
          }}
        />
      </header>
      <main>
        <InfiniteTweetList
          tweets={tweets?.data?.pages?.flatMap((page) => page?.tweets)}
          isError={tweets.isError}
          isLoading={tweets.isLoading}
          hasMore={tweets.hasNextPage}
          fetchNewTweets={tweets.fetchNextPage}
        />
      </main>
    </>
  );
};

const pluralRules = new Intl.PluralRules();
function getPlural(number: number, singular: string, plural: string) {
  return pluralRules.select(number) === "one" ? singular : plural;
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export async function getStaticProps(
  context: GetStaticPropsContext<{ id: string }>
) {
  const id = context.params?.id;
  if (id == null) {
    return {
      redirect: {
        destination: "/",
      },
    };
  }
  const ssg = ssgHelper();
  await ssg.profile.getById.prefetch({ id });

  return {
    props: {
      id,
      trpcState: ssg.dehydrate(),
    },
  };
}

export default ProfilePage;
