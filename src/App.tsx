import { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dashboard } from "./components/Dashboard";
import { UserManagement } from "./components/UserManagement";
import { AccessLog } from "./components/AccessLog";
import { ZoneConfig } from "./components/ZoneConfig";
import { SecurityAlerts } from "./components/SecurityAlerts";
import { AccessReports } from "./components/AccessReports";
import { CompanyProfile } from "./components/CompanyProfile";
import { Login } from "./components/Login";
import { ScrollArea } from "./components/ui/scroll-area";
import { Badge } from "./components/ui/badge";
import { Clock } from "lucide-react";

import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  AlertTriangle,
  BarChart3,
  Shield,
  Bell,
  Building2,
  LogOut
} from "lucide-react";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [companyData, setCompanyData] = useState({
    name: "",
    description: "",
    primary_color: "#2563eb",
    secondary_color: "#ffffff",
    accent_color: "#0ea5e9",
    logo: "" // 👈 Nuevo campo para el logo
  });

  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);

  // Obtener datos de empresa y mantener actualizados
  useEffect(() => {
    const fetchCompanyData = () => {
      axios
        .get("http://localhost:5001/api/empresa")
        .then((res) => {
          const newData = {
            name: res.data.nombre_empresa,
            description: res.data.descripcion_empresa,
            primary_color: res.data.primary_color || "#2563eb",
            secondary_color: res.data.secondary_color || "#ffffff",
            accent_color: res.data.accent_color || "#0ea5e9",
            logo: res.data.logo || ""
          };

          // Solo actualiza si cambió algo
          setCompanyData((prev) =>
            JSON.stringify(prev) !== JSON.stringify(newData) ? newData : prev
          );
        })
        .catch((err) =>
          console.error("Error al obtener datos de la empresa:", err)
        );
    };

    // Primera carga inmediata
    fetchCompanyData();

    // Actualizar cada 5 segundos
    const interval = setInterval(fetchCompanyData, 3000);

    // Limpiar intervalo al desmontar
    return () => clearInterval(interval);
  }, []);

  // Obtener alertas activas en tiempo real (cada 5 segundos)
  useEffect(() => {
    const fetchAlerts = () => {
      axios.get("http://localhost:5001/api/dashboard/alerts-detail")
        .then(res => {
          const mapped = res.data.map(a => ({
            id: a.id,
            message: `${a.usuario} ${a.accion} ${a.entidad}`,
            detalle: a.detalle || "",
            time: new Date(a.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setAlerts(mapped);
        })
        .catch(err => console.error("Error al obtener alertas:", err));
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (email, password) => {
    setIsAuthenticated(true);
    setCurrentUser(email);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab("dashboard");
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: companyData.secondary_color }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
  <div className="flex items-center justify-between">

    {/* LADO IZQUIERDO - LOGO + NOMBRE */}
    <div className="flex items-center space-x-3">

      {/* Logo */}
      {companyData.logo ? (
        <img
          src={`http://localhost:5001${companyData.logo}?t=${Date.now()}`}
          alt="Logo Empresa"
          className="w-10 h-10 rounded-md object-cover"
        />
      ) : (
        <div
          className="flex items-center justify-center w-10 h-10"
          style={{ backgroundColor: companyData.primary_color, borderRadius: 8 }}
        >
          <Shield className="w-6 h-6 text-white" />
        </div>
      )}

      <div>
        <h1 className="text-xl font-semibold" style={{ color: companyData.primary_color }}>
          {companyData.name}
        </h1>
        <p className="text-sm text-muted-foreground">{companyData.description}</p>
      </div>
    </div>

    {/* LADO DERECHO - NOTIFICACIONES + USUARIO */}
    <div className="flex items-center space-x-4">

      {/* 🔔 Botón de alertas */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAlerts(!showAlerts)}
        >
          <Bell className="w-4 h-4 mr-2" />
          {alerts.length} Alertas
        </Button>

        {showAlerts && (
          <div className="fixed inset-0 z-40 flex justify-end items-start pt-20 pr-6">

            {/* Cerrar al clickear fuera */}
            <div
              className="absolute inset-0 bg-black/0"
              onClick={() => setShowAlerts(false)}
            />

            {/* Card de notificaciones */}
            <Card className="relative z-50 w-96 shadow-xl border bg-white rounded-lg">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div>
                  <h3 className="font-semibold">Notificaciones</h3>
                  <p className="text-xs text-muted-foreground">
                    {alerts.length} activas
                  </p>
                </div>

                {alerts.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAlerts([])}
                    className="text-xs"
                  >
                    Limpiar
                  </Button>
                )}
              </div>

              {/* Lista */}
              <ScrollArea className="max-h-[350px]">
                <div className="divide-y">
                  {alerts.length === 0 ? (
                    <p className="text-sm text-center text-gray-500 py-6">
                      No hay alertas
                    </p>
                  ) : (
                    alerts.slice(0, 4).map((alert) => (
                      <div
                        key={alert.id}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer bg-blue-50/20"
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-red-500 text-lg mt-1">⚠️</span>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{alert.message}</p>
                              <Badge variant="default" className="ml-2 h-5 px-1.5 text-xs">
                                Activa
                              </Badge>
                            </div>

                            {alert.detalle && (
                              <p className="text-sm text-muted-foreground">
                                {alert.detalle}
                              </p>
                            )}

                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              {alert.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="px-4 py-3 border-t bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setShowAlerts(false);
                    setActiveTab("alerts");
                  }}
                >
                  Ver todas las alertas
                </Button>
              </div>

            </Card>
          </div>
        )}
      </div>

      {/* Usuario */}
      <div className="flex items-center space-x-3">
        <div className="text-right mr-2">
          <p className="text-sm font-medium">{currentUser?.split("@")[0]}</p>
          <p className="text-xs text-muted-foreground">{currentUser}</p>
        </div>

        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-blue-600">
            {currentUser?.charAt(0).toUpperCase()}
          </span>
        </div>

        <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-2">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

    </div>
  </div>
</header>


      {/* Tabs */}
      <div className="px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="dashboard"><LayoutDashboard className="w-4 h-4 mr-1" />Inicio</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" />Usuarios</TabsTrigger>
            <TabsTrigger value="logs"><FileText className="w-4 h-4 mr-1" />Registros</TabsTrigger>
            <TabsTrigger value="zones"><Settings className="w-4 h-4 mr-1" />Zonas</TabsTrigger>
            <TabsTrigger value="alerts"><AlertTriangle className="w-4 h-4 mr-1" />Alertas</TabsTrigger>
            <TabsTrigger value="reports"><BarChart3 className="w-4 h-4 mr-1" />Reportes</TabsTrigger>
            <TabsTrigger value="profile"><Building2 className="w-4 h-4 mr-1" />Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><Dashboard currentUser={currentUser} /></TabsContent>
          <TabsContent value="users"><UserManagement currentUser={currentUser} /></TabsContent>
          <TabsContent value="logs"><AccessLog currentUser={currentUser} /></TabsContent>
          <TabsContent value="zones"><ZoneConfig currentUser={currentUser} /></TabsContent>
          <TabsContent value="alerts"><SecurityAlerts currentUser={currentUser} /></TabsContent>
          <TabsContent value="reports"><AccessReports currentUser={currentUser} /></TabsContent>
          <TabsContent value="profile"><CompanyProfile currentUser={currentUser} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
