import { useState } from "react";
import "../../components/Style/Admin/Accounts.css";

function Accounts() {
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
        message = "تم إيقاف حساب " + u.name;
      } else {
        message = "تم تفعيل حساب " + u.name;
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

  function roleName(r) {
    if (r === "pt") return "مريض";
    if (r === "dr") return "طبيب";
    if (r === "lab") return "معمل";
    return "استقبال";
  }

  const filteredUsers = users.filter(function (u) {
    const matchRole = role === "all" || u.role === role;
    const matchSearch = u.name.includes(search) || u.email.includes(search);
    return matchRole && matchSearch;
  });

  const activeCount = users.filter(function (u) {
    return u.active;
  }).length;

  return (
    <div className="accounts" dir="rtl">
      <h1>إدارة الحسابات</h1>
      <p className="accounts-sub">تفعيل أو إيقاف أي حساب في المنصة</p>

      <div className="accounts-stats">
        <div className="accounts-card">
          <span>إجمالي الحسابات</span>
          <b>{users.length}</b>
        </div>
        <div className="accounts-card">
          <span>حسابات مفعّلة</span>
          <b>{activeCount}</b>
        </div>
        <div className="accounts-card">
          <span>حسابات موقوفة</span>
          <b>{users.length - activeCount}</b>
        </div>
      </div>

      <div className="accounts-card">
        <input
          className="accounts-search"
          type="text"
          placeholder="ابحثي بالاسم أو البريد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="accounts-tabs">
          <button className={role === "all" ? "on" : ""} onClick={() => setRole("all")}>الكل</button>
          <button className={role === "pt" ? "on" : ""} onClick={() => setRole("pt")}>المرضى</button>
          <button className={role === "dr" ? "on" : ""} onClick={() => setRole("dr")}>الأطباء</button>
          <button className={role === "lab" ? "on" : ""} onClick={() => setRole("lab")}>المعامل</button>
          <button className={role === "rc" ? "on" : ""} onClick={() => setRole("rc")}>الاستقبال</button>
        </div>

        {filteredUsers.map(function (u) {
          return (
            <div className="accounts-row" key={u.id}>
              <div className="accounts-avatar">{u.name.replace("د. ", "").charAt(0)}</div>
              <div className="accounts-info">
                <b>{u.name}</b>
                <small>{u.email}</small>
              </div>
              <span className="accounts-badge">{roleName(u.role)}</span>
              <span className={u.active ? "accounts-badge ok" : "accounts-badge stop"}>
                {u.active ? "مفعّل" : "موقوف"}
              </span>
              <button
                className={u.active ? "accounts-switch on" : "accounts-switch"}
                onClick={() => toggleUser(u)}
              ></button>
            </div>
          );
        })}

        {filteredUsers.length === 0 && <p>مفيش نتائج</p>}
      </div>
      {confirmUser && (
  <div className="admin-overlay" onClick={() => setConfirmUser(null)}>
    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
      <h2>إيقاف الحساب</h2>
      <p>هل أنتِ متأكدة من إيقاف حساب {confirmUser.name}؟</p>
      <div className="admin-modal-actions">
        <button className="licenses-btn danger" onClick={confirmStop}>نعم، إيقاف</button>
        <button className="licenses-btn outline" onClick={() => setConfirmUser(null)}>إلغاء</button>
      </div>
    </div>
  </div>
)}

{toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

export default Accounts;