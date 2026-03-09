import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { Zap } from "lucide-react";
import { useState } from "react";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  organization: z.string().min(1, "Organisation is required"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      organization: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const res = await apiRequest("POST", "/api/users/register", data);
      return res.json();
    },
    onSuccess: (user) => {
      toast({ title: "Registration successful", description: "Welcome to the training platform!" });
      setLocation(`/dashboard/${user.id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold" data-testid="text-title">Quick Skill</h1>
          </div>
          <p className="text-muted-foreground text-lg font-medium">Onboarding The Works</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold" data-testid="text-form-title">
                Register for Data Management Training
              </h2>
              <p className="text-sm text-muted-foreground">
                Fill out the form below to get started
              </p>
            </div>

            <Form {...form}>
              <form noValidate onSubmit={form.handleSubmit((data) => mutation.mutate({ ...data, email: data.email.trim() }))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input data-testid="input-name" placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input data-testid="input-email" type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organisation</FormLabel>
                      <FormControl>
                        <Input data-testid="input-organization" placeholder="Your company or organisation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <PrivacyNotice checked={privacyAccepted} onCheckedChange={setPrivacyAccepted} />

                <Button
                  data-testid="button-register"
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending || !privacyAccepted}
                >
                  {mutation.isPending ? "Registering..." : "Start Training"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
