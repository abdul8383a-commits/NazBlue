import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
      <p className="text-primary font-medium tracking-widest uppercase text-sm">Loading</p>
    </div>
  );
}
