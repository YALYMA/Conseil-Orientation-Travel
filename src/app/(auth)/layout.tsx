import { SiteHeader } from "@/components/public/SiteHeader";
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (<><SiteHeader /><main className="mx-auto w-full max-w-md flex-1 px-4 py-12">{children}</main></>);
}
