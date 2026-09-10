import { TopHeader } from "@/components/layout/TopHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Shield,
  Users,
  Sparkles,
  Smartphone,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const members = [
    { name: "Jorge", role: "admin", status: "🟢 Disponible", avatarBg: "bg-blue-600" },
    { name: "Samuel", role: "member", status: "🟢 Disponible", avatarBg: "bg-amber-600" },
    {
      name: "David",
      role: "member",
      status: "🟢 Disponible",
      avatarBg: "bg-emerald-600",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col pb-24">
      <TopHeader title="PisoPro" subtitle="Nuestro piso" />

      <main className="flex-1 space-y-4 px-4 py-5">
        {/* Welcome / Phase 1 Status Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 text-white shadow-lg shadow-emerald-700/20">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Fase 1: Scaffolding & PWA Listo</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Bienvenido a PisoPro</h2>
            <p className="text-xs leading-relaxed text-emerald-100/90">
              La plataforma integral para organizar tareas, gastos compartidos, compras y
              convivencia de piso.
            </p>
          </div>
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
        </div>

        {/* Flat Members Preview Section */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
              <Users className="h-3.5 w-3.5" />
              <span>Compañeros de Piso</span>
            </h3>
            <span className="text-muted-foreground text-[11px]">3 miembros</span>
          </div>

          <div className="grid gap-2.5">
            {members.map((member) => (
              <Card
                key={member.name}
                className="transition-all hover:border-emerald-500/40"
              >
                <CardContent className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${member.avatarBg}`}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-foreground text-sm font-semibold">
                          {member.name}
                        </span>
                        {member.role === "admin" && (
                          <Badge
                            variant="secondary"
                            className="gap-1 px-1.5 py-0 text-[10px] font-medium"
                          >
                            <Shield className="h-2.5 w-2.5 text-emerald-600" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-[11px]">{member.status}</p>
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Technical Architecture Check */}
        <Card className="border-border/80">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
              <Smartphone className="h-3.5 w-3.5" />
              <span>Infraestructura Base Activa</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Módulos técnicos validados para las próximas fases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-1">
            <div className="text-foreground flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span>Next.js App Router + TypeScript Strict</span>
            </div>
            <div className="text-foreground flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span>PWA: Manifest, Service Worker & Offline Ready</span>
            </div>
            <div className="text-foreground flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span>Testing: Vitest, Testing Library & Playwright</span>
            </div>
            <div className="text-foreground flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span>Validaciones Zod y Arquitectura Modular</span>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
