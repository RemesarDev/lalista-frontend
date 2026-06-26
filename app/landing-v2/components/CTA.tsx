"use client";

import Link from 'next/link';

export default function CTA() {
    return (
        <Link href="/signup" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Armá tu lista ahora
        </Link>
    )
}