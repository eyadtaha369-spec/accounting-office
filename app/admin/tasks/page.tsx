import { Suspense } from "react";
import { TasksView } from "@/components/admin/SectionViews";

export default function Page() {
  return (
    <Suspense>
      <TasksView />
    </Suspense>
  );
}
