import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import type { TrainingUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Copy, Award, ArrowLeft, Download, BookOpen, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function CompletionPage() {
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<TrainingUser>({
    queryKey: ["/api/users", userId],
  });

  const completionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/users/${userId}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
    },
  });

  useEffect(() => {
    if (user && !user.referenceCode && !completionMutation.isPending && !completionMutation.data) {
      completionMutation.mutate();
    }
  }, [user]);

  const referenceCode = user?.referenceCode || completionMutation.data?.referenceCode;

  const copyCode = () => {
    if (referenceCode) {
      navigator.clipboard.writeText(referenceCode);
      toast({ title: "Copied", description: "Reference code copied to clipboard." });
    }
  };

  const shareLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied", description: "Training link copied to clipboard. Share it with others!" });
  };

  const downloadCertificates = async () => {
    try {
      const res = await fetch(`/api/certificates/download-all/${userId}`);
      if (!res.ok) throw new Error("Failed to download certificates");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "all-certificates.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "All certificates downloaded." });
    } catch {
      toast({ title: "Error", description: "Failed to download certificates.", variant: "destructive" });
    }
  };

  const downloadTraining = async () => {
    try {
      const res = await fetch("/api/training-material/download");
      if (!res.ok) throw new Error("Failed to download training material");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "training-material.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Training material downloaded." });
    } catch {
      toast({ title: "Error", description: "Failed to download training material.", variant: "destructive" });
    }
  };

  if (userLoading) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto p-4 text-center">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-completion-title">
            Training Complete!
          </CardTitle>
          <p className="text-muted-foreground mt-1">
            Congratulations, {user.name}! You have completed all training modules.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {completionMutation.isPending ? (
            <div className="text-center">
              <Skeleton className="h-12 w-48 mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Generating your reference code...</p>
            </div>
          ) : referenceCode ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">Your unique reference code:</p>
              <div className="inline-flex items-center gap-3 bg-muted rounded-lg px-6 py-4">
                <span
                  className="text-3xl font-mono font-bold tracking-widest"
                  data-testid="text-reference-code"
                >
                  {referenceCode}
                </span>
                <Button variant="ghost" size="icon" onClick={copyCode} data-testid="button-copy-code">
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Save this code for your records. It serves as proof of your training completion.
              </p>
            </div>
          ) : completionMutation.isError ? (
            <p className="text-center text-destructive" data-testid="text-completion-error">
              {(completionMutation.error as Error)?.message || "Failed to generate reference code."}
            </p>
          ) : null}

          <div className="border-t pt-4 space-y-3">
            <Button variant="outline" className="w-full" onClick={downloadCertificates} data-testid="button-download-certificates">
              <Award className="mr-2 h-4 w-4" />
              Download Certificates
            </Button>
            <Button variant="outline" className="w-full" onClick={downloadTraining} data-testid="button-download-training">
              <BookOpen className="mr-2 h-4 w-4" />
              Download Training Material
            </Button>
            <Button variant="outline" className="w-full" onClick={shareLink} data-testid="button-share-training">
              <Share2 className="mr-2 h-4 w-4" />
              Share Training Link
            </Button>
            <Link href="/">
              <Button variant="ghost" className="w-full" data-testid="link-return-home">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
