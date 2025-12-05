import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Users, Shield, AlertTriangle, Activity } from "lucide-react";

export function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    todayAccesses: 0,
    unauthorizedAttempts: 0,
    secureZones: 0
  });

  const [recentAccesses, setRecentAccesses] = useState([]);

  // Obtener estadísticas del dashboard
  useEffect(() => {
    fetch("http://localhost:5001/api/dashboard/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Error obteniendo stats:", err));

    fetch("http://localhost:5001/api/dashboard/recent-accesses")
      .then(res => res.json())
      .then(data => setRecentAccesses(data))
      .catch(err => console.error("Error obteniendo accesos recientes:", err));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2>Resumen de Seguridad</h2>
        <p className="text-muted-foreground">
          Control de acceso y monitoreo en tiempo real
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Usuarios Totales</p>
              <div className="text-2xl">{stats.totalUsers}</div>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Usuarios Activos Hoy</p>
              <div className="text-2xl">{stats.activeUsers}</div>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Accesos Hoy</p>
              <div className="text-2xl">{stats.todayAccesses}</div>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Intentos Denegados</p>
              <div className="text-2xl">{stats.unauthorizedAttempts}</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Alerta de seguridad */}
      {stats.unauthorizedAttempts > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Se detectaron {stats.unauthorizedAttempts} intentos de acceso no autorizados en las últimas 24 horas.
          </AlertDescription>
        </Alert>
      )}

      {/* Accesos recientes */}
      <Card className="p-6">
        <h3 className="mb-4">Accesos Recientes</h3>
        <div className="space-y-3">
          {recentAccesses.map((access) => (
            <div key={access.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div>
                  <div className="font-medium">{access.user || "Usuario Desconocido"}</div>
                  <div className="text-sm text-muted-foreground">{access.zone || "Sin zona"}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">{access.time}</span>
                <Badge variant={access.status === "success" ? "default" : "destructive"}>
                  {access.status === "success" ? "Autorizado" : "Denegado"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
