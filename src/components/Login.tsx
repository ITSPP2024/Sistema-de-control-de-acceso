import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Shield, Eye, EyeOff, Lock, User, AlertCircle } from "lucide-react";

interface LoginProps {
  onLogin: (email: string, password: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setIsLoading(true);
    
    // Simulación de autenticación
    setTimeout(() => {
      // Credenciales de demostración
      if (email === "admin@empresa.com" && password === "admin123") {
        onLogin(email, password);
      } else {
        setError("Credenciales incorrectas. Intenta con: admin@empresa.com / admin123");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Header con logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl mb-2">Sistema de Seguridad</h1>
          <p className="text-muted-foreground">
            Control de Acceso y Monitoreo
          </p>
        </div>

        {/* Card de login */}
        <Card className="p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-center mb-6">Iniciar Sesión</h2>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Verificando...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                Credenciales de demostración:
              </p>
              <div className="text-xs text-blue-800 space-y-1">
                <p><span className="font-medium">Email:</span> admin@empresa.com</p>
                <p><span className="font-medium">Contraseña:</span> admin123</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sistema de Control de Acceso v1.0
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Protegido con cifrado de extremo a extremo
          </p>
        </div>
      </div>
    </div>
  );
}
