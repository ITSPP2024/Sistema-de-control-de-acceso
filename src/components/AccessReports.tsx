import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, Calendar, TrendingUp, Users, Clock, Shield } from "lucide-react";

const accessByHour = [
  { hour: '06:00', accesos: 5 },
  { hour: '07:00', accesos: 12 },
  { hour: '08:00', accesos: 28 },
  { hour: '09:00', accesos: 35 },
  { hour: '10:00', accesos: 22 },
  { hour: '11:00', accesos: 18 },
  { hour: '12:00', accesos: 15 },
  { hour: '13:00', accesos: 8 },
  { hour: '14:00', accesos: 20 },
  { hour: '15:00', accesos: 25 },
  { hour: '16:00', accesos: 30 },
  { hour: '17:00', accesos: 28 },
  { hour: '18:00', accesos: 15 },
  { hour: '19:00', accesos: 10 },
  { hour: '20:00', accesos: 5 }
];

const accessByZone = [
  { name: 'Taller', value: 45, color: '#3B82F6' },
  { name: 'Área de Ventas', value: 35, color: '#10B981' },
  { name: 'Administración', value: 15, color: '#F59E0B' },
  { name: 'Recepción', value: 25, color: '#8B5CF6' }
];

const weeklyTrend = [
  { day: 'Lun', accesos: 145, denegados: 8 },
  { day: 'Mar', accesos: 132, denegados: 5 },
  { day: 'Mié', accesos: 158, denegados: 12 },
  { day: 'Jue', accesos: 167, denegados: 7 },
  { day: 'Vie', accesos: 142, denegados: 9 },
  { day: 'Sáb', accesos: 89, denegados: 3 },
  { day: 'Dom', accesos: 45, denegados: 2 }
];

const topUsers = [
  { name: "María González", accesos: 42, departamento: "Administración" },
  { name: "Carlos López", accesos: 38, departamento: "Taller" },
  { name: "Ana Rodríguez", accesos: 35, departamento: "Ventas" },
  { name: "Juan Pérez", accesos: 32, departamento: "Taller" },
  { name: "Luis Martín", accesos: 28, departamento: "Recepción" }
];

export function AccessReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Reportes de Actividad</h2>
          <p className="text-muted-foreground">
            Análisis y estadísticas de accesos
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
              <div className="text-2xl">1,248</div>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12% vs semana anterior
              </p>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Promedio Diario</p>
              <div className="text-2xl">178</div>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +8% vs semana anterior
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Usuarios Únicos</p>
              <div className="text-2xl">45</div>
              <p className="text-sm text-muted-foreground">
                93% de participación
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Tiempo Promedio</p>
              <div className="text-2xl">4.2h</div>
              <p className="text-sm text-muted-foreground">
                Por sesión de acceso
              </p>
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
            <BarChart data={accessByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
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
                data={accessByZone}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {accessByZone.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
          <LineChart data={weeklyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="accesos" stroke="#3B82F6" strokeWidth={2} name="Accesos Autorizados" />
            <Line type="monotone" dataKey="denegados" stroke="#EF4444" strokeWidth={2} name="Accesos Denegados" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Usuarios más activos y resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top usuarios */}
        <Card className="p-6">
          <h3 className="mb-4">Usuarios Más Activos</h3>
          <div className="space-y-3">
            {topUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.departamento}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{user.accesos} accesos</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Resumen de seguridad */}
        <Card className="p-6">
          <h3 className="mb-4">Resumen de Seguridad</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="font-medium text-green-800">Tasa de Éxito</div>
                <div className="text-sm text-green-600">Accesos autorizados vs intentos totales</div>
              </div>
              <div className="text-2xl font-semibold text-green-700">96.2%</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <div className="font-medium text-red-800">Intentos Denegados</div>
                <div className="text-sm text-red-600">Total en el período seleccionado</div>
              </div>
              <div className="text-2xl font-semibold text-red-700">46</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="font-medium text-blue-800">Zonas Más Visitadas</div>
                <div className="text-sm text-blue-600">Taller y Área de Ventas</div>
              </div>
              <div className="text-2xl font-semibold text-blue-700">80%</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <div className="font-medium text-yellow-800">Hora Pico</div>
                <div className="text-sm text-yellow-600">Mayor actividad registrada</div>
              </div>
              <div className="text-2xl font-semibold text-yellow-700">09:00</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}