import Link from "next/link";
import { LogoMark } from "@/components/visual/LogoMark";
import { Icon, type IconName } from "@/components/visual/Icon";
import { NavLink } from "./NavLink";
import { MoreMenu } from "./MoreMenu";

export interface ShellItem { href: string; label: string; icon: IconName; short?: string; exact?: boolean }
interface Props {
  roleLabel: string; userName: string; items: ShellItem[];
  /** href des 4 pages affichées dans la barre d'onglets mobile ; les autres vont dans « Plus ». */
  tabs: string[]; signOutAction: () => Promise<void>; children: React.ReactNode;
}

const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";

/** Cadre commun des espaces étudiant, conseiller et administrateur : barre latérale (ordinateur) / barre d'onglets (mobile). */
export function AppShell({ roleLabel, userName, items, tabs, signOutAction, children }: Props) {
  const tabItems = tabs.map((h) => items.find((i) => i.href === h)).filter((i): i is ShellItem => !!i);
  const moreItems = items.filter((i) => !tabs.includes(i.href));
  const signOutBtn = (cls: string) => (
    <form action={signOutAction}><button className={cls}><Icon name="logout" />Déconnexion</button></form>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ordinateur : barre latérale */}
      <aside className="relative hidden w-72 shrink-0 overflow-hidden bg-gradient-to-b from-navy to-[#052a50] text-white lg:flex lg:flex-col">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-brand/30 blur-3xl" />
        <div className="sticky top-0 flex h-screen flex-col px-4 py-6">
          <Link href="/" className="flex items-center gap-3 px-2"><LogoMark /><span className="font-display text-base font-extrabold leading-tight">Conseil-Orientation-<br />Travel</span></Link>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold font-display text-sm font-extrabold text-navy">{initials(userName)}</span>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{userName}</p><p className="text-xs text-white/75">{roleLabel}</p></div>
          </div>
          <nav aria-label={roleLabel} className="mt-5 flex flex-1 flex-col gap-1 overflow-y-auto pl-3 pr-1">{items.map((i) => <NavLink key={i.href} {...i} variant="side" />)}</nav>
          <div className="mt-3 space-y-1 border-t border-white/15 pt-3">
            <Link href="/" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/80 hover:bg-white/10 hover:text-white"><Icon name="home" />Retour au site</Link>
            {signOutBtn("flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-white/80 hover:bg-white/10 hover:text-white")}
          </div>
        </div>
      </aside>

      {/* mobile : barre supérieure compacte */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy px-4 pb-3 pt-safe text-white lg:hidden">
        <Link href="/" className="mt-3 flex min-h-11 items-center gap-2.5"><LogoMark className="size-8" /><span className="font-display text-sm font-extrabold">Conseil-Orientation-Travel</span></Link>
        <span className="mt-3 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">{roleLabel}</span>
      </header>

      <main className="min-w-0 flex-1 bg-surface px-4 pb-28 pt-5 sm:px-8 lg:px-10 lg:pb-10 lg:pt-8">{children}</main>

      {/* mobile : barre d'onglets */}
      <nav aria-label={`${roleLabel} (navigation principale)`} className="fixed inset-x-0 bottom-0 z-40 border-t border-navy/10 bg-white pb-safe shadow-[0_-8px_24px_-12px_rgba(6,59,112,.25)] lg:hidden">
        <div className="mx-auto flex max-w-xl">
          {tabItems.map((i) => <NavLink key={i.href} href={i.href} label={i.short ?? i.label} icon={i.icon} exact={i.exact} variant="tab" />)}
          <MoreMenu items={moreItems.map(({ href, label, icon }) => ({ href, label, icon }))}>
            {signOutBtn("flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-navy hover:bg-brand-soft")}
          </MoreMenu>
        </div>
      </nav>
    </div>
  );
}
