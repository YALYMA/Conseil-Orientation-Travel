import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/public/AuthForms";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function Page() {
  return (<><h1 className="font-display mb-2 text-2xl font-extrabold">Mot de passe oublié</h1>
    <p className="mb-6 text-sm text-navy/75">Saisissez l&apos;adresse e-mail de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
    <ForgotPasswordForm /></>);
}
