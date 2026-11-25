import { Suspense } from "react";
import RequestsView from "@/components/admin/RequestsView";

export default function Page() {
  return (
    <Suspense>
      <RequestsView />
    </Suspense>
  );
}
