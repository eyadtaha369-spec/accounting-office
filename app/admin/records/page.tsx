import { Suspense } from "react";
import { RecordsView } from "@/components/admin/SectionViews";

export default function Page() {
  return (
    <Suspense>
      <RecordsView />
    </Suspense>
  );
}
