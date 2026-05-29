import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useGetMe } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LayoutDashboard, Shield, Users, Megaphone } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const login = useLogin({
    mutation: {
      onSuccess: (res) => {
        if (res.user.role !== "admin") {
          toast({ variant: "destructive", title: "Access Denied", description: "This portal is for barangay officials only." });
          return;
        }
        setToken(res.token);
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        const msg = err?.data?.message || err?.data?.error || err?.message || "Please check your credentials.";
        toast({ variant: "destructive", title: "Login failed", description: msg });
      },
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ data: { email, password } });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/60 via-slate-900 to-slate-900" />
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">SV Connect</p>
            <p className="text-slate-400 text-xs">Administrator Portal</p>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Manage your<br />
            <span className="text-blue-400">community</span> with ease.
          </h2>
          <div className="space-y-4">
            {[
              { icon: Users, text: "Review and approve resident registrations" },
              { icon: FileTextIcon, text: "Process barangay document requests" },
              { icon: Megaphone, text: "Broadcast announcements to residents" },
              { icon: Shield, text: "Secure role-based access control" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <f.icon className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-slate-300 text-sm">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-500 text-xs">
          © {new Date().getFullYear()} SV Connect · Official Administrative System
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <LayoutDashboard className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base leading-none">SV Connect</p>
              <p className="text-slate-500 text-xs">Administrator Portal</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your admin account to continue.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@barangay.gov.ph"
                className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm shadow-blue-600/30"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-blue-700 text-center">
              <Shield className="h-3.5 w-3.5 inline mr-1" />
              This portal is restricted to authorized barangay officials only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>;
}
