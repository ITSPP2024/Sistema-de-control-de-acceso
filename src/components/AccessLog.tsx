import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, Download, Filter, RefreshCw } from "lucide-react";

const mockAccessLogs = [
  {
    id: 1,
    timestamp: "2025-01-06 09:15:32",
    user: "María González",
    zone: "Taller",
    accessType: "RFID",
    status: "Autorizado",
    cardId: "RFID001",
    duration: "2h 15m"
  },
  {
    id: 2,
    timestamp: "2025-01-06 09:12:18",
    user: "Carlos López",
    zone: "Área de Ventas",
    accessType: "Facial",
    status: "Autorizado",
    cardId: "-",
    duration: "1h 45m"
  },
  {
    id: 3,
    timestamp: "2025-01-06 09:08:45",
    user: "Usuario Desconocido",
    zone: "Taller",
    accessType: "RFID",
    status: "Denegado",
    cardId: "RFID999",
    duration: "-"
  },
  {
    id: 4,
    timestamp: "2025-01-06 09:05:12",
    user: "Ana Rodríguez",
    zone: "Oficina",
    accessType: "RFID",
    status: "Autorizado",
    cardId: "RFID003",
    duration: "3h 22m"
  },
  {
    id: 5,
    timestamp: "2025-01-06 09:02:38",
    user: "Juan Pérez",
    zone: "Área de Ventas",
    accessType: "Facial",
    status: "Autorizado",
    cardId: "-",
    duration: "4h 10m"
  },
  {
    id: 6,
    timestamp: "2025-01-06 08:58:22",
    user: "Luis Martín",
    zone: "Recepción",
    accessType: "RFID",
    status: "Autorizado",
    cardId: "RFID005",
    duration: "8h 35m"
  },
  {
    id: 7,
    timestamp: "2025-01-06 08:55:11",
    user: "Usuario Desconocido",
    zone: "Área de Ventas",
    accessType: "Facial",
    status: "Denegado",
    cardId: "-",
    duration: "-"
  },
  {
    id: 8,
    timestamp: "2025-01-06 08:52:44",
    user: "Carmen Silva",
    zone: "Administración",
    accessType: "RFID",
    status: "Autorizado",
    cardId: "RFID006",
    duration: "6h 18m"
  }
];

export function AccessLog() {
  const [accessLogs, setAccessLogs] = useState(mockAccessLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");

  const filteredLogs = accessLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.cardId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status.toLowerCase() === statusFilter;
    const matchesZone = zoneFilter === "all" || log.zone.toLowerCase() === zoneFilter;
    
    return matchesSearch && matchesStatus && matchesZone;
  });

  const getStatusColor = (status: string) => {
    return status === "Autorizado" ? "default" : "destructive";
  };

  const getAccessTypeColor = (type: string) => {
    return type === "RFID" ? "secondary" : "default";
  };

  const handleRefresh = () => {
    // Simular actualización de datos
    console.log("Actualizando registros de acceso...");
  };

  const handleExport = () => {
    // Simular exportación de datos
    console.log("Exportando registros...");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Registro de Accesos</h2>
          <p className="text-muted-foreground">
            Historial completo de entradas y salidas
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Card className="p-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <Input
              placeholder="Buscar usuario, zona o tarjeta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="autorizado">Autorizado</SelectItem>
                <SelectItem value="denegado">Denegado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Zona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las zonas</SelectItem>
                <SelectItem value="taller">Taller</SelectItem>
                <SelectItem value="área de ventas">Área de Ventas</SelectItem>
                <SelectItem value="oficina">Oficina</SelectItem>
                <SelectItem value="administración">Administración</SelectItem>
                <SelectItem value="recepción">Recepción</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button variant="outline" className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Rango de Fechas
            </Button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">
              {filteredLogs.filter(log => log.status === "Autorizado").length}
            </div>
            <div className="text-sm text-muted-foreground">Accesos Autorizados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-red-600">
              {filteredLogs.filter(log => log.status === "Denegado").length}
            </div>
            <div className="text-sm text-muted-foreground">Accesos Denegados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">
              {filteredLogs.length}
            </div>
            <div className="text-sm text-muted-foreground">Total de Registros</div>
          </div>
        </div>

        {/* Tabla de registros */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Tipo de Acceso</TableHead>
              <TableHead>Tarjeta/ID</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Duración</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-sm">
                  {log.timestamp}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{log.user}</div>
                </TableCell>
                <TableCell>{log.zone}</TableCell>
                <TableCell>
                  <Badge variant={getAccessTypeColor(log.accessType)}>
                    {log.accessType}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.cardId !== "-" ? (
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {log.cardId}
                    </code>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(log.status)}>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {log.duration}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}