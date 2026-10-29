export type AccountProfile = {
  displayName: string;
  email: string | null;
  imageUrl: string | null;
};

// Clerk copies OAuth photos to the user's profile in most cases. If it hasn't,
// use the connected Google photo until the user chooses their own profile photo.
export function accountProfile(user: {
  fullName?: string | null;
  firstName?: string | null;
  username?: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
  hasImage?: boolean;
  imageUrl?: string | null;
  externalAccounts?: readonly { provider: string; imageUrl?: string | null }[];
}): AccountProfile {
  const email = user.primaryEmailAddress?.emailAddress || null;
  const googlePhoto = user.externalAccounts?.find((account) =>
    ["google", "oauth_google"].includes(String(account.provider)),
  )?.imageUrl;
  return {
    displayName:
      user.fullName ||
      user.firstName ||
      user.username ||
      email?.split("@")[0] ||
      "Your account",
    email,
    imageUrl: (user.hasImage && user.imageUrl) || googlePhoto || null,
  };
}
