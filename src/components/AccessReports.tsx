import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {  Select,  SelectContent,  SelectItem,  SelectTrigger,  SelectValue,} from "./ui/select";
import { Badge } from "./ui/badge";
import {  BarChart,  Bar,  XAxis,  YAxis,  CartesianGrid,  Tooltip,  ResponsiveContainer,  PieChart,  Pie,  Cell,  LineChart,  Line,} from "recharts";
import {  Download,  Calendar,  TrendingUp, Users, Clock, Shield,} from "lucide-react";

export function AccessReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar los datos del backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/reportes");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error al obtener reportes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Cargando datos...</div>;
  }

  if (!data) {
    return <div className="text-center py-10 text-red-600">No se pudieron cargar los datos</div>;
  }

  // Datos del backend
  const { totales, porHora, porZona, semanal, topUsuarios } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Reportes de Actividad</h2>
          <p className="text-muted-foreground">
            Análisis y estadísticas de accesos en tiempo real
          </p>
        </div>
        <div className="flex space-x-2">
          <Select defaultValue="7days">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Período de tiempo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="7days">Últimos 7 días</SelectItem>
              <SelectItem value="30days">Últimos 30 días</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Rango Personalizado
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total de Accesos</p>
              <div className="text-2xl">{totales.total_accesos}</div>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Autorizados</p>
              <div className="text-2xl text-green-700">
                {totales.total_autorizados}
              </div>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Denegados</p>
              <div className="text-2xl text-red-700">
                {totales.total_denegados}
              </div>
            </div>
            <Users className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Tasa de Éxito</p>
              <div className="text-2xl text-green-700">
                {(
                  (totales.total_autorizados / totales.total_accesos) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accesos por hora */}
        <Card className="p-6">
          <h3 className="mb-4">Accesos por Hora del Día</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={porHora}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="accesos" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribución por zona */}
        <Card className="p-6">
          <h3 className="mb-4">Distribución por Zona</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={porZona}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {porZona.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"][index % 4]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tendencia semanal */}
      <Card className="p-6">
        <h3 className="mb-4">Tendencia Semanal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={semanal}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="accesos"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Autorizados"
            />
            <Line
              type="monotone"
              dataKey="denegados"
              stroke="#EF4444"
              strokeWidth={2}
              name="Denegados"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Usuarios más activos */}
      <Card className="p-6">
        <h3 className="mb-4">Usuarios Más Activos</h3>
        <div className="space-y-3">
          {topUsuarios.map((user, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
            >
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">
                  {user.departamento}
                </div>
              </div>
              <Badge variant="secondary">{user.accesos} accesos</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
