import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, Download, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface AccessLogItem {
  idacceso: number;
  fecha_inicio_acceso: string;
  fecha_fin_acceso: string | null;
  nombre_usuario: string | null;
  nombre_zona: string | null;
  tipo_acceso: string;
  estado_acceso: string;
  tarjeta_id: string | null;
}

export function AccessLog() {
  const [accessLogs, setAccessLogs] = useState<AccessLogItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");

  // Traer datos de la API al cargar
  useEffect(() => {
    fetch("http://localhost:5001/api/accesos")
      .then(res => res.json())
      .then(data => setAccessLogs(data))
      .catch(err => console.error("Error al obtener accesos:", err));
  }, []);

  const filteredLogs = accessLogs.filter(log => {
    const matchesSearch =
      (log.nombre_usuario || "Usuario Desconocido").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.nombre_zona || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.tarjeta_id || "-").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || log.estado_acceso.toLowerCase() === statusFilter;
    const matchesZone = zoneFilter === "all" || (log.nombre_zona || "").toLowerCase() === zoneFilter;

    return matchesSearch && matchesStatus && matchesZone;
  });

  const getStatusColor = (status: string) => (status === "Autorizado" ? "default" : "destructive");
  const getAccessTypeColor = (type: string) => (type === "RFID" ? "secondary" : "default");

  const handleRefresh = () => {
    fetch("http://localhost:5001/api/accesos")
      .then(res => res.json())
      .then(data => setAccessLogs(data))
      .catch(err => console.error("Error al actualizar accesos:", err));
  };

  const handleExport = () => {
    const exportData = filteredLogs.map(log => ({
      "Fecha Inicio": log.fecha_inicio_acceso,
      "Fecha Fin": log.fecha_fin_acceso || "-",
      "Usuario": log.nombre_usuario || "Usuario Desconocido",
      "Zona": log.nombre_zona || "-",
      "Tipo de Acceso": log.tipo_acceso,
      "Estado": log.estado_acceso,
      "Tarjeta/ID": log.tarjeta_id || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accesos");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Registro_Accesos_${new Date().toISOString()}.xlsx`);
  };

  const calcularDuracion = (inicio: string, fin: string | null) => {
    if (!fin) return "-";
    const diff = new Date(fin).getTime() - new Date(inicio).getTime();
    const h = Math.floor(diff / 1000 / 60 / 60);
    const m = Math.floor((diff / 1000 / 60) % 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Registro de Accesos</h2>
          <p className="text-muted-foreground">Historial completo de entradas y salidas</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Input
            placeholder="Buscar usuario, zona o tarjeta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

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

          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Zona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las zonas</SelectItem>
              {Array.from(new Set(accessLogs.map(l => l.nombre_zona).filter(Boolean))).map(zona => (
                <SelectItem key={zona} value={zona!.toLowerCase()}>
                  {zona}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">
              {filteredLogs.filter(log => log.estado_acceso === "Autorizado").length}
            </div>
            <div className="text-sm text-muted-foreground">Accesos Autorizados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-red-600">
              {filteredLogs.filter(log => log.estado_acceso === "Denegado").length}
            </div>
            <div className="text-sm text-muted-foreground">Accesos Denegados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">{filteredLogs.length}</div>
            <div className="text-sm text-muted-foreground">Total de Registros</div>
          </div>
        </div>

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
            {filteredLogs.map(log => (
              <TableRow key={log.idacceso}>
                <TableCell className="font-mono text-sm">{log.fecha_inicio_acceso}</TableCell>
                <TableCell>
                  <div className="font-medium">{log.nombre_usuario || "Usuario Desconocido"}</div>
                </TableCell>
                <TableCell>{log.nombre_zona || "-"}</TableCell>
                <TableCell>
                  <Badge variant={getAccessTypeColor(log.tipo_acceso)}>{log.tipo_acceso}</Badge>
                </TableCell>
                <TableCell>
                  {log.tarjeta_id ? (
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{log.tarjeta_id}</code>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(log.estado_acceso)}>{log.estado_acceso}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {calcularDuracion(log.fecha_inicio_acceso, log.fecha_fin_acceso)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
