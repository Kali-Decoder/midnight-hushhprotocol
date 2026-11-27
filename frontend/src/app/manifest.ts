import type {MetadataRoute} from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hushh Protocol",
    short_name: "Hushh",
    description: "Pay anyone by @name. Own a .night name, get tips sealed to you, claim them with a zero-knowledge proof on Midnight.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f2ed",
    theme_color: "#0a0a0a",
    icons: [
      {src: "/icon.png", sizes: "512x512", type: "image/png"},
      {src: "/apple-icon.png", sizes: "512x512", type: "image/png"},
    ],
  };
}
