"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  const isWeekView = pathname === "/";
  const isStoryPage = pathname.startsWith("/story");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-8 py-3">
        <div className="flex items-center justify-center gap-8">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              isWeekView
                ? "text-gray-900 border-b-2 border-gray-900 pb-1"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Week View
          </Link>
          <Link
            href="/story"
            className={`text-sm font-medium transition-colors ${
              isStoryPage
                ? "text-gray-900 border-b-2 border-gray-900 pb-1"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Stories
          </Link>
        </div>
      </div>
    </nav>
  );
}
