import { Suspense } from "react";
import { DocumentsView } from "@/components/admin/SectionViews";

export default function Page() {
  return (
    <Suspense>
      <DocumentsView />
    </Suspense>
  );
}
