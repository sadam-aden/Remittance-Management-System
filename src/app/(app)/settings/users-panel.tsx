"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import {
  userFormSchema,
  userEditFormSchema,
  type UserFormInput,
  type UserEditFormInput,
  USER_ROLES,
} from "@/lib/validation/user";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  setUserActiveAction,
} from "@/lib/actions/user-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: "admin" | "cashier";
  isActive: boolean;
  createdAt: Date;
}

export function UsersPanel({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const addForm = useForm<UserFormInput>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { name: "", email: "", password: "", role: "admin" },
  });

  const editForm = useForm<UserEditFormInput>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: { name: "", email: "", password: "", role: "admin" },
  });

  async function onAddSubmit(data: UserFormInput) {
    setIsSubmitting(true);
    const result = await createUserAction(data);
    setIsSubmitting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("User Added Successfully");
    addForm.reset();
    setAddOpen(false);
  }

  function openEdit(user: UserRow) {
    editForm.reset({ name: user.name ?? "", email: user.email, password: "", role: user.role });
    setEditingUser(user);
  }

  async function onEditSubmit(data: UserEditFormInput) {
    if (!editingUser) return;
    setIsSubmitting(true);
    const result = await updateUserAction(editingUser.id, data);
    setIsSubmitting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("User Updated Successfully");
    setEditingUser(null);
  }

  async function toggleActive(user: UserRow) {
    setTogglingId(user.id);
    const result = await setUserActiveAction(user.id, !user.isActive);
    setTogglingId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(user.isActive ? "User Deactivated" : "User Activated");
  }

  async function confirmDelete() {
    if (!deletingUser) return;
    setIsDeleting(true);
    const result = await deleteUserAction(deletingUser.id);
    setIsDeleting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("User Deleted Successfully");
    setDeletingUser(null);
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-text-primary">Users</h3>
          <p className="mt-1 text-sm text-text-muted">Logins for this system.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            render={
              <Button size="sm">
                <UserPlus size={14} /> Add User
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
            </DialogHeader>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-name">Name</Label>
                <Input id="add-name" {...addForm.register("name")} />
                {addForm.formState.errors.name && (
                  <p className="text-xs text-sent">{addForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-email">Email</Label>
                <Input id="add-email" type="email" {...addForm.register("email")} />
                {addForm.formState.errors.email && (
                  <p className="text-xs text-sent">{addForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-password">Password</Label>
                <Input id="add-password" type="password" {...addForm.register("password")} />
                {addForm.formState.errors.password && (
                  <p className="text-xs text-sent">{addForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <Controller
                  control={addForm.control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="capitalize">
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="mt-2">
                {isSubmitting ? "Adding..." : "Add User"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-hairline hover:bg-transparent">
              <TableHead className="text-text-muted">Name</TableHead>
              <TableHead className="text-text-muted">Email</TableHead>
              <TableHead className="text-text-muted">Role</TableHead>
              <TableHead className="text-text-muted">Status</TableHead>
              <TableHead className="text-right text-text-muted">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className="border-hairline hover:bg-hairline/30">
                <TableCell className="text-text-primary">{u.name ?? "—"}</TableCell>
                <TableCell className="text-text-muted">{u.email}</TableCell>
                <TableCell className="capitalize text-text-muted">{u.role}</TableCell>
                <TableCell>
                  <span className={u.isActive ? "text-income" : "text-sent"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={togglingId === u.id || u.id === currentUserId}
                      onClick={() => toggleActive(u)}
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => openEdit(u)}
                      aria-label="Edit user"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={u.id === currentUserId}
                      onClick={() => setDeletingUser(u)}
                      aria-label="Delete user"
                    >
                      <Trash2 size={14} className="text-sent" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-hairline bg-panel p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-text-primary">{u.name ?? "—"}</span>
              <span className={`text-xs ${u.isActive ? "text-income" : "text-sent"}`}>
                {u.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-text-muted">
              <span className="truncate">{u.email}</span>
              <span className="capitalize">{u.role}</span>
            </div>
            <div className="mt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={togglingId === u.id || u.id === currentUserId}
                onClick={() => toggleActive(u)}
              >
                {u.isActive ? "Deactivate" : "Activate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => openEdit(u)}
                aria-label="Edit user"
              >
                <Pencil size={14} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={u.id === currentUserId}
                onClick={() => setDeletingUser(u)}
                aria-label="Delete user"
              >
                <Trash2 size={14} className="text-sent" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" {...editForm.register("name")} />
              {editForm.formState.errors.name && (
                <p className="text-xs text-sent">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" {...editForm.register("email")} />
              {editForm.formState.errors.email && (
                <p className="text-xs text-sent">{editForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-password">New Password</Label>
              <Input id="edit-password" type="password" placeholder="Leave blank to keep current password" {...editForm.register("password")} />
              {editForm.formState.errors.password && (
                <p className="text-xs text-sent">{editForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Controller
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="capitalize">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingUser?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes their login. Customers, transactions, and audit log entries
              they created stay — they&apos;ll just show as unattributed instead of naming this user.
              This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-sent text-white hover:bg-sent/90"
              onClick={confirmDelete}
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
