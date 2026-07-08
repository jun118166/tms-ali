import Link from "next/link";

const links = [
  { href: "/", label: "概览看板" },
  { href: "/waybills", label: "运单管理" },
  { href: "/dispatch", label: "智能分单" },
  { href: "/track", label: "配送跟踪" },
];

export default function Nav() {
  return (
    <header className="bg-brand-700 text-white shadow">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6 flex-wrap">
        <Link href="/" className="font-bold text-lg">
          城配末端分单配送系统
        </Link>
        <nav className="flex gap-4 text-sm flex-wrap">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:underline opacity-90"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="ml-auto text-xs opacity-80 hidden sm:block">
          长沙雨花网点 · 承运商无系统解决方案
        </span>
      </div>
    </header>
  );
}
