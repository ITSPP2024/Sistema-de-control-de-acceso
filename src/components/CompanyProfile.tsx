import { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Building2, Upload, Save } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import axios from "axios";

export function CompanyProfile({ currentUser }: any) {
  const [companyData, setCompanyData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    logo: "",
    primary_color: "#2563eb",
    secondary_color: "#64748b",
    accent_color: "#0ea5e9"
  });

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos de la base de datos al montar el componente
  useEffect(() => {
    axios.get("http://localhost:5001/api/empresa")
      .then(res => {
        if (res.data) {
          setCompanyData({
            name: res.data.nombre_empresa || "",
            description: res.data.description_empresa || "",
            address: res.data.direccion_empresa || "",
            phone: res.data.telefono_empresa || "",
            email: res.data.correo_empresa || "",
            logo: res.data.logo || "",
            primary_color: res.data.primary_color || "#2563eb",
            secondary_color: res.data.secondary_color || "#64748b",
            accent_color: res.data.accent_color || "#0ea5e9"
          });
        }
      })
      .catch(err => console.error("Error al cargar la empresa:", err));
  }, []);

  // 🧾 Registrar auditoría
  const registrarAuditoria = async (accion: string, detalle: string) => {
    if (!currentUser) return;
    try {
      await axios.post("http://localhost:5001/api/auditoria", {
        correo: currentUser,
        accion,
        entidad: "EMPRESA",
        entidad_id: 1,
        detalle
      });
    } catch (err) {
      console.error("Error registrando auditoría:", err);
    }
  };

  // Guardar cambios en la base de datos
  const handleSave = async () => {
    try {
      await axios.put("http://localhost:5001/api/empresa/1", companyData);
      alert("Configuración de la empresa guardada exitosamente");

      // 🧾 Registrar en auditoría
      await registrarAuditoria(
        "EDITAR",
        `El usuario ${currentUser} modificó la configuración de la empresa (${companyData.name})`
      );
    } catch (err) {
      console.error("Error al guardar empresa:", err);
    }
  };

  // Subir logo y guardar ruta en la base de datos
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    try {
      // Subir imagen al backend
      const res = await axios.post("http://localhost:5001/api/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ CORREGIDO: tipado en prev
      setCompanyData((prev: typeof companyData) => ({ ...prev, logo: res.data.logo }));

      await registrarAuditoria("EDITAR", `El usuario ${currentUser} actualizó el logo de la empresa.`);
    } catch (err) {
      console.error("❌ Error al subir el logo:", err);
      alert("Error al subir el logo");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Perfil de la Empresa</h2>
        <p className="text-muted-foreground">
          Configura la información y apariencia de tu organización
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo de la Empresa */}
        <Card className="p-6 lg:col-span-1">
          <div className="space-y-4">
            <div>
              <h3 className="mb-1">Logo de la Empresa</h3>
              <p className="text-sm text-muted-foreground">
                Sube el logo de tu organización
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              {companyData.logo ? (
                <div className="relative w-40 h-40 rounded-lg border-2 border-gray-200 overflow-hidden">
                  <img
                    src={`http://localhost:5001${companyData.logo}?t=${Date.now()}`}
                    alt="Company Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-40 h-40 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <Building2 className="w-16 h-16 text-gray-400" />
                </div>
              )}

              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <Button
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {companyData.logo ? "Cambiar Logo" : "Subir Logo"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                PNG, JPG o SVG (máx. 2MB)
              </p>
            </div>
          </div>
        </Card>

        {/* Información de la Empresa */}
        <Card className="p-6 lg:col-span-2">
          <div className="space-y-4">
            <div>
              <h3 className="mb-1">Información General</h3>
              <p className="text-sm text-muted-foreground">
                Actualiza los datos de tu empresa
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input
                  id="companyName"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  placeholder="Ingrese el nombre de la empresa"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={companyData.description}
                  onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                  placeholder="Breve descripción de la empresa"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                  placeholder="Número de teléfono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={companyData.email}
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                  placeholder="email@empresa.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  placeholder="Dirección completa"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Configuración de Apariencia */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="mb-1">Configuración de Apariencia</h3>
            <p className="text-sm text-muted-foreground">
              Personaliza cómo se muestra el sistema
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Color Principal</Label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={companyData.primary_color}
                  onChange={(e) => setCompanyData({ ...companyData, primary_color: e.target.value })}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input value={companyData.primary_color} readOnly className="flex-1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color Secundario</Label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={companyData.secondary_color}
                  onChange={(e) => setCompanyData({ ...companyData, secondary_color: e.target.value })}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input value={companyData.secondary_color} readOnly className="flex-1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color de Acento</Label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={companyData.accent_color}
                  onChange={(e) => setCompanyData({ ...companyData, accent_color: e.target.value })}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input value={companyData.accent_color} readOnly className="flex-1" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
