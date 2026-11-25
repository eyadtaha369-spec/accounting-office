import { Suspense } from "react";
import { ReportsView } from "@/components/admin/SectionViews";

export default function Page() {
  return (
    <Suspense>
      <ReportsView />
    </Suspense>
  );
}
