"use client";
import { useState, useRef } from "react";
import { UserDoc, Role } from "@/lib/types";
import CustomSelect from "./CustomSelect";
import ProfilePictureUpload from "./ProfilePictureUpload";

// Strips all non-numeric characters and caps at 15 digits
const sanitizePhone = (val: string) => val.replace(/\D/g, "").slice(0, 15);

export default function UsersPanel({ currentUserId, users, reload }: { currentUserId: string; users: UserDoc[]; reload: () => void }) {
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState<Role>("business_developer");
  const [creating, setCreating] = useState(false);

  // State for the new user's profile picture
  const [newUserImage, setNewUserImage] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const createFileRef = useRef<HTMLInputElement>(null);

  // Inline edit state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<Role>("business_developer");
  const [savingEdit, setSavingEdit] = useState(false);

  // Temp password reveal & copy states per user row
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleTempPassword = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyTempPassword = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    }
  };

  // Handle uploading image *before* user is created
  const handleCreateImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    // NOTE: We intentionally do NOT append a userId here.
    // This tells the upload route to just return the URL without updating any database records.

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
    setError("");
    const trimmedName = newName.trim();
    const trimmedEmail = newEmail.trim();
    const cleanedPhone = sanitizePhone(newPhone);

    if (!trimmedName || !trimmedEmail || !newPassword) {
      setError("Name, email, and password are required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (cleanedPhone && cleanedPhone.length < 7) {
      setError("Phone number must be at least 7 digits.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: cleanedPhone,
          password: newPassword,
          role: newRole,
          profilePicture: newUserImage, // Pass the uploaded image URL here
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to create user");
        return;
      }

      // Reset form
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewPassword("");
      setNewRole("business_developer");
      setNewUserImage("");
      setShowPassword(false);
      reload();
      alert("User created. Welcome email sent.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const removeUser = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"?`)) return;
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) reload();
    else alert(json.error || "Failed to delete");
  };

  const saveEdit = async (id: string) => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();
    const cleanedPhone = sanitizePhone(editPhone);

    if (!trimmedName || !trimmedEmail) {
      alert("Name and email cannot be empty.");
      return;
    }
    if (cleanedPhone && cleanedPhone.length < 7) {
      alert("Phone number must be at least 7 digits.");
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: id,
          newName: trimmedName,
          newEmail: trimmedEmail,
          newPhone: cleanedPhone,
          newRole: editRole,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert("User updated.");
        setEditingUserId(null);
        reload();
      } else {
        alert(json.error || "Failed to update user");
      }
    } catch {
      alert("Network error while saving.");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CREATE NEW USER CARD */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-bold text-stone-900 tracking-tight">Create New User</h2>
            <p className="text-xs text-stone-500 mt-0.5">Add a new team member and send their login credentials</p>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
            {users.length} {users.length === 1 ? "Member" : "Members"}
          </span>
        </div>

        <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="flex flex-col md:flex-row gap-6">
          <div className="shrink-0 flex flex-col items-center justify-center">
            <input type="file" accept="image/*" className="hidden" ref={createFileRef} onChange={handleCreateImageUpload} />
            <div
              onClick={() => !uploadingImage && createFileRef.current?.click()}
              className="w-20 h-20 rounded-full bg-stone-50 border-2 border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group hover:border-indigo-500 hover:bg-indigo-50/30 transition-all"
            >
              {newUserImage ? (
                <>
                  <img src={newUserImage} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/55 hidden group-hover:flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">Change</span>
                  </div>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-stone-400 group-hover:text-indigo-500 transition-colors mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Photo</span>
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
            <span className="text-[10px] text-stone-400 mt-1.5 font-medium">Optional</span>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">Full Name *</label>
              <input
                type="text"
                name="new_user_full_name"
                autoComplete="off"
                className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none transition-all"
                placeholder="e.g. Ali Raza"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">Email Address *</label>
              <input
                type="email"
                name="new_user_email_addr"
                autoComplete="off"
                className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none transition-all"
                placeholder="name@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="tel"
                name="new_user_phone_num"
                autoComplete="off"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={15}
                className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none transition-all"
                placeholder="03001234567"
                value={newPhone}
                onChange={(e) => setNewPhone(sanitizePhone(e.target.value))}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("text");
                  setNewPhone((prev) => sanitizePhone(prev + pasted));
                }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">Password *</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  name="new_user_temp_pass"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2 pr-10 border border-stone-300 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none transition-all"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-stone-400 hover:text-stone-700 focus:outline-none transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">Role</label>
              <CustomSelect
                options={[
                  { value: "business_developer", label: "Business Developer" },
                  { value: "admin", label: "Admin" },
                ]}
                value={newRole}
                onChange={(val) => setNewRole(val as Role)}
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={createUser}
                disabled={creating || !newName.trim() || !newEmail.trim() || !newPassword || uploadingImage}
                className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-white bg-stone-900 hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-stone-900 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {creating ? "Creating…" : "+ Create User"}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 text-rose-700 text-xs font-medium bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* USERS TABLE CARD */}
      <div className="bg-white border border-stone-200/90 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-195">
            <thead>
              <tr className="bg-stone-50/90 border-b border-stone-200 text-left">
                <th className="px-5 py-3.5 text-[11px] font-bold text-stone-600 uppercase tracking-wider w-16">Avatar</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-stone-600 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-stone-600 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-stone-600 uppercase tracking-wider">Phone</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-stone-600 uppercase tracking-wider">Temp Password</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-stone-600 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-stone-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => {
                const isRevealed = !!revealedPasswords[u._id];
                const isCopied = copiedId === u._id;

                return (
                  <tr key={u._id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <ProfilePictureUpload
                        currentImage={u.profilePicture}
                        userId={u._id}
                        onUploadSuccess={() => reload()}
                      />
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-stone-900">
                      {editingUserId === u._id ? (
                        <input
                          autoComplete="off"
                          className="px-2.5 py-1.5 border border-stone-300 rounded-md text-sm text-stone-900 w-full focus:border-indigo-500 outline-none"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{u.name}</span>
                          {u._id === currentUserId && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              YOU
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-stone-600">
                      {editingUserId === u._id ? (
                        <input
                          type="email"
                          autoComplete="off"
                          className="px-2.5 py-1.5 border border-stone-300 rounded-md text-xs w-full focus:border-indigo-500 outline-none"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                        />
                      ) : (
                        u.email
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-stone-600 font-mono">
                      {editingUserId === u._id ? (
                        <input
                          type="tel"
                          autoComplete="off"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={15}
                          className="px-2.5 py-1.5 border border-stone-300 rounded-md text-xs w-full focus:border-indigo-500 outline-none"
                          value={editPhone}
                          onChange={(e) => setEditPhone(sanitizePhone(e.target.value))}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pasted = e.clipboardData.getData("text");
                            setEditPhone((prev) => sanitizePhone(prev + pasted));
                          }}
                        />
                      ) : (
                        u.phone || <span className="text-stone-400 font-sans">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {u.tempPassword ? (
                        <div className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200 rounded-md px-2.5 py-1">
                          <span className="font-mono text-stone-800 select-all min-w-16">
                            {isRevealed ? u.tempPassword : "••••••••"}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleTempPassword(u._id)}
                            className="p-1 text-stone-500 hover:text-stone-800 rounded hover:bg-stone-200/70 transition-colors"
                            title={isRevealed ? "Hide password" : "Show password"}
                            aria-label={isRevealed ? "Hide password" : "Show password"}
                          >
                            {isRevealed ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => copyTempPassword(u._id, u.tempPassword!)}
                            className={`p-1 rounded transition-colors ${
                              isCopied
                                ? "text-emerald-600 bg-emerald-50"
                                : "text-stone-500 hover:text-indigo-600 hover:bg-stone-200/70"
                            }`}
                            title={isCopied ? "Copied!" : "Copy password"}
                            aria-label={isCopied ? "Copied!" : "Copy password"}
                          >
                            {isCopied ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {editingUserId === u._id ? (
                        <select
                          className="px-2.5 py-1.5 border border-stone-300 rounded-md text-xs text-stone-900 bg-white focus:border-indigo-500 outline-none"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as Role)}
                        >
                          <option value="business_developer">Business Developer</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="text-xs font-semibold text-stone-700 capitalize">
                          {u.role.replace("_", " ")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {editingUserId === u._id ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(u._id)}
                            disabled={savingEdit}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                          >
                            {savingEdit ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            disabled={savingEdit}
                            className="px-2.5 py-1 rounded-md text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingUserId(u._id);
                              setEditName(u.name);
                              setEditEmail(u.email);
                              setEditPhone(sanitizePhone(u.phone || ""));
                              setEditRole(u.role);
                            }}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 transition-colors"
                          >
                            Edit
                          </button>
                          {u._id !== currentUserId && (
                            <button
                              onClick={() => removeUser(u._id, u.name)}
                              className="px-2.5 py-1 rounded-md text-xs font-semibold text-rose-600 bg-rose-50/70 hover:bg-rose-100 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}