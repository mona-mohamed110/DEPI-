import { useState } from "react";
import { useApp } from "../../context/AppContext.jsx";
import "../../components/Style/Admin/Accounts.css";

function Accounts() {
  const { t, lang } = useApp();

  const [users, setUsers] = useState([
    { id: 1, name: "منى محمد", email: "mona@example.com", role: "pt", active: true },
    { id: 2, name: "أحمد حسن", email: "ahmed.h@example.com", role: "pt", active: true },
    { id: 3, name: "نورا إبراهيم", email: "noura@example.com", role: "pt", active: false },
    { id: 4, name: "د. أحمد سمير", email: "dr.ahmed@clinic.com", role: "dr", active: true },
    { id: 5, name: "د. مها خالد", email: "dr.maha@clinic.com", role: "dr", active: false },
    { id: 6, name: "معمل الأمل", email: "alamal@lab.com", role: "lab", active: true },
    { id: 7, name: "سلمى أحمد", email: "salma@clinic.com", role: "rc", active: true },
  ]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [toast, setToast] = useState("");
  const [confirmUser, setConfirmUser] = useState(null);

  function showToast(text) {
    setToast(text);
    setTimeout(function () {
      setToast("");
    }, 2200);
  }

  function changeUser(id) {
    let message = "";
    const newUsers = users.map(function (u) {
      if (u.id === id) {
        if (u.active) {
          message = t("adm_toast_stopped") + " " + u.name;
        } else {
          message = t("adm_toast_activated") + " " + u.name;
        }
        return { ...u, active: !u.active };
      }
      return u;
    });
    setUsers(newUsers);
    showToast(message);
  }

  function toggleUser(u) {
    if (u.active) {
      setConfirmUser(u);
    } else {
      changeUser(u.id);
    }
  }

  function confirmStop() {
    changeUser(confirmUser.id);
    setConfirmUser(null);
  }

  const filteredUsers = users.filter(function (u) {
    const matchRole = role === "all" || u.role === role;
    const matchSearch = u.name.includes(search) || u.email.includes(search);
    return matchRole && matchSearch;
  });

  const activeCount = users.filter(function (u) {
    return u.active;
  }).length;

  const questionMark = lang === "ar" ? "؟" : "?";

  return (
    <div className="accounts">
      <h1>{t("adm_acc_title")}</h1>
      <p className="accounts-sub">{t("adm_acc_sub")}</p>

      <div className="accounts-stats">
        <div className="accounts-card">
          <span>{t("adm_acc_total")}</span>
          <b>{users.length}</b>
        </div>
        <div className="accounts-card">
          <span>{t("adm_acc_active")}</span>
          <b>{activeCount}</b>
        </div>
        <div className="accounts-card">
          <span>{t("adm_acc_stopped")}</span>
          <b>{users.length - activeCount}</b>
        </div>
      </div>

      <div className="accounts-card">
        <input
          className="accounts-search"
          type="text"
          placeholder={t("adm_acc_search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="accounts-tabs">
          <button className={role === "all" ? "on" : ""} onClick={() => setRole("all")}>{t("adm_tab_all")}</button>
          <button className={role === "pt" ? "on" : ""} onClick={() => setRole("pt")}>{t("adm_tab_pt")}</button>
          <button className={role === "dr" ? "on" : ""} onClick={() => setRole("dr")}>{t("adm_tab_dr")}</button>
          <button className={role === "lab" ? "on" : ""} onClick={() => setRole("lab")}>{t("adm_tab_lab")}</button>
          <button className={role === "rc" ? "on" : ""} onClick={() => setRole("rc")}>{t("adm_tab_rc")}</button>
        </div>

        {filteredUsers.map(function (u) {
          return (
            <div className="accounts-row" key={u.id}>
              <div className="accounts-avatar">{u.name.replace("د. ", "").charAt(0)}</div>
              <div className="accounts-info">
                <b>{u.name}</b>
                <small dir="ltr" style={{ textAlign: "start" }}>{u.email}</small>
              </div>
              <span className="accounts-badge">{t("adm_role_" + u.role)}</span>
              <span className={u.active ? "accounts-badge ok" : "accounts-badge stop"}>
                {u.active ? t("adm_on") : t("adm_off")}
              </span>
              <button
                className={u.active ? "accounts-switch on" : "accounts-switch"}
                onClick={() => toggleUser(u)}
              ></button>
            </div>
          );
        })}

        {filteredUsers.length === 0 && <p>{t("adm_none")}</p>}
      </div>

      {confirmUser && (
        <div className="admin-overlay" onClick={() => setConfirmUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("adm_stop_title")}</h2>
            <p>{t("adm_stop_ask")} {confirmUser.name}{questionMark}</p>
            <div className="admin-modal-actions">
              <button className="licenses-btn danger" onClick={confirmStop}>{t("adm_stop_yes")}</button>
              <button className="licenses-btn outline" onClick={() => setConfirmUser(null)}>{t("adm_cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

export default Accounts;