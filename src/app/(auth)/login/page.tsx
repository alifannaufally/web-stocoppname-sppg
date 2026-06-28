"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Email atau password salah"
        : error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  const roleHints = [
    { email: "admin@sppg.com", label: "Admin", password: "admin123" },
    { email: "korlap@scb.com", label: "Korlap", password: "korlap123" },
    { email: "kagudang@scb.com", label: "Kepala Gudang", password: "kagudang123" },
    { email: "akuntan@scb.com", label: "Akuntan", password: "akuntan123" },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#092F54] via-[#0a3d6b] to-[#092F54] p-4">
      {/* Decorative elements */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#F3C623]/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#F3C623]/5 blur-3xl" />

      <Card className="relative w-full max-w-md border-0 shadow-2xl shadow-black/20 backdrop-blur-sm">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F3C623] to-[#e0b520] shadow-lg shadow-[#F3C623]/30">
            <img src="/logo-bgn.png" alt="SCB" className="h-14 w-14 rounded-lg object-cover" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#092F54]">Selamat Datang</CardTitle>
          <CardDescription className="text-sm text-gray-500 mt-1">
            Sistem Stock Opname — Gudang Basah & Kering
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@sppg.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-gray-200 focus:border-[#F3C623] focus:ring-[#F3C623]/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 border-gray-200 focus:border-[#F3C623] focus:ring-[#F3C623]/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 gap-2 bg-gradient-to-r from-[#F3C623] to-[#e0b520] hover:from-[#e0b520] hover:to-[#d4a81e] text-[#092F54] font-semibold shadow-lg shadow-[#F3C623]/25 transition-all hover:shadow-xl hover:shadow-[#F3C623]/30"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-3 text-center text-xs text-gray-400">Akun Demo</p>
            <div className="grid grid-cols-2 gap-2">
              {roleHints.map((hint) => (
                <button
                  key={hint.email}
                  type="button"
                  onClick={() => { setEmail(hint.email); setPassword(hint.password); }}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-left text-xs hover:border-[#F3C623]/40 hover:bg-[#F3C623]/5 transition-all"
                >
                  <p className="font-medium text-gray-700">{hint.label}</p>
                  <p className="mt-0.5 text-gray-400 truncate">{hint.email}</p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
