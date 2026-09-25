"use client";

import Link from "next/link";
import { InstagramLogoIcon, FacebookLogoIcon, QuestionIcon } from "@phosphor-icons/react";
import SocialMediaLink from "./Social-media-links";

export default function FooterLanding() {
  return (
    <footer className="w-full bg-primary-400 border-b border-accent-300 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-center max-w-screen-xl mx-auto gap-4">
       <SocialMediaLink
        href="https://www.instagram.com/lalista.aplicacion/"
        icon={<InstagramLogoIcon size={20} weight="fill" />}
        className="primary-400"
        />
        <Link
          href="/preguntas-frecuentes"
          aria-label="Preguntas frecuentes"
          className="text-white/70 transition-colors hover:text-white"
        >
          <QuestionIcon size={20} weight="fill" />
        </Link>
      </div>
      <div className="text-center text-sm text-white/70 mt-2">
        &copy; {new Date().getFullYear()} LaLista. Todos los derechos reservados.
      </div>
    </footer>
  );
}