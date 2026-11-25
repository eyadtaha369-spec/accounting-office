import { Suspense } from "react";
import { FinanceView } from "@/components/admin/SectionViews";

export default function Page() {
  return (
    <Suspense>
      <FinanceView />
    </Suspense>
  );
}
