import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import "../../components/Style/Admin/Profile.css";

function Profile() {
  const { t } = useApp();
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
      showToast(t("adm_pf_required"));
      return;
    }
    setAdmin({ ...admin, [editing]: tempValue });
    setEditing("");
    showToast(t("adm_pf_toast_saved"));
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
      setError(t("adm_pf_err_old"));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("adm_pf_err_len"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("adm_pf_err_match"));
      return;
    }
    closePass();
    showToast(t("adm_pf_toast_pass"));
  }

  return (
    <div className="profile">
      <h1>{t("adm_pf_title")}</h1>
      <p className="profile-sub">{t("adm_pf_sub")}</p>

      <div className="profile-card">
        <div className="profile-head">
          <div className="profile-avatar">{admin.name.charAt(0)}</div>
          <div>
            <b>{admin.name}</b>
            <span className="profile-badge">{t("adm_name")}</span>
          </div>
        </div>

        <div className="profile-row">
          <span className="profile-label">{t("name")}</span>
          {editing === "name" ? (
            <div className="profile-edit">
              <input value={tempValue} onChange={(e) => setTempValue(e.target.value)} />
              <button className="profile-btn" onClick={saveEdit}>{t("save")}</button>
              <button className="profile-btn outline" onClick={cancelEdit}>{t("adm_cancel")}</button>
            </div>
          ) : (
            <>
              <span className="profile-value">{admin.name}</span>
              <button className="profile-pencil" onClick={() => startEdit("name")}>✏️</button>
            </>
          )}
        </div>

        <div className="profile-row">
          <span className="profile-label">{t("email")}</span>
          {editing === "email" ? (
            <div className="profile-edit">
              <input dir="ltr" value={tempValue} onChange={(e) => setTempValue(e.target.value)} />
              <button className="profile-btn" onClick={saveEdit}>{t("save")}</button>
              <button className="profile-btn outline" onClick={cancelEdit}>{t("adm_cancel")}</button>
            </div>
          ) : (
            <>
              <span className="profile-value" dir="ltr" style={{ textAlign: "start" }}>{admin.email}</span>
              <button className="profile-pencil" onClick={() => startEdit("email")}>✏️</button>
            </>
          )}
        </div>

        <div className="profile-row">
          <span className="profile-label">{t("adm_pf_password")}</span>
          <span className="profile-value">••••••••</span>
          <button className="profile-btn outline" onClick={() => setShowPass(true)}>{t("change_password")}</button>
        </div>
      </div>

      {showPass && (
        <div className="profile-overlay" onClick={closePass}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("change_password")}</h2>

            <label>{t("adm_pf_old")}</label>
            <input type="password" dir="ltr" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />

            <label>{t("adm_pf_new")}</label>
            <input type="password" dir="ltr" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

            <label>{t("adm_pf_confirm")}</label>
            <input type="password" dir="ltr" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

            {error && <p className="profile-error">{error}</p>}

            <div className="profile-actions">
              <button className="profile-btn" onClick={savePassword}>{t("save")}</button>
              <button className="profile-btn outline" onClick={closePass}>{t("adm_cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

export default Profile;