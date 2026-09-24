import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="mb-6 flex gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-20 shrink-0" />
        ))}
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-3 p-6 sm:p-8">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-16" />
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <Skeleton className="mb-3 h-3 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-5">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="mt-3 h-4 w-24" />
                <Skeleton className="mt-2 h-6 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="mb-3 h-3 w-32" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-4 h-52 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
