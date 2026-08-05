import { createFileRoute } from "@tanstack/react-router";
import { Panel, PanelTitle } from "@/components/site/ui-bits";

export const Route = createFileRoute("/_admin/admin/courses_/$courseId/lessons")({
  component: AdminCourseLessons,
});

function AdminCourseLessons() {
  const { courseId } = Route.useParams();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Manage Lessons</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Managing lessons for course: {courseId}
        </p>
      </div>
      <Panel>
        <PanelTitle>Lessons List</PanelTitle>
        <p className="text-sm text-muted-foreground mt-4">
          Placeholder for Lesson list, drag-to-reorder, Add/Edit/Delete lesson form with video
          upload.
        </p>
      </Panel>
    </div>
  );
}
