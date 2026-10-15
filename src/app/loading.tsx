import { LoadingSkeleton } from "@/components/ui/EmptyState";

export default function Loading() {
  return <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12"><LoadingSkeleton lines={4} /></div>;
}
