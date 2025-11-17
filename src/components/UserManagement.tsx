// UserManagement.tsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Edit, Trash2, Camera } from "lucide-react";

type User = {
  idUsuarios: number;
  nombre_usuario: string;
  apellido_usuario: string;
  correo_usuario?: string;
  telefono_usuario?: string;
  cargo_usuario?: string;
  nivel_acceso?: number | string;
  targeta_usuario?: string | null;
  huella_usuario?: string | null;
  foto?: string | null;
  status?: string | null;
  lastAccess?: string | null;
};

export function UserManagement({ currentUser }: { currentUser: string | null }) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserPhoto, setNewUserPhoto] = useState<string | null>(null);
  const newUserPhotoInputRef = useRef<HTMLInputElement>(null);
  const editUserPhotoInputRef = useRef<HTMLInputElement>(null);

  const [newUser, setNewUser] = useState<Partial<User>>({
    nombre_usuario: "",
    apellido_usuario: "",
    correo_usuario: "",
    telefono_usuario: "",
    cargo_usuario: "",
    nivel_acceso: "",
    targeta_usuario: "",
    foto: null
  });

  // carga usuarios
  const fetchUsers = async () => {
    try {
      const res = await axios.get<User[]>("http://localhost:5001/api/usuarios");
      setUsers(res.data || []);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    (`${user.nombre_usuario} ${user.apellido_usuario}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.correo_usuario?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.cargo_usuario?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getInitials = (name: string) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "NA";

  // registrar auditoría (usa tu endpoint existente)
  const registrarAuditoria = async (accion: string, entidad: string, entidad_id: any, detalle: string) => {
    if (!currentUser) return;
    try {
      await axios.post("http://localhost:5001/api/auditoria", {
        correo: currentUser,
        accion,
        entidad,
        entidad_id,
        detalle
      });
    } catch (err) {
      console.error("Error registrando auditoría:", err);
    }
  };

  // Crear usuario
  const handleCreateUser = async () => {
    if (!newUser.nombre_usuario || !newUser.apellido_usuario || !newUser.correo_usuario) {
      alert("Completa todos los campos obligatorios.");
      return;
    }
    if (users.some(u => u.correo_usuario === newUser.correo_usuario)) {
      alert("Este correo ya está registrado.");
      return;
    }
    try {
      const res = await axios.post("http://localhost:5001/api/usuarios", newUser);
      await fetchUsers();
      setIsAddDialogOpen(false);
      setNewUserPhoto(null);
      setNewUser({
        nombre_usuario: "",
        apellido_usuario: "",
        correo_usuario: "",
        telefono_usuario: "",
        cargo_usuario: "",
        nivel_acceso: "",
        targeta_usuario: "",
        foto: null
      });
      await registrarAuditoria(
        "CREAR",
        "USUARIO",
        res.data.idUsuarios,
        `Usuario ${newUser.nombre_usuario} ${newUser.apellido_usuario} creado con correo ${newUser.correo_usuario}`
      );
    } catch (err) {
      console.error("Error creando usuario:", err);
    }
  };

  // Editar usuario
  const handleEditClick = (user: User) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingUser) {
      try {
        await axios.put(`http://localhost:5001/api/usuarios/${editingUser.idUsuarios}`, editingUser);
        await fetchUsers();
        setIsEditDialogOpen(false);
        await registrarAuditoria(
          "EDITAR",
          "USUARIO",
          editingUser.idUsuarios,
          `Usuario ${editingUser.nombre_usuario} ${editingUser.apellido_usuario} modificado`
        );
        setEditingUser(null);
      } catch (err) {
        console.error("Error editando usuario:", err);
      }
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (id: number) => {
    if (confirm("¿Deseas eliminar este usuario?")) {
      try {
        await axios.delete(`http://localhost:5001/api/usuarios/${id}`);
        await fetchUsers();
        await registrarAuditoria(
          "ELIMINAR",
          "USUARIO",
          id,
          `Usuario con ID ${id} eliminado`
        );
      } catch (err) {
        console.error("Error eliminando usuario:", err);
      }
    }
  };

  // photo upload helper
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setPhoto: (p:string|null)=>void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Gestión de Usuarios</h2>
          <p className="text-muted-foreground">Administrar usuarios y permisos de acceso</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <UserForm
              user={newUser}
              setUser={(u: any) => setNewUser(u)}
              photo={newUserPhoto}
              setPhoto={setNewUserPhoto}
              photoInputRef={newUserPhotoInputRef}
              onSave={handleCreateUser}
              onCancel={() => { setIsAddDialogOpen(false); setNewUserPhoto(null); }}
              title="Agregar Nuevo Usuario"
              onLinkedSuccessfully={() => fetchUsers()}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Tarjeta RFID</TableHead>
              <TableHead>Huella</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último Acceso</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.idUsuarios}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      {user.foto ? (
                        <AvatarImage src={user.foto} alt={`${user.nombre_usuario} ${user.apellido_usuario}`} />
                      ) : (
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(`${user.nombre_usuario} ${user.apellido_usuario}`)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">{`${user.nombre_usuario || "NA"} ${user.apellido_usuario || ""}`}</div>
                      <div className="text-sm text-muted-foreground">{user.correo_usuario || "no-email@dominio.com"}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{user.cargo_usuario || user.zona_usuario || "Sin zona"}</TableCell>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{user.targeta_usuario || "N/A"}</code>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm">{user.huella_usuario || "No"}</span>
                    {user.huella_usuario ? <Badge>Vinculada</Badge> : <Badge variant="secondary">Sin huella</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === "Inactivo" ? "secondary" : "default"}>
                    {user.status || "Activo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.lastAccess || "-"}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" title="Editar usuario" onClick={() => handleEditClick(user)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" title="Eliminar usuario" onClick={() => handleDeleteUser(user.idUsuarios)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <UserForm
            user={editingUser || ({} as any)}
            setUser={(u:any)=> setEditingUser(u)}
            photo={(editingUser && (editingUser.foto as any)) || null}
            setPhoto={(photo:string|null) => editingUser && setEditingUser({ ...editingUser, foto: photo })}
            photoInputRef={editUserPhotoInputRef}
            onSave={handleSaveEdit}
            onCancel={() => { setIsEditDialogOpen(false); setEditingUser(null); }}
            title="Editar Usuario"
            onLinkedSuccessfully={() => fetchUsers()}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}


function UserForm({ user, setUser, photo, setPhoto, photoInputRef, onSave, onCancel, title, onLinkedSuccessfully }: any) {
  const [loadingFingerprint, setLoadingFingerprint] = useState(false);
  const [loadingCard, setLoadingCard] = useState(false);
  const [statusFingerprint, setStatusFingerprint] = useState<string>("");
  const [statusCard, setStatusCard] = useState<string>("");

  // Polling control
  const pollingRef = useRef<number | null>(null);
  const pollingTimeoutRef = useRef<number | null>(null);

  // Inicia el proceso: pide al server crear registro pendiente y luego comienza polling a linkFingerprint
  const handleLinkFingerprint = async () => {
    if (!user?.correo_usuario) {
      alert("El usuario debe tener un correo para asociar la huella.");
      return;
    }

    setLoadingFingerprint(true);
    setStatusFingerprint("⏳ Solicitud enviada: acércate a la cerradura y registre la huella...");

    try {
      // 1) marcar pendiente (puede ser opcional, pero mantiene el flujo)
      await axios.post("http://localhost:5001/api/ttlock/requestFingerprint", {
        correo_usuario: user.correo_usuario,
        admin_email: undefined // opcional
      });

      // 2) comenzar polling a linkFingerprint cada 3s
      let attempts = 0;
      const maxAttempts = 40; // 40*3s = ~2 minutos antes de timeout
      pollingRef.current = window.setInterval(async () => {
        attempts++;
        try {
          const resp = await axios.post("http://localhost:5001/api/ttlock/linkFingerprint", {
            correo_usuario: user.correo_usuario
          });

          // si llega aquí, la huella fue encontrada y enlazada
          const fingerprint = resp.data.fingerprint;
          setStatusFingerprint(`✅ Huella vinculada: ${fingerprint.fingerprintName} (fingerNumber ${fingerprint.fingerprintNumber})`);
          clearPolling();
          // refrescar usuarios (callback)
          onLinkedSuccessfully && onLinkedSuccessfully();
          // registrar auditoría: servidor linkFingerprint no registra auditoría (si quieres que lo haga en backend, ok), aquí intentamos notificar al backend:
          try {
            await axios.post("http://localhost:5001/api/auditoria", {
              correo: (window as any).currentUser || "sistema@local", // si usas contexto, reemplazar
              accion: "VINCULAR_HUELLA",
              entidad: "USUARIO",
              entidad_id: resp.data.userId || null,
              detalle: `Huella ${fingerprint.fingerprintNumber} vinculada a ${user.nombre_usuario} ${user.apellido_usuario}`
            });
          } catch (e) {
            // no crítico si falla
          }
        } catch (err: any) {
          // 404 esperado mientras no exista la huella todavía → seguimos poll
          if (err.response && err.response.status === 404) {
            setStatusFingerprint(`⏳ Esperando huella... (${attempts}/${maxAttempts})`);
          } else {
            // error no esperado, lo mostramos pero seguimos intentando hasta maxAttempts
            console.warn("Error al checar huella:", err.response?.data || err.message);
            setStatusFingerprint(`⚠️ Error comprobando huella (intento ${attempts})`);
          }
        }

        if (attempts >= maxAttempts) {
          setStatusFingerprint("❌ Timeout: no se detectó huella. Intenta de nuevo.");
          clearPolling();
        }
      }, 3000);

      // timeout de seguridad (por si setInterval falla)
      pollingTimeoutRef.current = window.setTimeout(() => {
        setStatusFingerprint("❌ Timeout (2 min). Intenta de nuevo.");
        clearPolling();
      }, 2 * 60 * 1000 + 5000);
    } catch (error: any) {
      console.error("Error iniciando solicitud de huella:", error);
      setStatusFingerprint(error.response?.data?.error || "⚠️ Error al iniciar solicitud de huella");
      setLoadingFingerprint(false);
      clearPolling();
    }
  };

  const clearPolling = () => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      window.clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    setLoadingFingerprint(false);
    // limpiar estado después de unos segundos para no saturar la UI
    setTimeout(() => setStatusFingerprint(""), 8000);
  };

  // agregar tarjeta (igual que ya tenías)
  const handleAddCard = async () => {
    if (!user?.correo_usuario) {
      alert("El usuario debe tener un correo para solicitar tarjeta.");
      return;
    }
    setLoadingCard(true);
    setStatusCard("⏳ Enviando solicitud de tarjeta...");
    try {
      const response = await axios.post("http://localhost:5001/api/ttlock/addCard", {
        correo_usuario: user.correo_usuario
      });
      setStatusCard("✅ Solicitud enviada. Abre la app TTLock para sincronizar la cerradura.");
      // opcional: refrescar usuarios (si se actualizó DB)
      onLinkedSuccessfully && onLinkedSuccessfully();
    } catch (err: any) {
      console.error("Error agregando tarjeta:", err);
      setStatusCard(err.response?.data?.error || "⚠️ Error al enviar solicitud de tarjeta");
    } finally {
      setLoadingCard(false);
      setTimeout(() => setStatusCard(""), 6000);
    }
  };

  // limpieza si se cierra modal
  useEffect(() => {
    return () => clearPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex flex-col items-center space-y-3">
          <Avatar className="w-24 h-24">
            {photo ? (
              <AvatarImage src={photo} alt="Usuario" />
            ) : (
              <AvatarFallback className="bg-blue-100 text-blue-600">
                <Camera className="w-8 h-8" />
              </AvatarFallback>
            )}
          </Avatar>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setPhoto(reader.result as string);
                reader.readAsDataURL(file);
              }
            }}
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}>
            <Camera className="w-4 h-4 mr-2" />
            {photo ? "Cambiar" : "Agregar"} Foto
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input value={user.nombre_usuario || ""} onChange={(e) => setUser({ ...user, nombre_usuario: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label>Apellido</Label>
          <Input value={user.apellido_usuario || ""} onChange={(e) => setUser({ ...user, apellido_usuario: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label>Correo</Label>
          <Input value={user.correo_usuario || ""} onChange={(e) => setUser({ ...user, correo_usuario: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input value={user.telefono_usuario || ""} onChange={(e) => setUser({ ...user, telefono_usuario: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label>Cargo</Label>
          <Select value={user.cargo_usuario || ""} onValueChange={(val) => setUser({ ...user, cargo_usuario: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Supervisor">Supervisor</SelectItem>
              <SelectItem value="Seguridad">Seguridad</SelectItem>
              <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
              <SelectItem value="Administración">Administración</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Nivel de Acceso (1 a 5)</Label>
          <Select value={String(user.nivel_acceso || "")} onValueChange={(val) => setUser({ ...user, nivel_acceso: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Bajo</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5 - Máximo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-3 border-t space-y-3">
          <Label>Opciones de acceso TTLock</Label>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleLinkFingerprint}
              disabled={loadingFingerprint}
            >
              {loadingFingerprint ? "⏳ Esperando huella..." : "Agregar Huella"}
            </Button>

            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleAddCard}
              disabled={loadingCard}
            >
              {loadingCard ? "⏳ Esperando tarjeta..." : "Agregar Tarjeta"}
            </Button>
          </div>
          {statusFingerprint && <p className="text-sm text-green-600">{statusFingerprint}</p>}
          {statusCard && <p className="text-sm text-green-600">{statusCard}</p>}
        </div>

        <div className="flex space-x-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={() => { clearAllPolls(); onCancel(); }}>Cancelar</Button>
          <Button className="flex-1" onClick={onSave}>Guardar</Button>
        </div>
      </div>
    </>
  );

  // helpers local
  function clearAllPolls() {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      window.clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    setLoadingFingerprint(false);
  }
}
