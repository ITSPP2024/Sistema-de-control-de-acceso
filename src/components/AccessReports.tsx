import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import {
  Download,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  Shield,
  RefreshCw,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface ReportData {
  totales: {
    total_accesos: number;
    total_autorizados: number;
    total_denegados: number;
  };
  porHora: Array<{ hour: string; accesos: number }>;
  porZona: Array<{ name: string; value: number }>;
  semanal: Array<{ dia: string; autorizados: number; denegados: number }>;
  topUsuarios: Array<{ name: string; departamento: string; accesos: number }>;
}

const COLORES_ZONAS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"];

export function AccessReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("7days");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/reportes?periodo=${periodo}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error al obtener reportes:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [periodo]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const calcularTasaExito = () => {
    if (!data || data.totales.total_accesos === 0) return 0;
    return ((data.totales.total_autorizados / data.totales.total_accesos) * 100).toFixed(1);
  };

  const handleExportarReporte = () => {
    if (!data) return;

    const workbook = XLSX.utils.book_new();

    const fechaActual = new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const resumenData = [
      ["REPORTE DE ACTIVIDAD DE ACCESOS"],
      [`Generado el: ${fechaActual}`],
      [],
      ["RESUMEN GENERAL"],
      ["Métrica", "Valor"],
      ["Total de Accesos", data.totales.total_accesos],
      ["Accesos Autorizados", data.totales.total_autorizados],
      ["Accesos Denegados", data.totales.total_denegados],
      ["Tasa de Éxito", `${calcularTasaExito()}%`],
    ];
    const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
    resumenSheet["!cols"] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");

    const horaData = [
      ["ACCESOS POR HORA"],
      [],
      ["Hora", "Cantidad de Accesos"],
      ...data.porHora.map((h) => [h.hour, h.accesos]),
    ];
    const horaSheet = XLSX.utils.aoa_to_sheet(horaData);
    horaSheet["!cols"] = [{ wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, horaSheet, "Por Hora");

    const zonaData = [
      ["DISTRIBUCIÓN POR ZONA"],
      [],
      ["Zona", "Cantidad de Accesos"],
      ...data.porZona.map((z) => [z.name, z.value]),
    ];
    const zonaSheet = XLSX.utils.aoa_to_sheet(zonaData);
    zonaSheet["!cols"] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, zonaSheet, "Por Zona");

    const semanalData = [
      ["TENDENCIA SEMANAL"],
      [],
      ["Día", "Autorizados", "Denegados"],
      ...data.semanal.map((s) => [s.dia, s.autorizados, s.denegados]),
    ];
    const semanalSheet = XLSX.utils.aoa_to_sheet(semanalData);
    semanalSheet["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, semanalSheet, "Semanal");

    const usuariosData = [
      ["USUARIOS MÁS ACTIVOS"],
      [],
      ["Usuario", "Departamento", "Cantidad de Accesos"],
      ...data.topUsuarios.map((u) => [u.name, u.departamento, u.accesos]),
    ];
    const usuariosSheet = XLSX.utils.aoa_to_sheet(usuariosData);
    usuariosSheet["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, usuariosSheet, "Top Usuarios");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    const fechaArchivo = new Date()
      .toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");

    saveAs(blob, `Reporte_Actividad_${fechaArchivo}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-muted-foreground">Cargando datos del reporte...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">No se pudieron cargar los datos</p>
          <Button variant="outline" className="mt-4" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const { totales, porHora, porZona, semanal, topUsuarios } = data;

  const getPeriodoLabel = () => {
    switch (periodo) {
      case "today": return "Hoy";
      case "7days": return "Últimos 7 días";
      case "30days": return "Últimos 30 días";
      case "3months": return "Últimos 3 meses";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reportes de Actividad</h2>
          <p className="text-muted-foreground">
            Análisis y estadísticas de accesos en tiempo real
          </p>
        </div>
        <div className="flex space-x-2 flex-wrap gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Período de tiempo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="7days">Últimos 7 días</SelectItem>
              <SelectItem value="30days">Últimos 30 días</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={handleExportarReporte}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Accesos</p>
              <div className="text-3xl font-bold text-blue-600">{totales.total_accesos.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{getPeriodoLabel()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Autorizados</p>
              <div className="text-3xl font-bold text-green-600">{totales.total_autorizados.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Accesos exitosos</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Denegados</p>
              <div className="text-3xl font-bold text-red-600">{totales.total_denegados.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Accesos rechazados</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
              <div className="text-3xl font-bold text-purple-600">{calcularTasaExito()}%</div>
              <p className="text-xs text-muted-foreground mt-1">Porcentaje aprobado</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Accesos por Hora del Día</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={porHora}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [value, "Accesos"]}
              />
              <Bar dataKey="accesos" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Distribución por Zona</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={porZona}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {porZona.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORES_ZONAS[index % COLORES_ZONAS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [value, "Accesos"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold">Tendencia Semanal</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={semanal}>
            <defs>
              <linearGradient id="colorAutorizados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDenegados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="autorizados"
              name="Autorizados"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAutorizados)"
            />
            <Area
              type="monotone"
              dataKey="denegados"
              name="Denegados"
              stroke="#EF4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDenegados)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold">Usuarios Más Activos</h3>
        </div>
        <div className="space-y-3">
          {topUsuarios.map((user, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.departamento}</div>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {user.accesos.toLocaleString()} accesos
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
