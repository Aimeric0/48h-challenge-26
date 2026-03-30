import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
