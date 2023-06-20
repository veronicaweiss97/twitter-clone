import { useSession } from "next-auth/react";
import { Button } from "./Button";
import { LoadingSpinner } from "./LoadingSpinner";

type FollowButtonProps = {
  isFollowing: boolean;
  userId: string;
  isLoading: boolean;
  onClick: () => void;
};

export function FollowButton({
  isFollowing,
  isLoading,
  userId,
  onClick,
}: FollowButtonProps) {
  const session = useSession();
  if (isLoading) return <LoadingSpinner />;
  if (session.status !== "authenticated" || session.data.user.id === userId)
    return null;
  return (
    <Button
      disabled={isLoading}
      onClick={onClick}
      small
      gray={isFollowing}
      className=""
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
