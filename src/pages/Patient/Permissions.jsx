import { useEffect, useState } from "react";
import { request, extractList } from "./request";
import ActivePermissions from "./ActivePermissions";
import PendingRequests from "./PendingRequests";
import AccessLog from "./AccessLog";
import "../../components/Style/Patient/Permissions.css";

const TABS = [
  { id: "active", label: "الأذونات النشطة", Component: ActivePermissions },
  { id: "pending", label: "الطلبات المعلقة", Component: PendingRequests },
  { id: "log", label: "سجل الوصول", Component: AccessLog },
];

// نفس الـ endpoint بتاع تاب الطلبات المعلقة — بنستخدمه هنا علشان عدّاد الدايرة الحمرا
const PENDING_ENDPOINT = "/permissions/requests?status=pending";

export default function Permissions() {
  const [tab, setTab] = useState("active");
  const [pendingCount, setPendingCount] = useState(0);

  // عدد الطلبات المعلقة أول ما الصفحة تفتح (حتى لو التاب المفتوح هو الأذونات النشطة)
  useEffect(() => {
    let ignore = false;
    request(PENDING_ENDPOINT)
      .then((res) => {
        if (!ignore) setPendingCount(extractList(res).length);
      })
      .catch(() => {
        /* لو فشل، الدايرة ببساطة مش هتظهر */
      });
    return () => {
      ignore = true;
    };
  }, []);

  const ActiveTab = TABS.find((t) => t.id === tab).Component;

  return (
    <main className="pm" dir="rtl">
      <header className="pm-head">
        <h1>🔐 إدارة الأذونات</h1>
        <p>أنت اللي بتتحكم مين يشوف ملفك الطبي، ولأي مدة</p>
      </header>

      <div className="pm-tabs" role="tablist" aria-label="أقسام إدارة الأذونات">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`pm-tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls="pm-panel"
            className={`pm-tab${tab === t.id ? " pm-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "pending" && pendingCount > 0 && (
              <span className="pm-badge" aria-label={`${pendingCount} طلبات`}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* key بيخلّي كل تاب يجيب بياناته من الـ API من جديد كل ما تفتحه
          (فالطلب اللي اتوافق عليه يظهر في الأذونات النشطة فورًا) */}
      <div id="pm-panel" role="tabpanel" aria-labelledby={`pm-tab-${tab}`}>
        <ActiveTab key={tab} onPendingCountChange={setPendingCount} />
      </div>
    </main>
  );
}
