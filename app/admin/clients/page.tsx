import { Suspense } from "react";
import ClientsView from "@/components/admin/ClientsView";

export default function Page() {
  return (
    <Suspense>
      <ClientsView />
    </Suspense>
  );
}
