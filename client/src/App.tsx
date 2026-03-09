import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import TrainingViewer from "@/pages/TrainingViewer";
import CertificatesPage from "@/pages/CertificatesPage";
import AdminPanel from "@/pages/AdminPanel";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Register} />
      <Route path="/dashboard/:userId" component={Dashboard} />
      <Route path="/training/:userId/:sectionId" component={TrainingViewer} />
      <Route path="/certificates/:userId" component={CertificatesPage} />
      <Route path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
