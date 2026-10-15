import { cn } from "./cn";
const control = "min-h-11 w-full rounded-lg border border-navy/20 bg-white px-3 text-sm placeholder:text-navy/70 aria-[invalid=true]:border-danger";

export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: React.ReactNode; htmlFor: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-navy/75">{hint}</p>}
      {error && <p role="alert" className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
export const Input = ({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) => <input className={cn(control, className)} {...p} />;
export const Select = ({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => <select className={cn(control, className)} {...p} />;
export const Textarea = ({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className={cn(control, "min-h-28 py-2", className)} {...p} />;
