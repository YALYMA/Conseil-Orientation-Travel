import Image from "next/image";
import { CountryScene } from "@/components/visual/CountryScene";
import { findPhoto } from "@/lib/visuals";
import { cn } from "@/components/ui/cn";

/** Visuel d'un pays : la photo déposée dans public/images/pays/<slug>.* si elle existe, sinon l'illustration. Le parent doit être `relative`. */
export function CountryVisual({ slug, className, sizes = "(min-width:1024px) 20vw, 70vw", priority }: { slug: string; className?: string; sizes?: string; priority?: boolean }) {
  const photo = findPhoto("pays", slug);
  return photo
    ? <Image src={photo} alt="" fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />
    : <CountryScene slug={slug} className={cn("absolute inset-0 size-full", className)} />;
}
