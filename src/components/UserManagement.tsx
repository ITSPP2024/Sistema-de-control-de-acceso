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
import { Plus, Edit, Trash2, CreditCard, Camera } from "lucide-react";

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newUserPhoto, setNewUserPhoto] = useState<string | null>(null);
  const newUserPhotoInputRef = useRef<HTMLInputElement>(null);
  const editUserPhotoInputRef = useRef<HTMLInputElement>(null);

  // ✅ Cargar usuarios desde el backend
  useEffect(() => {
    axios.get("http://localhost:3001/api/usuarios")
      .then((res) => {
        setUsers(res.data);
      })
      .catch((err) => {
        console.error("Error al cargar usuarios:", err);
      });
  }, []);

  // 🔍 Filtro de búsqueda
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🎨 Funciones auxiliares
  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "Alto": return "destructive";
      case "Medio": return "default";
      case "Bajo": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "Activo" ? "default" : "secondary";
  };

  const getInitials = (name: string) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "";

  // 📸 Subir foto
  const handleNewUserPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewUserPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEditUserPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingUser) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setEditingUser({ ...editingUser, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingUser) {
      // Aquí puedes hacer un PUT al backend
      setUsers(users.map(u => (u.id === editingUser.id ? editingUser : u)));
      setIsEditDialogOpen(false);
      setEditingUser(null);
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
  <DialogHeader>
    <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
  </DialogHeader>

  <div className="space-y-4">
    {/* 📸 Foto de perfil */}
    <div className="flex flex-col items-center space-y-3">
      <Avatar className="w-24 h-24">
        {newUserPhoto ? (
          <AvatarImage src={newUserPhoto} alt="Nuevo usuario" />
        ) : (
          <AvatarFallback className="bg-blue-100 text-blue-600">
            <Camera className="w-8 h-8" />
          </AvatarFallback>
        )}
      </Avatar>
      <input
        ref={newUserPhotoInputRef}
        type="file"
        accept="image/*"
        onChange={handleNewUserPhotoUpload}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => newUserPhotoInputRef.current?.click()}
      >
        <Camera className="w-4 h-4 mr-2" />
        {newUserPhoto ? "Cambiar" : "Agregar"} Foto
      </Button>
    </div>

    {/* 🧾 Campos de información */}
    <div className="space-y-2">
      <Label htmlFor="name">Nombre</Label>
      <Input id="name" placeholder="Ingrese el nombre" />
    </div>

    <div className="space-y-2">
      <Label htmlFor="apellido">Apellido</Label>
      <Input id="apellido" placeholder="Ingrese el apellido" />
    </div>

    <div className="space-y-2">
      <Label htmlFor="correo">Correo</Label>
      <Input id="correo" placeholder="correo@empresa.com" />
    </div>

    <div className="space-y-2">
      <Label htmlFor="telefono">Teléfono</Label>
      <Input id="telefono" placeholder="123-123-1212" />
    </div>

    {/* 💼 Cargo */}
    <div className="space-y-2">
      <Label htmlFor="cargo">Cargo</Label>
      <Select>
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

    {/* 🔐 Nivel de acceso */}
    <div className="space-y-2">
      <Label htmlFor="nivelAcceso">Nivel de Acceso (1 a 5)</Label>
      <Select>
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

    {/* 🔘 Botones */}
    <div className="flex space-x-2 pt-2">
      <Button
        variant="outline"
        className="flex-1"
        onClick={() => {
          setIsAddDialogOpen(false);
          setNewUserPhoto(null);
        }}
      >
        Cancelar
      </Button>
      <Button
        className="flex-1"
        onClick={() => {
          setIsAddDialogOpen(false);
          setNewUserPhoto(null);
          // Aquí podrías hacer el POST al backend con axios
        }}
      >
        Crear Usuario
      </Button>
    </div>
  </div>
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
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      {user.photo ? (
                        <AvatarImage src={user.photo} alt={user.name} />
                      ) : (
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{user.cardId}</code>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(user.status)}>{user.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.lastAccess}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      title="Editar usuario"
                      onClick={() => handleEditClick(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" title="Eliminar usuario">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
