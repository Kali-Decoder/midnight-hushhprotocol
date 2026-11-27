import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {ProfilePage} from "@/components/ProfilePage";
import {
  isReservedPath,
  normalizeUsernameParam,
} from "@/lib/routes";

type Props = {params: Promise<{username: string}>};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {username: raw} = await params;
  const username = normalizeUsernameParam(raw);
  if (!username || isReservedPath(username)) {
    return {title: "Not found", robots: {index: false}};
  }
  return {
    title: `@${username}`,
    description: `Pay @${username} privately in NIGHT on Midnight. Tips are sealed to their .night passport.`,
    alternates: {canonical: `/${username}`},
  };
}

export default async function UsernameProfilePage({params}: Props) {
  const {username: raw} = await params;
  const username = normalizeUsernameParam(raw);
  if (!username || isReservedPath(username)) notFound();
  return <ProfilePage username={username} />;
}
