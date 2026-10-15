import { SiteHeader } from "@/components/public/SiteHeader";
import { SiteFooter } from "@/components/public/SiteFooter";
import { PublicBottomNav } from "@/components/public/PublicBottomNav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Aller au contenu</a>
      <SiteHeader />
      <main id="contenu" className="flex-1">{children}</main>
      <SiteFooter />
      <PublicBottomNav />
    </>
  );
}
