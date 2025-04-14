import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ApiKeyProvider } from "@/components/api-key-provider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import SavedTranscripts from "@/pages/saved-transcripts";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/saved-transcripts" component={SavedTranscripts} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiKeyProvider>
        <Router />
        <Toaster />
      </ApiKeyProvider>
    </QueryClientProvider>
  );
}

export default App;
