import { useState, useRef } from "react";
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

const mockUsers = [
  {
    id: 1,
    name: "María González",
    email: "maria@agencia.com",
    role: "Administrador",
    department: "Administración",
    accessLevel: "Alto",
    cardId: "RFID001",
    status: "Activo",
    lastAccess: "2025-01-06 09:15",
    photo: null as string | null
  },
  {
    id: 2,
    name: "Carlos López",
    email: "carlos@agencia.com",
    role: "Mecánico",
    department: "Taller",
    accessLevel: "Medio",
    cardId: "RFID002",
    status: "Activo",
    lastAccess: "2025-01-06 09:12",
    photo: null as string | null
  },
  {
    id: 3,
    name: "Ana Rodríguez",
    email: "ana@agencia.com",
    role: "Vendedor",
    department: "Ventas",
    accessLevel: "Bajo",
    cardId: "RFID003",
    status: "Activo",
    lastAccess: "2025-01-06 09:05",
    photo: null as string | null
  },
  {
    id: 4,
    name: "Juan Pérez",
    email: "juan@agencia.com",
    role: "Supervisor",
    department: "Taller",
    accessLevel: "Alto",
    cardId: "RFID004",
    status: "Inactivo",
    lastAccess: "2025-01-05 18:30",
    photo: null as string | null
  }
];

export function UserManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<typeof mockUsers[0] | null>(null);
  const [newUserPhoto, setNewUserPhoto] = useState<string | null>(null);
  const newUserPhotoInputRef = useRef<HTMLInputElement>(null);
  const editUserPhotoInputRef = useRef<HTMLInputElement>(null);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleNewUserPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewUserPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditUserPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingUser({ ...editingUser, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (user: typeof mockUsers[0]) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingUser) {
      setUsers(users.map(user => 
        user.id === editingUser.id ? editingUser : user
      ));
      setIsEditDialogOpen(false);
      setEditingUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administrar usuarios y permisos de acceso
          </p>
        </div>
        
        {/* Dialog para Agregar Usuario */}
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
              {/* Foto de perfil */}
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

              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" placeholder="Ingrese el nombre completo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@agencia.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taller">Taller</SelectItem>
                    <SelectItem value="ventas">Ventas</SelectItem>
                    <SelectItem value="administracion">Administración</SelectItem>
                    <SelectItem value="recepcion">Recepción</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessLevel">Nivel de Acceso</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bajo">Bajo</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button variant="outline" className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Asignar Tarjeta RFID
                </Button>
              </div>
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
                  }}
                >
                  Crear Usuario
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog para Editar Usuario */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              {/* Foto de perfil */}
              <div className="flex flex-col items-center space-y-3">
                <Avatar className="w-24 h-24">
                  {editingUser.photo ? (
                    <AvatarImage src={editingUser.photo} alt={editingUser.name} />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getInitials(editingUser.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <input
                  ref={editUserPhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditUserPhotoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editUserPhotoInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {editingUser.photo ? "Cambiar" : "Agregar"} Foto
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre Completo</Label>
                <Input 
                  id="edit-name" 
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="Ingrese el nombre completo" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email" 
                  type="email" 
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="email@agencia.com" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Departamento</Label>
                <Select 
                  value={editingUser.department.toLowerCase()}
                  onValueChange={(value) => setEditingUser({ ...editingUser, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taller">Taller</SelectItem>
                    <SelectItem value="ventas">Ventas</SelectItem>
                    <SelectItem value="administración">Administración</SelectItem>
                    <SelectItem value="recepcion">Recepción</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-accessLevel">Nivel de Acceso</Label>
                <Select 
                  value={editingUser.accessLevel.toLowerCase()}
                  onValueChange={(value) => setEditingUser({ ...editingUser, accessLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bajo">Bajo</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cardId">Tarjeta RFID</Label>
                <Input 
                  id="edit-cardId" 
                  value={editingUser.cardId}
                  onChange={(e) => setEditingUser({ ...editingUser, cardId: e.target.value })}
                  placeholder="RFID001" 
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingUser(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleSaveEdit}
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              <TableHead>Departamento</TableHead>
              <TableHead>Nivel de Acceso</TableHead>
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
                  <Badge variant={getAccessLevelColor(user.accessLevel)}>
                    {user.accessLevel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {user.cardId}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(user.status)}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.lastAccess}
                </TableCell>
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
