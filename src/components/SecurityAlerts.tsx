import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { AlertTriangle, Shield, Eye, CheckCircle, Clock, Bell } from "lucide-react";

const mockAlerts = [
  {
    id: 1,
    timestamp: "2025-01-06 09:08:45",
    type: "Acceso Denegado",
    severity: "Alto",
    zone: "Taller",
    details: "Tarjeta RFID no autorizada (RFID999) intentó acceder",
    status: "Pendiente",
    user: "Usuario Desconocido",
    actions: ["Revisar", "Bloquear Tarjeta"]
  },
  {
    id: 2,
    timestamp: "2025-01-06 08:55:11",
    type: "Reconocimiento Facial Fallido",
    severity: "Medio",
    zone: "Área de Ventas",
    details: "Múltiples intentos de reconocimiento facial sin éxito",
    status: "En Revisión",
    user: "Usuario Desconocido",
    actions: ["Verificar Cámara", "Revisar Logs"]
  },
  {
    id: 3,
    timestamp: "2025-01-06 08:42:20",
    type: "Ocupación Máxima Excedida",
    severity: "Medio",
    zone: "Administración",
    details: "Zona excedió el límite de 8 personas simultáneas",
    status: "Resuelto",
    user: "Sistema",
    actions: ["Revisar Límites"]
  },
  {
    id: 4,
    timestamp: "2025-01-06 07:30:15",
    type: "Acceso Fuera de Horario",
    severity: "Alto",
    zone: "Almacén de Repuestos",
    details: "Acceso autorizado detectado fuera del horario permitido",
    status: "Resuelto",
    user: "Carlos López",
    actions: ["Verificar Autorización"]
  },
  {
    id: 5,
    timestamp: "2025-01-05 23:45:30",
    type: "Puerta Forzada",
    severity: "Crítico",
    zone: "Administración",
    details: "Sensor de puerta indica apertura sin autorización",
    status: "Resuelto",
    user: "Sistema de Seguridad",
    actions: ["Revisar Video", "Verificar Integridad"]
  }
];

export function SecurityAlerts() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = severityFilter === "all" || alert.severity.toLowerCase() === severityFilter;
    const matchesStatus = statusFilter === "all" || alert.status.toLowerCase() === statusFilter;
    return matchesSeverity && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Crítico": return "destructive";
      case "Alto": return "destructive";
      case "Medio": return "default";
      case "Bajo": return "secondary";
      default: return "default";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "Crítico": return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "Alto": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "Medio": return <Shield className="w-4 h-4 text-yellow-500" />;
      case "Bajo": return <Eye className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pendiente": return "destructive";
      case "En Revisión": return "default";
      case "Resuelto": return "secondary";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pendiente": return <Clock className="w-4 h-4 text-red-500" />;
      case "En Revisión": return <Eye className="w-4 h-4 text-blue-500" />;
      case "Resuelto": return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const handleMarkAsResolved = (alertId: number) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, status: "Resuelto" } : alert
    ));
  };

  const pendingAlerts = filteredAlerts.filter(alert => alert.status === "Pendiente");
  const criticalAlerts = filteredAlerts.filter(alert => alert.severity === "Crítico");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Alertas de Seguridad</h2>
          <p className="text-muted-foreground">
            Monitoreo y gestión de incidentes de seguridad
          </p>
        </div>
        <Button variant="outline">
          <Bell className="w-4 h-4 mr-2" />
          Configurar Notificaciones
        </Button>
      </div>

      {/* Alertas críticas */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>¡Atención!</strong> Hay {criticalAlerts.length} alerta(s) crítica(s) que requieren atención inmediata.
          </AlertDescription>
        </Alert>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <div className="text-2xl font-semibold">{pendingAlerts.length}</div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <div className="text-2xl font-semibold">{criticalAlerts.length}</div>
              <div className="text-sm text-muted-foreground">Críticas</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-2xl font-semibold">
                {filteredAlerts.filter(a => a.status === "En Revisión").length}
              </div>
              <div className="text-sm text-muted-foreground">En Revisión</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-2xl font-semibold">
                {filteredAlerts.filter(a => a.status === "Resuelto").length}
              </div>
              <div className="text-sm text-muted-foreground">Resueltas</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        {/* Filtros */}
        <div className="flex space-x-4 mb-6">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por severidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las severidades</SelectItem>
              <SelectItem value="crítico">Crítico</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
              <SelectItem value="medio">Medio</SelectItem>
              <SelectItem value="bajo">Bajo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="en revisión">En Revisión</SelectItem>
              <SelectItem value="resuelto">Resuelto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla de alertas */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Tipo de Alerta</TableHead>
              <TableHead>Severidad</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Detalles</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell className="font-mono text-sm">
                  {alert.timestamp}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getSeverityIcon(alert.severity)}
                    <span>{alert.type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </TableCell>
                <TableCell>{alert.zone}</TableCell>
                <TableCell className="max-w-xs truncate" title={alert.details}>
                  {alert.details}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(alert.status)}
                    <Badge variant={getStatusColor(alert.status)}>
                      {alert.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {alert.status === "Pendiente" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleMarkAsResolved(alert.id)}
                      >
                        Resolver
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      Ver Detalles
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}