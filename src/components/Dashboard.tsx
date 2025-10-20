import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Users, Shield, AlertTriangle, Activity } from "lucide-react";

const mockStats = {
  totalUsers: 45,
  activeUsers: 12,
  todayAccesses: 156,
  unauthorizedAttempts: 3,
  secureZones: 4
};

const recentAccesses = [
  { id: 1, user: "María González", zone: "Taller", time: "09:15", status: "success" },
  { id: 2, user: "Carlos López", zone: "Área de Ventas", time: "09:12", status: "success" },
  { id: 3, user: "Usuario Desconocido", zone: "Taller", time: "09:08", status: "denied" },
  { id: 4, user: "Ana Rodríguez", zone: "Oficina", time: "09:05", status: "success" },
  { id: 5, user: "Juan Pérez", zone: "Área de Ventas", time: "09:02", status: "success" }
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard de Seguridad</h2>
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
              <div className="text-2xl">{mockStats.totalUsers}</div>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Usuarios Activos</p>
              <div className="text-2xl">{mockStats.activeUsers}</div>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Accesos Hoy</p>
              <div className="text-2xl">{mockStats.todayAccesses}</div>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Intentos Denegados</p>
              <div className="text-2xl">{mockStats.unauthorizedAttempts}</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Alerta de seguridad */}
      {mockStats.unauthorizedAttempts > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Se detectaron {mockStats.unauthorizedAttempts} intentos de acceso no autorizados en las últimas 24 horas.
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
                  <div className="font-medium">{access.user}</div>
                  <div className="text-sm text-muted-foreground">{access.zone}</div>
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