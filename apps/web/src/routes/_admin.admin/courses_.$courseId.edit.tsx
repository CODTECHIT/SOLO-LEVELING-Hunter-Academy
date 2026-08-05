import { createFileRoute } from "@tanstack/react-router";
import { Panel, PanelTitle } from "@/components/site/ui-bits";

export const Route = createFileRoute("/_admin/admin/courses_/$courseId/edit")({
  component: AdminCourseEdit,
});

function AdminCourseEdit() {
  const { courseId } = Route.useParams();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Edit Course</h1>
        <p className="mt-1 text-sm text-muted-foreground">Editing course: {courseId}</p>
      </div>
      <Panel>
        <PanelTitle>Course Details</PanelTitle>
        <p className="text-sm text-muted-foreground mt-4">
          Form placeholder for Title, description, category dropdown, price, thumbnail upload, and
          status toggle.
        </p>
      </Panel>
    </div>
  );
}
