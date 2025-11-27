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

export function UserManagement({ currentUser }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newUserPhoto, setNewUserPhoto] = useState<string | null>(null);
  const newUserPhotoInputRef = useRef<HTMLInputElement>(null);
  const editUserPhotoInputRef = useRef<HTMLInputElement>(null);
  const [newUser, setNewUser] = useState({
    nombre_usuario: "",
    apellido_usuario: "",
    correo_usuario: "",
    telefono_usuario: "",
    cargo_usuario: "",
    nivel_acceso: "",
    targeta_usuario: "",
    photo: null
  });

  // --- Cargar usuarios ---
  const fetchUsers = () => {
    axios.get("http://localhost:5001/api/usuarios")
      .then(res => setUsers(res.data))
      .catch(err => console.error("Error al cargar usuarios:", err));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Filtrar usuarios ---
  const filteredUsers = users.filter(user =>
    (`${user.nombre_usuario} ${user.apellido_usuario}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.correo_usuario?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.cargo_usuario?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "5": return "destructive";
      case "3": return "default";
      case "1": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => status === "Activo" ? "default" : "secondary";

  const getInitials = (name: string) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "NA";

  // --- Registrar auditoría ---
  const registrarAuditoria = async (accion: string, entidad: string, entidad_id: any, detalle: string) => {
    if (!currentUser) return;
    try {
      await axios.post("http://localhost:5001/api/auditoria", {
        correo: currentUser,  // 👈 el mismo email que ves en App.tsx
        accion,
        entidad,
        entidad_id,
        detalle
      });
    } catch (err) {
      console.error("Error registrando auditoría:", err);
    }
  };

  // --- Crear usuario ---
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
      fetchUsers();
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
        photo: null
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

  // --- Editar usuario ---
  const handleEditClick = (user: any) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingUser) {
      try {
        await axios.put(`http://localhost:5001/api/usuarios/${editingUser.idUsuarios}`, editingUser);
        fetchUsers();
        setIsEditDialogOpen(false);
        setEditingUser(null);
        await registrarAuditoria(
          "EDITAR",
          "USUARIO",
          editingUser.idUsuarios,
          `Usuario ${editingUser.nombre_usuario} ${editingUser.apellido_usuario} modificado`
        );
      } catch (err) {
        console.error("Error editando usuario:", err);
      }
    }
  };

  // --- Eliminar usuario ---
  const handleDeleteUser = async (id: string) => {
    if (confirm("¿Deseas eliminar este usuario?")) {
      try {
        await axios.delete(`http://localhost:5001/api/usuarios/${id}`);
        fetchUsers();
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

  // --- Subir fotos ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setPhoto: Function) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header y botón agregar */}
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
              setUser={setNewUser}
              photo={newUserPhoto}
              setPhoto={setNewUserPhoto}
              photoInputRef={newUserPhotoInputRef}
              onSave={handleCreateUser}
              onCancel={() => { setIsAddDialogOpen(false); setNewUserPhoto(null); }}
              title="Agregar Nuevo Usuario"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de usuarios */}
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
              <TableHead>Zona</TableHead>
              <TableHead>Tarjeta RFID</TableHead>
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
                      {user.photo ? (
                        <AvatarImage src={user.photo} alt={`${user.nombre_usuario} ${user.apellido_usuario}`} />
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
                <TableCell>{user.cargo_usuario || "Sin zona"}</TableCell>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{user.targeta_usuario || "N/A"}</code>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(user.status || "Activo")}>{user.status || "Activo"}</Badge>
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

      {/* Dialog editar usuario */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <UserForm
            user={editingUser || {
              nombre_usuario: "",
              apellido_usuario: "",
              correo_usuario: "",
              telefono_usuario: "",
              cargo_usuario: "",
              nivel_acceso: "",
              targeta_usuario: "",
              photo: null
            }}
            setUser={setEditingUser}
            photo={(editingUser && editingUser.photo) || null}
            setPhoto={(photo) => editingUser && setEditingUser({ ...editingUser, photo })}
            photoInputRef={editUserPhotoInputRef}
            onSave={handleSaveEdit}
            onCancel={() => { setIsEditDialogOpen(false); setEditingUser(null); }}
            title="Editar Usuario"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

  // --- Vincular huella TTLock ---
function UserForm({ user, setUser, photo, setPhoto, photoInputRef, onSave, onCancel, title }: any) {
  const [loadingFingerprint, setLoadingFingerprint] = useState(false);
  const [loadingCard, setLoadingCard] = useState(false);
  const [statusFingerprint, setStatusFingerprint] = useState("");
  const [statusCard, setStatusCard] = useState("");

  // --- Vincular huella TTLock ---
  const handleLinkFingerprint = async () => {
    setLoadingFingerprint(true);
    setStatusFingerprint("⏳ Buscando huella existente...");

   try {
    const response = await axios.post("http://localhost:5001/api/ttlock/linkFingerprint", {
      correo_usuario: user.correo_usuario,
    });

setStatusFingerprint(`✅ Huella vinculada: ${response.data.fingerprint.fingerprintName} (ID ${response.data.fingerprint.fingerprintId})`);
    } catch (error: any) {
      console.error("Error vinculando huella:", error);
      setStatusFingerprint(error.response?.data?.error || "⚠️ Error al vincular huella");
    } finally {
      setLoadingFingerprint(false);
      setTimeout(() => setStatusFingerprint(""), 6000);
    }
  };

  // --- Agregar tarjeta TTLock ---
  // --- Vincular tarjeta TTLock ---
const handleLinkCard = async () => {
  setLoadingCard(true);
  setStatusCard("⏳ Buscando tarjeta existente en la cerradura...");

  try {
    const response = await axios.post("http://localhost:5001/api/ttlock/linkCard", {
      correo_usuario: user.correo_usuario,
    });

    setStatusCard(`✅ Tarjeta vinculada: ${response.data.card.cardName} (ID ${response.data.card.cardId})`);
  } catch (err: any) {
    console.error("Error vinculando tarjeta:", err);
    setStatusCard(err.response?.data?.error || "⚠️ No se pudo vincular tarjeta");
  } finally {
    setLoadingCard(false);
    setTimeout(() => setStatusCard(""), 6000);
  }
};

  
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Foto */}
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

        {/* Campos */}
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input value={user.nombre_usuario} onChange={(e) => setUser({ ...user, nombre_usuario: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Apellido</Label>
          <Input value={user.apellido_usuario} onChange={(e) => setUser({ ...user, apellido_usuario: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Correo</Label>
          <Input value={user.correo_usuario} onChange={(e) => setUser({ ...user, correo_usuario: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input value={user.telefono_usuario} onChange={(e) => setUser({ ...user, telefono_usuario: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Cargo</Label>
          <Select value={user.cargo_usuario} onValueChange={(val) => setUser({ ...user, cargo_usuario: val })}>
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
          <Select value={user.nivel_acceso} onValueChange={(val) => setUser({ ...user, nivel_acceso: val })}>
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

        {/* --- Opciones TTLock --- */}
        <div className="pt-3 border-t space-y-3">
          <Label>Opciones de acceso TTLock</Label>
          <div className="flex space-x-2">
            <Button
  variant="secondary"
  className="flex-1"
  onClick={handleLinkFingerprint} // ⚠️ Antes era handleAddFingerprint
  disabled={loadingFingerprint}
>
  {loadingFingerprint ? "⏳ Esperando huella..." : "Agregar Huella"}
</Button>

            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleLinkCard}
              disabled={loadingCard}
            >
              {loadingCard ? "⏳ Esperando tarjeta..." : "Agregar Tarjeta"}
            </Button>
          </div>
          {statusFingerprint && <p className="text-sm text-green-600">{statusFingerprint}</p>}
          {statusCard && <p className="text-sm text-green-600">{statusCard}</p>}
        </div>

        {/* Botones finales */}
        <div className="flex space-x-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
          <Button className="flex-1" onClick={onSave}>Guardar</Button>
        </div>
      </div>
    </>
  );
}
