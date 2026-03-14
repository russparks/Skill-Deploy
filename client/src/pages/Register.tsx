import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
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
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col items-center justify-center p-5">

      <div className="w-full max-w-[520px] bg-white rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.08)] p-8 space-y-6">

        <div className="flex flex-col items-center gap-3 pb-2">
          <div className="w-14 h-16 bg-[#e5e7eb] rounded-lg flex items-center justify-center">
            <Zap className="h-7 w-7 text-[#6b7280]" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-gray-900" data-testid="text-title">Quick Skill</h1>
            <p className="text-gray-500 text-base">Onboarding The Works</p>
          </div>
        </div>

        <hr className="border-[#e5e7eb]" />

        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-800" data-testid="text-form-title">
            Register for Data Management Training
          </h2>
          <p className="text-sm text-gray-500">
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
                  <FormLabel className="text-gray-700">Full Name</FormLabel>
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
                  <FormLabel className="text-gray-700">Email</FormLabel>
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
                  <FormLabel className="text-gray-700">Organisation</FormLabel>
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
              className="w-full text-base py-5 font-bold"
              disabled={mutation.isPending || !privacyAccepted}
            >
              {mutation.isPending ? "Registering..." : "Start Training →"}
            </Button>
          </form>
        </Form>

      </div>

      <p className="text-center text-gray-400 text-xs mt-6 pb-6">
        Quick Skill — Onboarding The Works
      </p>

    </div>
  );
}
