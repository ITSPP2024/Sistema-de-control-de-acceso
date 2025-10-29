import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Plus, Settings, Shield, Clock, Users, Map, List, Activity, AlertCircle, Link2, Unlink, Route } from "lucide-react";

interface Zone {
  id: number;
  name: string;
  description: string;
  accessLevel: string;
  isActive: boolean;
  allowedUsers: number;
  totalUsers: number;
  schedule: string;
  requiresEscort: boolean;
  maxOccupancy: number;
  currentOccupancy: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
}

interface Connection {
  from: number;
  to: number;
  label: string;
  id?: number;
}

export function ZoneConfig({ currentUser }: any) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [draggingZone, setDraggingZone] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showConnections, setShowConnections] = useState(true);
  const [connectingMode, setConnectingMode] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<number | null>(null);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneDescription, setNewZoneDescription] = useState("");
  const [newZoneAccess, setNewZoneAccess] = useState("1");
  const [newZoneMaxOccupancy, setNewZoneMaxOccupancy] = useState(10);
  const [newZoneRequiresEscort, setNewZoneRequiresEscort] = useState(false);
  const [newZoneStartTime, setNewZoneStartTime] = useState("");
  const [newZoneEndTime, setNewZoneEndTime] = useState("");

  // -----------------------
  // Registrar auditoría
  // -----------------------
  const registrarAuditoria = async (accion: string, entidad: string, entidad_id: any, detalle: string) => {
    if (!currentUser) return;
    try {
      await fetch("http://localhost:5001/api/auditoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: currentUser,
          accion,
          entidad,
          entidad_id,
          detalle
        })
      });
    } catch (err) {
      console.error("Error registrando auditoría:", err);
    }
  };

  // =============================
  // 🔹 Cargar datos desde backend
  // =============================
  useEffect(() => {
    // Cargar zonas
    fetch("http://localhost:5001/api/zonas")
      .then(res => res.json())
      .then(data => {
        const loadedZones: Zone[] = data.map((z: any) => ({
          id: z.idzonas,
          name: z.nombre_zona,
          position: { x: z.pos_x || 100, y: z.pos_y || 100 },
          description: z.descripcion_zona || "",
          accessLevel: z.nivel_seguridad_zona,
          isActive: z.estado_zona === "Activa",
          allowedUsers: 0,
          totalUsers: 0,
          schedule: `${z.horario_inicio_zona || "--:--"} - ${z.horario_fin_zona || "--:--"}`,
          requiresEscort: z.requiresEscort === 1,
          maxOccupancy: z.capacidad_maxima_zona || 10,
          currentOccupancy: 0,
          size: { width: 240, height: 180 },
          color: "#3b82f6"
        }));
        setZones(loadedZones);
      });

    // Cargar conexiones
    fetch("http://localhost:5001/api/conexiones")
      .then(res => res.json())
      .then(data => {
        const loadedConnections: Connection[] = data.map((c: any) => ({
          from: c.id_zona_origen,
          to: c.id_zona_destino,
          label: "Conexión",
          id: c.id || c.id_conexion
        }));
        setConnections(loadedConnections);
      });
  }, []);

  // =============================
  // 🔹 Funciones auxiliares
  // =============================
  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "5": return "destructive";
      case "4": return "default";
      case "3": return "default";
      case "2": return "secondary";
      case "1": return "secondary";
      default: return "default";
    }
  };

  const getOccupancyColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  const toggleZoneStatus = async (zoneId: number) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    const newStatus = !zone.isActive;
    try {
      const res = await fetch(`http://localhost:5001/api/zonas/${zoneId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...zone, estado_zona: newStatus ? "Activa" : "Inactiva" })
      });
      if (!res.ok) {
        console.error("Error actualizando zona");
      } else {
        // registrar auditoría de estado
        await registrarAuditoria(
          newStatus ? "ACTIVAR" : "DESACTIVAR",
          "ZONA",
          zoneId,
          `Zona "${zone.name}" ${newStatus ? "activada" : "desactivada"}`
        );
      }
    } catch (err) {
      console.error("Error actualizando zona:", err);
    }
    setZones(zones.map(z => z.id === zoneId ? { ...z, isActive: newStatus } : z));
  };

  const handleMouseDown = (zoneId: number, e: React.MouseEvent<HTMLDivElement>) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    const mapContainer = e.currentTarget.parentElement;
    if (!mapContainer) return;

    const rect = mapContainer.getBoundingClientRect();

    setDraggingZone(zoneId);
    setDragOffset({
      x: e.clientX - rect.left - zone.position.x,
      y: e.clientY - rect.top - zone.position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingZone === null) return;

    const mapContainer = e.currentTarget;
    const rect = mapContainer.getBoundingClientRect();

    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    setZones(zones.map(zone =>
      zone.id === draggingZone
        ? { ...zone, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
        : zone
    ));
  };

  const handleMouseUp = async () => {
    if (draggingZone !== null) {
      const movedZone = zones.find(z => z.id === draggingZone);
      if (movedZone) {
        try {
          const res = await fetch(`http://localhost:5001/api/zonas/${movedZone.id}/posicion`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pos_x: movedZone.position.x,
              pos_y: movedZone.position.y
            })
          });
          if (!res.ok) {
            console.error("Error guardando posición:", res.statusText);
          } else {
            // registrar auditoría de movimiento
            await registrarAuditoria(
              "MOVER",
              "ZONA",
              movedZone.id,
              `Zona "${movedZone.name}" movida a x:${movedZone.position.x}, y:${movedZone.position.y}`
            );
          }
        } catch (err) {
          console.error("Error guardando posición:", err);
        }
      }
    }
    setDraggingZone(null);
  };

  const handleZoneClick = async (zoneId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingMode) {
      if (connectingFrom === null) {
        setConnectingFrom(zoneId);
      } else if (connectingFrom !== zoneId) {
        const existing = connections.find(c =>
          (c.from === connectingFrom && c.to === zoneId) ||
          (c.from === zoneId && c.to === connectingFrom)
        );
        if (!existing) {
          const newConnection = { from: connectingFrom, to: zoneId, label: "Conexión" };
          setConnections([...connections, newConnection]);

          // Guardar en backend
          try {
            const res = await fetch("http://localhost:5001/api/conexiones", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id_zona_origen: connectingFrom,
                id_zona_destino: zoneId
              })
            });
            const saved = await res.json();
            // actualizar connection id si backend lo devuelve
            setConnections(prev => prev.map(c => {
              if (c.from === connectingFrom && c.to === zoneId && !c.id) {
                return { ...c, id: saved.id || saved.insertId || c.id };
              }
              return c;
            }));

            // registrar auditoría de creación de conexión
            await registrarAuditoria(
              "CREAR",
              "CONEXION",
              null,
              `Conexión creada entre zona ${connectingFrom} y zona ${zoneId}`
            );
          } catch (err) {
            console.error("Error guardando conexión:", err);
          }
        }
        setConnectingFrom(null); // Resetear después de crear la conexión
      }
    } else {
      setSelectedZone(zoneId);
    }
  };

  const removeConnection = async (from: number, to: number) => {
    const connToDelete = connections.find(c => (c.from === from && c.to === to) || (c.from === to && c.to === from));
    if (!connToDelete) return;

    setConnections(connections.filter(c => c !== connToDelete));

    try {
      // intentar usar id si existe
      if (connToDelete.id) {
        await fetch(`http://localhost:5001/api/conexiones/${connToDelete.id}`, { method: "DELETE" });
      } else {
        // fallback: endpoint que acepte from/to
        await fetch(`http://localhost:5001/api/conexiones`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_zona_origen: from, id_zona_destino: to })
        });
      }

      // registrar auditoría de eliminación de conexión
      await registrarAuditoria(
        "ELIMINAR",
        "CONEXION",
        null,
        `Conexión eliminada entre zona ${from} y zona ${to}`
      );
    } catch (err) {
      console.error("Error eliminando conexión:", err);
    }
  };

  const getZoneCenter = (zone: Zone) => ({
    x: zone.position.x + zone.size.width / 2,
    y: zone.position.y + zone.size.height / 2
  });

  const selectedZoneData = selectedZone ? zones.find(z => z.id === selectedZone) : null;
  const selectedZoneConnections = selectedZone ? connections.filter(c => c.from === selectedZone || c.to === selectedZone) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Configuración de Zonas</h2>
          <p className="text-muted-foreground">
            Gestionar zonas de acceso y permisos
          </p>
        </div>
         <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
  setIsAddDialogOpen(open);
  if (!open) setEditingZone(null);
}}>
  <DialogTrigger asChild>
    <Button>
      <Plus className="w-4 h-4 mr-2" />
      Nueva Zona
    </Button>
  </DialogTrigger>

  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>{editingZone ? "Editar Zona" : "Crear Nueva Zona"}</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="zoneName">Nombre de la Zona</Label>
        <Input
          id="zoneName"
          placeholder="Ej: Área de Repuestos"
          value={newZoneName}
          onChange={(e) => setNewZoneName(e.target.value)}
        />
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="zoneDescription">Descripción</Label>
        <Textarea
          id="zoneDescription"
          placeholder="Describe el propósito de esta zona"
          value={newZoneDescription}
          onChange={(e) => setNewZoneDescription(e.target.value)}
        />
      </div>

      {/* Nivel de acceso */}
      <div className="space-y-2">
        <Label htmlFor="accessLevel">Nivel de Acceso Requerido</Label>
        <Select
          value={newZoneAccess}
          onValueChange={(value) => setNewZoneAccess(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar nivel" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ocupación máxima */}
      <div className="space-y-2">
        <Label htmlFor="maxOccupancy">Ocupación Máxima</Label>
        <Input
          id="maxOccupancy"
          type="number"
          value={newZoneMaxOccupancy}
          onChange={(e) => setNewZoneMaxOccupancy(parseInt(e.target.value))}
        />
      </div>

      {/* 🕒 Horario */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Hora de inicio</Label>
          <Input
            id="startTime"
            type="time"
            value={newZoneStartTime}
            onChange={(e) => setNewZoneStartTime(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">Hora de fin</Label>
          <Input
            id="endTime"
            type="time"
            value={newZoneEndTime}
            onChange={(e) => setNewZoneEndTime(e.target.value)}
          />
        </div>
      </div>

      {/* Escolta */}
      <div className="flex items-center space-x-2">
        <Switch
          id="requiresEscort"
          checked={newZoneRequiresEscort}
          onCheckedChange={setNewZoneRequiresEscort}
        />
        <Label htmlFor="requiresEscort">Requiere acompañante autorizado</Label>
      </div>

      {/* Botones */}
      <div className="flex space-x-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
          Cancelar
        </Button>

        <Button
          className="flex-1"
          onClick={async () => {
            const zoneData = {
              nombre_zona: newZoneName,
              descripcion_zona: newZoneDescription,
              nivel_seguridad_zona: newZoneAccess,
              capacidad_maxima_zona: newZoneMaxOccupancy,
              horario_inicio_zona: newZoneStartTime || null,
              horario_fin_zona: newZoneEndTime || null,
              requiresEscort: newZoneRequiresEscort,
              estado_zona: "Activa",
            };

            try {
              let res, updatedZone;

              if (editingZone) {
                res = await fetch(`http://localhost:5001/api/zonas/${editingZone.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(zoneData),
                });
                updatedZone = await res.json();

                setZones(zones.map(z => z.id === editingZone.id ? {
                  ...z,
                  name: updatedZone.nombre_zona,
                  description: updatedZone.descripcion_zona,
                  accessLevel: updatedZone.nivel_seguridad_zona,
                  maxOccupancy: updatedZone.capacidad_maxima_zona,
                  schedule: `${updatedZone.horario_inicio_zona || "--:--"} - ${updatedZone.horario_fin_zona || "--:--"}`,
                  requiresEscort: updatedZone.requiresEscort || false
                } : z));

                // registrar auditoría de edición de zona
                await registrarAuditoria(
                  "EDITAR",
                  "ZONA",
                  editingZone.id,
                  `Zona "${updatedZone.nombre_zona}" (ID ${editingZone.id}) modificada`
                );
              } else {
                res = await fetch("http://localhost:5001/api/zonas", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(zoneData),
                });
                updatedZone = await res.json();

                setZones([
                  ...zones,
                  {
                    id: updatedZone.idzonas,
                    name: updatedZone.nombre_zona,
                    description: updatedZone.descripcion_zona,
                    accessLevel: updatedZone.nivel_seguridad_zona,
                    isActive: true,
                    allowedUsers: 0,
                    totalUsers: 0,
                    schedule: `${newZoneStartTime || "--:--"} - ${newZoneEndTime || "--:--"}`,
                    requiresEscort: updatedZone.requiresEscort || false,
                    maxOccupancy: updatedZone.capacidad_maxima_zona,
                    currentOccupancy: 0,
                    position: { x: 100, y: 100 },
                    size: { width: 240, height: 180 },
                    color: "#3b82f6",
                  },
                ]);

                // registrar auditoría de creación de zona
                await registrarAuditoria(
                  "CREAR",
                  "ZONA",
                  updatedZone.idzonas,
                  `Zona "${updatedZone.nombre_zona}" creada (ID ${updatedZone.idzonas})`
                );
              }

              setIsAddDialogOpen(false);
              setEditingZone(null);
              setNewZoneName("");
              setNewZoneDescription("");
              setNewZoneAccess("1");
              setNewZoneMaxOccupancy(10);
              setNewZoneRequiresEscort(false);
              setNewZoneStartTime("");
              setNewZoneEndTime("");
            } catch (err) {
              console.error(err);
              alert("Error al guardar la zona");
            }
          }}
        >
          {editingZone ? "Guardar Cambios" : "Crear Zona"}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
      </div>
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            <span>Vista de Lista</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            <span>Vista de Mapa</span>
          </TabsTrigger>
        </TabsList>

        {/* Vista de Lista */}
        <TabsContent value="list" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {zones.map((zone) => (
              <Card key={zone.id} className="p-6">
                <div className="space-y-4">
                  {/* Header de la zona */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3>{zone.name}</h3>
                        <Badge variant={getAccessLevelColor(zone.accessLevel)}>
                          {zone.accessLevel}
                        </Badge>
                        {zone.requiresEscort && (
                          <Badge variant="outline">
                            Escolta Requerida
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{zone.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={zone.isActive}
                        onCheckedChange={() => toggleZoneStatus(zone.id)}
                      />
                      <Button
  variant="outline"
  size="sm"
  onClick={() => {
    const z = zone;
    setEditingZone(z);
    setNewZoneName(z.name);
    setNewZoneDescription(z.description);
    setNewZoneAccess(z.accessLevel);
    setNewZoneMaxOccupancy(z.maxOccupancy);
    setNewZoneRequiresEscort(z.requiresEscort);
    setNewZoneStartTime(z.schedule.split(" - ")[0] === "--:--" ? "" : z.schedule.split(" - ")[0]);
    setNewZoneEndTime(z.schedule.split(" - ")[1] === "--:--" ? "" : z.schedule.split(" - ")[1]);
    setIsAddDialogOpen(true);
  }}
>
  <Settings className="w-4 h-4" />
</Button>

<Button
  variant="destructive"
  size="sm"
  onClick={async () => {
    if (!confirm(`¿Seguro que deseas eliminar la zona "${zone.name}"?`)) return;
    try {
      const res = await fetch(`http://localhost:5001/api/zonas/${zone.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Error eliminando zona");
      setZones(zones.filter(z => z.id !== zone.id));

      // registrar auditoría de eliminación de zona
      await registrarAuditoria(
        "ELIMINAR",
        "ZONA",
        zone.id,
        `Zona "${zone.name}" (ID ${zone.id}) eliminada`
      );
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar la zona");
    }
  }}
>
  Eliminar
</Button>

                    </div>
                  </div>

                  {/* Estadísticas de la zona */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">Usuarios Autorizados</span>
                      </div>
                      <div className="text-lg">{zone.allowedUsers}/{zone.totalUsers}</div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Ocupación Actual</span>
                      </div>
                      <div className={`text-lg ${getOccupancyColor(zone.currentOccupancy, zone.maxOccupancy)}`}>
                        {zone.currentOccupancy}/{zone.maxOccupancy}
                      </div>
                    </div>
                  </div>

                  {/* Horario de acceso */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Horario de Acceso</span>
                    </div>
                    <div className="text-sm">{zone.schedule}</div>
                  </div>

                  {/* Estado actual */}
                  <div className={`p-3 rounded-lg border ${zone.isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${zone.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium">
                        {zone.isActive ? 'Zona Activa' : 'Zona Inactiva'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {zone.isActive 
                        ? 'Aceptando accesos según configuración'
                        : 'Todos los accesos están bloqueados'
                      }
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Ver Permisos
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Historial
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Vista de Mapa */}
        <TabsContent value="map" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mapa interactivo */}
            <div className="lg:col-span-2">
              <Card className="p-4">
                <div className="mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Map className="w-5 h-5 text-blue-600" />
                      <h3>Plano de Zonas</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 mr-4">
                        <Switch 
                          checked={showConnections} 
                          onCheckedChange={setShowConnections}
                          id="show-connections"
                        />
                        <Label htmlFor="show-connections" className="text-sm cursor-pointer">
                          Mostrar Conexiones
                        </Label>
                      </div>
                      <Button 
                        variant={connectingMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setConnectingMode(!connectingMode);
                          setConnectingFrom(null);
                        }}
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        {connectingMode ? "Cancelar" : "Conectar Zonas"}
                      </Button>
                    </div>
                  </div>
                  {connectingMode && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-blue-900">
                        <AlertCircle className="w-4 h-4" />
                        <span>
                          {connectingFrom 
                            ? `Haz clic en la zona de destino para crear la conexión desde "${zones.find(z => z.id === connectingFrom)?.name}"`
                            : "Haz clic en la primera zona para iniciar la conexión"
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div 
                  className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
                  style={{ height: '600px' }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Grid de fondo */}
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                  }}></div>

                  {/* Conexiones entre zonas */}
                  {showConnections && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                      <defs>
                        <marker
                          id="arrowhead"
                          markerWidth="10"
                          markerHeight="10"
                          refX="9"
                          refY="3"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
                        </marker>
                      </defs>
                      {connections.map((connection, index) => {
                        const fromZone = zones.find(z => z.id === connection.from);
                        const toZone = zones.find(z => z.id === connection.to);
                        if (!fromZone || !toZone) return null;

                        const from = getZoneCenter(fromZone);
                        const to = getZoneCenter(toZone);
                        
                        const midX = (from.x + to.x) / 2;
                        const midY = (from.y + to.y) / 2;

                        const isHighlighted = selectedZone === connection.from || selectedZone === connection.to;

                        return (
                          <g key={index}>
                            <line
                              x1={from.x}
                              y1={from.y}
                              x2={to.x}
                              y2={to.y}
                              stroke={isHighlighted ? "#3b82f6" : "#6b7280"}
                              strokeWidth={isHighlighted ? "3" : "2"}
                              strokeDasharray="5,5"
                              markerEnd="url(#arrowhead)"
                              opacity={isHighlighted ? "0.8" : "0.4"}
                            />
                            <circle
                              cx={midX}
                              cy={midY}
                              r="12"
                              fill="white"
                              stroke={isHighlighted ? "#3b82f6" : "#6b7280"}
                              strokeWidth="2"
                              className="pointer-events-auto cursor-pointer hover:fill-red-50"
                              onClick={() => removeConnection(connection.from, connection.to)}
                            />
                            <text
                              x={midX}
                              y={midY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="16"
                              fill={isHighlighted ? "#3b82f6" : "#6b7280"}
                              className="pointer-events-none"
                            >
                              ×
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  )}

                  {/* Zonas */}
                  {zones.map((zone) => (
                    <div
                      key={zone.id}
                      className={`absolute rounded-lg shadow-lg transition-all ${
                        selectedZone === zone.id ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
                      } ${draggingZone === zone.id ? 'opacity-80 z-50' : 'hover:shadow-xl'} ${
                        connectingFrom === zone.id ? 'ring-4 ring-green-400 ring-opacity-50' : ''
                      }`}
                      style={{
                        left: zone.position.x,
                        top: zone.position.y,
                        width: zone.size.width,
                        height: zone.size.height,
                        backgroundColor: zone.color + '20',
                        borderColor: zone.color,
                        borderWidth: connectingFrom === zone.id ? '4px' : '2px',
                        borderStyle: 'solid',
                        cursor: connectingMode ? 'pointer' : 'move',
                        zIndex: 2,
                      }}
                      onMouseDown={(e) => {
                        if (!connectingMode) {
                          handleMouseDown(zone.id, e);
                        }
                      }}
                      onClick={(e) => handleZoneClick(zone.id, e)}
                    >
                      <div className="p-4 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium mb-1" style={{ color: zone.color }}>
                              {zone.name}
                            </div>
                            <Badge 
                              variant={getAccessLevelColor(zone.accessLevel)} 
                              className="text-xs"
                            >
                              {zone.accessLevel}
                            </Badge>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${zone.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>

                        <div className="mt-auto space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Users className="w-3 h-3" style={{ color: zone.color }} />
                            <span>{zone.currentOccupancy}/{zone.maxOccupancy}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Activity className="w-3 h-3" style={{ color: zone.color }} />
                            <span>{zone.allowedUsers} autorizados</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Leyenda y estadísticas */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="text-xs text-muted-foreground mb-1">Total Zonas</div>
                    <div className="text-xl">{zones.length}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="text-xs text-muted-foreground mb-1">Conexiones</div>
                    <div className="text-xl flex items-center gap-2">
                      <Route className="w-5 h-5 text-blue-600" />
                      {connections.length}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="text-xs text-muted-foreground mb-1">Zonas Activas</div>
                    <div className="text-xl text-green-600">
                      {zones.filter(z => z.isActive).length}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Panel de detalles */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-6">
                {selectedZoneData ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3>Detalles de Zona</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedZone(null)}
                        >
                          ×
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: selectedZoneData.color }}
                        ></div>
                        <span className="font-medium">{selectedZoneData.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedZoneData.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Estado</div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${selectedZoneData.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm">{selectedZoneData.isActive ? 'Activa' : 'Inactiva'}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Nivel de Acceso</div>
                        <Badge variant={getAccessLevelColor(selectedZoneData.accessLevel)}>
                          {selectedZoneData.accessLevel}
                        </Badge>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Ocupación Actual</div>
                        <div className={`${getOccupancyColor(selectedZoneData.currentOccupancy, selectedZoneData.maxOccupancy)}`}>
                          {selectedZoneData.currentOccupancy} / {selectedZoneData.maxOccupancy} personas
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ 
                              width: `${(selectedZoneData.currentOccupancy / selectedZoneData.maxOccupancy) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Usuarios Autorizados</div>
                        <div className="text-sm">
                          {selectedZoneData.allowedUsers} de {selectedZoneData.totalUsers}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Horario</div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span className="text-sm">{selectedZoneData.schedule}</span>
                        </div>
                      </div>

                      {selectedZoneData.requiresEscort && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm text-amber-900">
                            <Shield className="w-4 h-4" />
                            <span>Requiere Escolta</span>
                          </div>
                        </div>
                      )}

                      {/* Conexiones de la zona */}
                      {selectedZoneConnections.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Route className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-muted-foreground">
                              Conexiones ({selectedZoneConnections.length})
                            </span>
                          </div>
                          <div className="space-y-2">
                            {selectedZoneConnections.map((conn, idx) => {
                              const connectedZoneId = conn.from === selectedZone ? conn.to : conn.from;
                              const connectedZone = zones.find(z => z.id === connectedZoneId);
                              if (!connectedZone) return null;

                              return (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded" 
                                      style={{ backgroundColor: connectedZone.color }}
                                    ></div>
                                    <span className="text-sm">{connectedZone.name}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-red-100"
                                    onClick={() => removeConnection(conn.from, conn.to)}
                                  >
                                    <Unlink className="w-3 h-3" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <Button variant="outline" className="w-full" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar Zona
                      </Button>
                      <Button variant="outline" className="w-full" size="sm">
                        <Activity className="w-4 h-4 mr-2" />
                        Ver Flujo de Accesos
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Map className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-muted-foreground">
                      Selecciona una zona en el mapa para ver sus detalles
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
