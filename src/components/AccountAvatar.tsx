import { useState } from "react";
import { UserRound } from "lucide-react";
import type { AccountProfile } from "../lib/profile";

export default function AccountAvatar({
  profile,
  large = false,
}: {
  profile?: AccountProfile | null;
  large?: boolean;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const image =
    profile?.imageUrl && profile.imageUrl !== failedImage
      ? profile.imageUrl
      : null;
  const initials = profile?.displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={`account-avatar ${large ? "account-avatar-large" : ""}`}
      aria-hidden="true"
    >
      {image ? (
        <img
          src={image}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailedImage(image)}
        />
      ) : initials ? (
        initials
      ) : (
        <UserRound size={large ? 27 : 18} />
      )}
    </span>
  );
}
