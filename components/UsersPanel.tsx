"use client";
import { useState, useRef } from "react";
import { UserDoc, Role } from "@/lib/types";
import CustomSelect from "./CustomSelect";
import ProfilePictureUpload from "./ProfilePictureUpload";

export default function UsersPanel({ currentUserId, users, reload }: { currentUserId: string; users: UserDoc[]; reload: () => void }) {
  const [error, setError] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("business_developer");
  const [creating, setCreating] = useState(false);

  // State for the new user's profile picture
  const [newUserImage, setNewUserImage] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const createFileRef = useRef<HTMLInputElement>(null);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<Role>("business_developer");

  // Handle uploading image *before* user is created
  const handleCreateImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    // No userId passed — the backend will just upload and return the URL for now

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        setNewUserImage(json.imageUrl);
      } else {
        alert(json.error || "Image upload failed");
      }
    } catch {
      alert("Network error during image upload");
    } finally {
      setUploadingImage(false);
      if (createFileRef.current) createFileRef.current.value = "";
    }
  };

  const createUser = async () => {
    setError(""); setCreating(true);
    try {
      // Pass the uploaded image URL to the backend
      const res = await fetch("/api/admin/users", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: newUsername, 
          email: newEmail, 
          phone: newPhone, 
          password: newPassword, 
          role: newRole,
          profilePicture: newUserImage 
        }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error || "Failed to create user"); return; }
      
      // Reset form
      setNewUsername(""); setNewEmail(""); setNewPhone(""); setNewPassword(""); setNewRole("business_developer"); setNewUserImage("");
      reload();
      alert("User created. Welcome email sent.");
    } catch (e: any) { setError(e.message); }
    finally { setCreating(false); }
  };

  const removeUser = async (id: string, username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return;
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) reload();
    else alert(json.error || "Failed to delete");
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, newUsername: editUsername, newEmail: editEmail, newPhone: editPhone, newRole: editRole }),
      });
      const json = await res.json();
      if (json.success) {
        alert("User updated.");
        setEditingUserId(null);
        reload();
      } else {
        alert(json.error || "Failed to update user");
      }
    } catch { alert("Network error while saving."); }
  };

  return (
    <div className="space-y-6">
      {/* CREATE NEW USER */}
      <div className="bg-white border border-stone-200 rounded-none p-4 sm:p-5 shadow-sm">
        <h2 className="text-xs font-bold text-black uppercase tracking-wider mb-4">Create New User</h2>
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Image Upload Preview for New User */}
          <div className="shrink-0 flex flex-col items-center justify-center pt-2">
            <input type="file" accept="image/*" className="hidden" ref={createFileRef} onChange={handleCreateImageUpload} />
            <div 
              onClick={() => !uploadingImage && createFileRef.current?.click()}
              className="w-20 h-20 rounded-full bg-stone-100 border-2 border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group hover:border-indigo-400 transition-colors"
            >
              {newUserImage ? (
                <>
                  <img src={newUserImage} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold uppercase">Change</span>
                  </div>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 text-stone-400 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-[9px] font-bold text-stone-500 uppercase">Upload</span>
                </>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" />
                  </svg>
                </div>
              )}
            </div>
            <span className="text-[10px] text-stone-400 mt-2">Optional</span>
          </div>

          {/* Form Fields */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <input className="px-3 py-2 border border-stone-300 rounded-none text-sm text-black focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            <input type="email" className="px-3 py-2 border border-stone-300 rounded-none text-sm text-black focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Email (required)" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            {/* Phone is now marked as required in UI */}
            <input className="px-3 py-2 border border-stone-300 rounded-none text-sm text-black focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Phone (required)" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
            <input type="password" className="px-3 py-2 border border-stone-300 rounded-none text-sm text-black focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <CustomSelect options={[{ value: "business_developer", label: "Business Developer" }, { value: "admin", label: "Admin" }]} value={newRole} onChange={(val) => setNewRole(val as Role)} />
            
            {/* Button is disabled unless Phone is provided */}
            <button 
              onClick={createUser} 
              disabled={creating || !newUsername || !newEmail || !newPhone || !newPassword || uploadingImage} 
              className="px-4 py-2 rounded-none text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-40 transition-colors"
            >
              {creating ? "Creating…" : "Create User"}
            </button>
          </div>
        </div>
        {error && <div className="mt-3 text-rose-700 text-xs bg-rose-50 border border-rose-200 rounded-none px-3 py-2">{error}</div>}
      </div>

      {/* USERS TABLE */}
      <div className="bg-white border border-stone-200 rounded-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-175">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-left">
                <th className="px-5 py-3 text-[10.5px] font-bold text-black uppercase tracking-wider w-16">Avatar</th>
                <th className="px-5 py-3 text-[10.5px] font-bold text-black uppercase tracking-wider">Username</th>
                <th className="px-5 py-3 text-[10.5px] font-bold text-black uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-[10.5px] font-bold text-black uppercase tracking-wider">Phone</th>
                <th className="px-5 py-3 text-[10.5px] font-bold text-black uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-stone-50/60">
                  <td className="px-5 py-3">
                    <ProfilePictureUpload 
                      currentImage={u.profilePicture} 
                      userId={u._id} 
                      onUploadSuccess={() => reload()} 
                    />
                  </td>
                  <td className="px-5 py-3.5 font-medium text-black">
                    {editingUserId === u._id ? (
                      <input className="px-2 py-1 border border-stone-300 rounded-none text-sm text-black w-full" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
                    ) : (
                      <>{u.username}{u._id === currentUserId && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-none bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">YOU</span>}</>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-black/80">
                    {editingUserId === u._id ? <input className="px-2 py-1 border border-stone-300 rounded-none text-xs w-full" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} /> : u.email}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-black/80">
                    {editingUserId === u._id ? <input className="px-2 py-1 border border-stone-300 rounded-none text-xs w-full" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /> : (u.phone || <span className="text-black/40">—</span>)}
                  </td>
                  <td className="px-5 py-3.5">
                    {editingUserId === u._id ? (
                      <select className="px-2 py-1 border border-stone-300 rounded-none text-sm text-black" value={editRole} onChange={(e) => setEditRole(e.target.value as Role)}>
                        <option value="business_developer">Business Developer</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 rounded-none text-[11px] font-medium border ${u.role === "admin" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-stone-100 text-black border-stone-200"}`}>{u.role.replace("_", " ")}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-3">
                    {editingUserId === u._id ? (
                      <>
                        <button onClick={() => saveEdit(u._id)} className="text-xs font-medium text-emerald-600 hover:text-emerald-800">Save</button>
                        <button onClick={() => setEditingUserId(null)} className="text-xs font-medium text-stone-500 hover:text-stone-700">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingUserId(u._id); setEditUsername(u.username); setEditEmail(u.email); setEditPhone(u.phone || ""); setEditRole(u.role); }} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Edit</button>
                        {u._id !== currentUserId && <button onClick={() => removeUser(u._id, u.username)} className="text-xs font-medium text-rose-600 hover:text-rose-800">Delete</button>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}