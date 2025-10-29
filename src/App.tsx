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
    accent_color: "#0ea5e9"
  });

  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);

  // 🔹 Obtener datos de empresa
  useEffect(() => {
    axios.get("http://localhost:5001/api/empresa")
      .then(res => setCompanyData({
        name: res.data.nombre_empresa,
        description: res.data.descripcion_empresa,
        primary_color: res.data.primary_color || "#2563eb",
        secondary_color: res.data.secondary_color || "#ffffff",
        accent_color: res.data.accent_color || "#0ea5e9"
      }))
      .catch(err => console.error("Error al obtener datos de la empresa:", err));
  }, []);

  // 🔔 Obtener alertas activas
  useEffect(() => {
    axios.get("http://localhost:5001/api/alerts")
      .then(res => setAlerts(res.data))
      .catch(err => console.error("Error al obtener alertas:", err));
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
          <div className="flex items-center space-x-3">
            <div
              className="flex items-center justify-center w-10 h-10"
              style={{ backgroundColor: companyData.primary_color, borderRadius: 8 }}
            >
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: companyData.primary_color }}>
                {companyData.name}
              </h1>
              <p className="text-sm text-muted-foreground">{companyData.description}</p>
            </div>
          </div>

          {/* 🔔 Botón de alertas dinámicas */}
          <div className="flex items-center space-x-3 relative">
            <Button variant="outline" size="sm" onClick={() => setShowAlerts(!showAlerts)}>
              <Bell className="w-4 h-4 mr-2" />
              {alerts.length} Alertas
            </Button>

            {/* Popup de alertas */}
            {showAlerts && (
              <div className="absolute right-0 top-12 w-80 bg-white shadow-lg border border-gray-200 rounded-lg z-50 p-3">
                <h4 className="font-semibold text-gray-800 mb-2">Alertas Activas</h4>
                {alerts.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay alertas activas</p>
                ) : (
                  alerts.map(alert => (
                    <div key={alert.id} className="border-b border-gray-100 py-2 last:border-b-0">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-gray-500">{alert.time}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Usuario actual */}
            <div className="flex items-center space-x-3">
              <div className="text-right mr-2">
                <p className="text-sm font-medium">{currentUser?.split('@')[0]}</p>
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
            <TabsTrigger value="dashboard"><LayoutDashboard className="w-4 h-4 mr-1" />Dashboard</TabsTrigger>
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
