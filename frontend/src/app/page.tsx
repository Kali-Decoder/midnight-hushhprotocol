import type {Metadata} from "next";
import StoryLanding from "@/components/story/StoryLanding";

export const metadata: Metadata = {
  alternates: {canonical: "/"},
};

export default function Home() {
  return <StoryLanding />;
}
