import { useRouter } from "next/router";
import Link from "next/link";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-bold text-white hover:text-blue-400">
            Admin
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/admin/projects/new"
              className="text-gray-400 hover:text-white transition-colors"
            >
              + Project
            </Link>
            <Link
              href="/admin/experiences/new"
              className="text-gray-400 hover:text-white transition-colors"
            >
              + Experience
            </Link>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
