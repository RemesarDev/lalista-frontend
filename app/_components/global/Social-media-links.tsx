import Link from 'next/link';
import type { ReactNode } from 'react';

type SocialMediaLinkProps = {
    href: string;
    icon: ReactNode;
    label?: string;
    className?: string;
};

export default function SocialMediaLink({ href, icon, label, className = '' }: SocialMediaLinkProps) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center rounded-full px-2 py-2 font-bold text-white transition-colors hover:bg-blue-700 ${className}`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    )
}