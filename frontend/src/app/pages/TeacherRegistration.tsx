import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { User, ShieldCheck, Loader2, ArrowLeft, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export function TeacherRegistration() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/faculty/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Account Created Successfully!");
        navigate("/teacher/login"); 
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (error) {
      toast.error("Registration error. Ensure the server is online.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/50 blur-[120px] rounded-full" />
      </div>

      <Card className="w-full max-w-md bg-white border border-slate-200 text-slate-800 shadow-xl relative z-10">
        <CardHeader className="text-center border-b border-slate-100 pb-6">
          <div className="flex items-center justify-between mb-2">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/")}
                className="text-slate-400 hover:text-slate-800 hover:bg-slate-100"
            >
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <ShieldCheck className="w-8 h-8 text-blue-500" />
            <div className="w-10" /> {/* Spacer */}
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">Faculty Registration</CardTitle>
          <CardDescription className="text-slate-500 font-medium pt-1">
            Create an administrator account
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold px-1 flex items-center gap-2">
                <User className="w-3 h-3" /> Full Name
              </Label>
              <Input
                placeholder="Dr. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-50 border-slate-200 h-11 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold px-1 flex items-center gap-2">
                <Mail className="w-3 h-3" /> Faculty Email
              </Label>
              <Input
                type="email"
                placeholder="teacher@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-50 border-slate-200 h-11 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold px-1 flex items-center gap-2">
                <Lock className="w-3 h-3" /> Password
              </Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-50 border-slate-200 h-11 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold mt-2 shadow-lg shadow-blue-500/30 transition-all"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Complete Registration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
