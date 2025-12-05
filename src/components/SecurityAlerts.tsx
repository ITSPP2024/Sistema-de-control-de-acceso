import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { FileSpreadsheet, Calendar, Filter } from "lucide-react";

// Tipo para los registros de auditoría (incluye nombres)
interface AuditoriaRecord {
  id: number;
  usuario_id: number;
  Nombre_Administrador?: string;
  Apellido_Administrador?: string;
  accion: string;
  entidad: string;
  entidad_id: number | null;
  detalle: string | null;
  fecha: string;
}

export function SecurityAlerts() {
  const [auditoria, setAuditoria] = useState<AuditoriaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [accionFilter, setAccionFilter] = useState("all");
  const [entidadFilter, setEntidadFilter] = useState("all");

  //  Función formateadora de fechas
  const formatFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    const fechaPart = fecha.toISOString().split("T")[0]; // YYYY-MM-DD
    const horaPart = fecha.toTimeString().split(" ")[0]; // HH:MM:SS
    return `${fechaPart}   ${horaPart}`; // ← Separación extra
  };

  //  Cargar datos desde el backend
  const loadAuditoriaRecords = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://localhost:5001/api/auditoria");
      const data = await response.json();

      setAuditoria(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading auditoria records:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditoriaRecords();
  }, []);

  // Filtrar registros
  const filteredAuditoria = auditoria.filter(record => {
    const matchesAccion = accionFilter === "all" || record.accion === accionFilter;
    const matchesEntidad = entidadFilter === "all" || record.entidad === entidadFilter;
    return matchesAccion && matchesEntidad;
  });

  // Valores únicos para filtros
  const uniqueAcciones = Array.from(new Set(auditoria.map(r => r.accion))).sort();
  const uniqueEntidades = Array.from(new Set(auditoria.map(r => r.entidad))).sort();

  // Exportar CSV
  const exportToExcel = () => {
    const headers = ["ID", "Usuario", "Acción", "Entidad", "Entidad ID", "Detalle", "Fecha"];
    const csvContent = [
      headers.join(","),
      ...filteredAuditoria.map(record => [
        record.id,
        record.Nombre_Administrador
          ? `${record.Nombre_Administrador} ${record.Apellido_Administrador}`
          : `ID ${record.usuario_id}`,
        record.accion,
        record.entidad,
        record.entidad_id || "",
        `"${(record.detalle || "").replace(/"/g, '""')}"`,
        formatFecha(record.fecha)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Auditoría_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Color del badge según acción
  const getAccionColor = (accion: string) => {
    switch (accion) {
      case "CREAR": return "default";
      case "EDITAR": return "secondary";
      case "ACTUALIZAR": return "secondary";
      case "ELIMINAR": return "destructive";
      case "MOVER": return "outline";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando registros de auditoría...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Registro de Auditoría</h2>
          <p className="text-muted-foreground">
            Historial completo de actividades del sistema
          </p>
        </div>
        <Button onClick={exportToExcel} variant="outline">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar a Excel
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-2xl font-semibold">{filteredAuditoria.length}</div>
              <div className="text-sm text-muted-foreground">Total Registros</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-2xl font-semibold">
                {auditoria.filter(r => r.accion === "CREAR").length}
              </div>
              <div className="text-sm text-muted-foreground">Creaciones</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-yellow-600" />
            <div>
              <div className="text-2xl font-semibold">
                {auditoria.filter(r => r.accion === "EDITAR" || r.accion === "ACTUALIZAR").length}
              </div>
              <div className="text-sm text-muted-foreground">Modificaciones</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-red-600" />
            <div>
              <div className="text-2xl font-semibold">
                {auditoria.filter(r => r.accion === "ELIMINAR").length}
              </div>
              <div className="text-sm text-muted-foreground">Eliminaciones</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        {/* Filtros */}
        <div className="flex space-x-4 mb-6">
          <Select value={accionFilter} onValueChange={setAccionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las acciones</SelectItem>
              {uniqueAcciones.map(accion => (
                <SelectItem key={accion} value={accion}>{accion}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={entidadFilter} onValueChange={setEntidadFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por entidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las entidades</SelectItem>
              {uniqueEntidades.map(entidad => (
                <SelectItem key={entidad} value={entidad}>{entidad}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="w-[180px]">Usuario</TableHead>
                <TableHead className="w-[120px]">Acción</TableHead>
                <TableHead className="w-[120px]">Entidad</TableHead>
                <TableHead className="w-[100px]">Entidad ID</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead className="w-[180px]">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuditoria.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hay registros de auditoría
                  </TableCell>
                </TableRow>
              ) : (
                filteredAuditoria.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">{record.id}</TableCell>

                    {/* Usuario */}
                    <TableCell className="font-medium">
                      {record.Nombre_Administrador
                        ? `${record.Nombre_Administrador} ${record.Apellido_Administrador}`
                        : `ID ${record.usuario_id}`}
                    </TableCell>

                    <TableCell>
                      <Badge variant={getAccionColor(record.accion)}>
                        {record.accion}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">{record.entidad}</Badge>
                    </TableCell>

                    <TableCell className="font-mono text-sm">
                      {record.entidad_id || "-"}
                    </TableCell>

                    <TableCell className="max-w-md" title={record.detalle || ""}>
                      {record.detalle || "-"}
                    </TableCell>

                    <TableCell className="font-mono text-sm">
                      {formatFecha(record.fecha)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
