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
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [companyData, setCompanyData] = useState({
    name: "",
    description: "",
    primary_color: "#2563eb",
    secondary_color: "#ffffffff",
    accent_color: "#0ea5e9"
  });

  // Traer datos de la empresa desde la API
  useEffect(() => {
    axios.get("http://localhost:5001/api/empresa")
      .then(res => {
        setCompanyData({
          name: res.data.nombre_empresa,
          description: res.data.description_empresa,
          primary_color: res.data.primary_color || "#2563eb",
          secondary_color: res.data.secondary_color || "#ffffffff",
          accent_color: res.data.accent_color || "#0ea5e9"
        });
      })
      .catch(err => console.error("Error al obtener datos de la empresa:", err));
  }, []);

  const handleLogin = (email: string, password: string) => {
    setIsAuthenticated(true);
    setCurrentUser(email);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab("dashboard");
  };

  // Mostrar pantalla de login si no está autenticado
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: companyData.secondary_color }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10" style={{ backgroundColor: companyData.primary_color, borderRadius: 8 }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: companyData.primary_color }}>
                {companyData.name}
              </h1>
              <p className="text-sm text-muted-foreground">{companyData.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              3 Alertas
            </Button>
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
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="ml-2"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Registros</span>
            </TabsTrigger>
            <TabsTrigger value="zones" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Zonas</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Alertas</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Reportes</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span>Perfil</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="logs">
            <AccessLog />
          </TabsContent>
          
          <TabsContent value="zones">
            <ZoneConfig />
          </TabsContent>
          
          <TabsContent value="alerts">
            <SecurityAlerts />
          </TabsContent>
          
          <TabsContent value="reports">
            <AccessReports />
          </TabsContent>
          
          <TabsContent value="profile">
            <CompanyProfile />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
