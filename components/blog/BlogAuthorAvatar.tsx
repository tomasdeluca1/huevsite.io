import Image from "next/image";

const PLATFORM_AVATAR = "/huevsite-avatar.png";
const PLATFORM_AVATAR_THUMBNAIL = "/huevsite-avatar-80.webp";

export function BlogAuthorAvatar({ src, name }: { src: string; name: string }) {
  // Builder avatars can be on hosts outside Next's image optimizer allowlist.
  return (
    <Image
      src={src === PLATFORM_AVATAR ? PLATFORM_AVATAR_THUMBNAIL : src}
      alt={name}
      width={40}
      height={40}
      className="rounded-full object-cover"
      unoptimized
    />
  );
}
