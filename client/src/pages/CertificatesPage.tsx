import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import type { TrainingUser, TrainingSection, UserProgress, Certificate } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Award, Download, Mail, ChevronLeft, CheckCircle } from "lucide-react";

export default function CertificatesPage() {
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();

  const { data: user } = useQuery<TrainingUser>({
    queryKey: ["/api/users", userId],
  });

  const { data: sections } = useQuery<TrainingSection[]>({
    queryKey: ["/api/sections"],
  });

  const { data: progress, isLoading } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress", userId],
  });

  const { data: certificates } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates", userId],
  });

  const generateMutation = useMutation({
    mutationFn: async (sectionId: number) => {
      const res = await apiRequest("POST", "/api/progress/generate-certificate", {
        userId: parseInt(userId!),
        sectionId,
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const section = sections?.find((s) => s.id === sectionId);
      a.download = `certificate-${section?.title.replace(/\s+/g, "-").toLowerCase() || "training"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates", userId] });
      toast({ title: "Certificate generated", description: "Your certificate has been downloaded." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const completedProgress = progress?.filter((p) => p.completedAt) || [];

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-64" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/dashboard/${userId}`}>
          <Button variant="ghost" data-testid="link-back-dashboard">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Award className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold" data-testid="text-certificates-title">Your Certificates</h1>
      </div>

      {completedProgress.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground" data-testid="text-no-certificates">
              Complete training modules to earn certificates.
            </p>
            <Link href={`/dashboard/${userId}`}>
              <Button className="mt-4" data-testid="button-start-training">Start Training</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {completedProgress.map((prog) => {
            const section = sections?.find((s) => s.id === prog.sectionId);
            const cert = certificates?.find((c) => c.sectionId === prog.sectionId);

            if (!section) return null;

            return (
              <Card key={prog.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                        <h3 className="font-medium truncate" data-testid={`text-cert-title-${section.id}`}>
                          {section.title}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed {prog.completedAt ? new Date(prog.completedAt).toLocaleDateString() : ""}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {cert && (
                          <Badge variant="secondary">
                            <Mail className="mr-1 h-3 w-3" />
                            {cert.emailedAt ? "Emailed" : "Not emailed"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      data-testid={`button-download-cert-${section.id}`}
                      onClick={() => generateMutation.mutate(section.id)}
                      disabled={generateMutation.isPending}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
