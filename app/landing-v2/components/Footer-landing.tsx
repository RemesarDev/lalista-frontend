"use client";

import { InstagramLogoIcon, FacebookLogoIcon } from "@phosphor-icons/react";
import SocialMediaLink from "./Social-media-links";

export default function FooterLanding() {
  return (
    <footer className="w-full bg-primary-400 border-b border-accent-300 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-center max-w-screen-xl mx-auto gap-4">
       <SocialMediaLink
        href="https://instagram.com"
        icon={<InstagramLogoIcon size={20} weight="fill" />}
        className="primary-400"
        />
       <SocialMediaLink
        href="https://facebook.com"
        icon={<FacebookLogoIcon size={20} weight="fill" />}
        className="primary-400"
        />
      </div>
      <div className="text-center text-sm text-white/70 mt-2">
        &copy; {new Date().getFullYear()} LaLista. Todos los derechos reservados.
      </div>
    </footer>
  );
}