import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import "../../components/Style/Admin/Profile.css";

function Profile() {
  const { admin, setAdmin } = useOutletContext();

  const [editing, setEditing] = useState("");
  const [tempValue, setTempValue] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const [toast, setToast] = useState("");

  function showToast(text) {
    setToast(text);
    setTimeout(function () {
      setToast("");
    }, 2200);
  }

  function startEdit(field) {
    setEditing(field);
    setTempValue(admin[field]);
  }

  function cancelEdit() {
    setEditing("");
    setTempValue("");
  }

  function saveEdit() {
    if (tempValue.trim() === "") {
      showToast("الحقل مطلوب");
      return;
    }
    setAdmin({ ...admin, [editing]: tempValue });
    setEditing("");
    showToast("تم حفظ التغيير ✅");
  }

  function closePass() {
    setShowPass(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }

  function savePassword() {
    if (oldPassword === "") {
      setError("اكتبي كلمة المرور الحالية");
      return;
    }
    if (newPassword.length < 8) {
      setError("كلمة المرور الجديدة لازم تكون 8 حروف على الأقل");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("كلمة المرور الجديدة مش متطابقة");
      return;
    }
    closePass();
    showToast("تم تغيير كلمة المرور ✅");
  }

  return (
    <div className="profile" dir="rtl">
      <h1>الملف الشخصي</h1>
      <p className="profile-sub">بياناتك الشخصية وكلمة المرور</p>

      <div className="profile-card">
        <div className="profile-head">
          <div className="profile-avatar">{admin.name.charAt(0)}</div>
          <div>
            <b>{admin.name}</b>
            <span className="profile-badge">مدير النظام</span>
          </div>
        </div>

        <div className="profile-row">
          <span className="profile-label">الاسم</span>
          {editing === "name" ? (
            <div className="profile-edit">
              <input value={tempValue} onChange={(e) => setTempValue(e.target.value)} />
              <button className="profile-btn" onClick={saveEdit}>حفظ</button>
              <button className="profile-btn outline" onClick={cancelEdit}>إلغاء</button>
            </div>
          ) : (
            <>
              <span className="profile-value">{admin.name}</span>
              <button className="profile-pencil" onClick={() => startEdit("name")}>✏️</button>
            </>
          )}
        </div>

        <div className="profile-row">
          <span className="profile-label">البريد الإلكتروني</span>
          {editing === "email" ? (
            <div className="profile-edit">
              <input dir="ltr" value={tempValue} onChange={(e) => setTempValue(e.target.value)} />
              <button className="profile-btn" onClick={saveEdit}>حفظ</button>
              <button className="profile-btn outline" onClick={cancelEdit}>إلغاء</button>
            </div>
          ) : (
            <>
              <span className="profile-value" dir="ltr">{admin.email}</span>
              <button className="profile-pencil" onClick={() => startEdit("email")}>✏️</button>
            </>
          )}
        </div>

        <div className="profile-row">
          <span className="profile-label">كلمة المرور</span>
          <span className="profile-value">••••••••</span>
          <button className="profile-btn outline" onClick={() => setShowPass(true)}>تغيير كلمة المرور</button>
        </div>
      </div>

      {showPass && (
        <div className="profile-overlay" onClick={closePass}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <h2>تغيير كلمة المرور</h2>

            <label>كلمة المرور الحالية</label>
            <input type="password" dir="ltr" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />

            <label>كلمة المرور الجديدة</label>
            <input type="password" dir="ltr" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

            <label>تأكيد كلمة المرور الجديدة</label>
            <input type="password" dir="ltr" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

            {error && <p className="profile-error">{error}</p>}

            <div className="profile-actions">
              <button className="profile-btn" onClick={savePassword}>حفظ</button>
              <button className="profile-btn outline" onClick={closePass}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

export default Profile;