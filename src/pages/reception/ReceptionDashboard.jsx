import { useState, useEffect } from 'react';
import './ReceptionDashboard.css';

export default function ReceptionDashboard() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('reception_theme') === 'dark';
  });

  const [lang, setLang] = useState(() => {
    return localStorage.getItem('reception_lang') || 'ar';
  });

  useEffect(() => {
    const checkSettings = () => {
      setIsDark(localStorage.getItem('reception_theme') === 'dark');
      setLang(localStorage.getItem('reception_lang') || 'ar');
    };
    window.addEventListener('storage', checkSettings);
    const interval = setInterval(checkSettings, 300);
    return () => {
      window.removeEventListener('storage', checkSettings);
      clearInterval(interval);
    };
  }, []);

  const [queueData, setQueueData] = useState(() => {
    const savedData = localStorage.getItem('reception_queue_data');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 1, name: 'أحمد حسن', phone: '01012345678', doctor: 'د. أحمد سمير · باطنة', time: '٩:٠٠ ص', status: 'ended', label: 'انتهى', initial: 'أ' },
      { id: 2, name: 'فاطمة علي', phone: '01123456789', doctor: 'د. أحمد سمير · باطنة', time: '٩:٣٠ ص', status: 'in-exam', label: 'في الكشف', initial: 'ف' },
      { id: 3, name: 'محمود سعيد', phone: '01234567890', doctor: 'د. سارة علي · قلب', time: '١٠:٠٠ ص', status: 'arrived', label: 'وصل', initial: 'م' },
      { id: 4, name: 'نورا إبراهيم', phone: '01098765432', doctor: 'د. سارة علي · قلب', time: '١٠:٣٠ ص', status: 'not-arrived', label: 'لم يصل', initial: 'ن' },
      { id: 5, name: 'ياسر مصطفى', phone: '01556701334', doctor: 'د. مها خالد · أطفال', time: '١١:٠٠ ص', status: 'not-arrived', label: 'لم يصل', initial: 'ي' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('reception_queue_data', JSON.stringify(queueData));
  }, [queueData]);

  const handleStatusChange = (id, newStatus, newLabelAr, newLabelEn) => {
    const newLabel = lang === 'ar' ? newLabelAr : newLabelEn;
    setQueueData(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, status: newStatus, label: newLabel };

          if (newStatus === 'ended') {
            const endedPatients = JSON.parse(localStorage.getItem('reception_ended_patients') || '[]');
            const alreadyExists = endedPatients.some(p => p.name === updatedItem.name);

            if (!alreadyExists) {
              const newPatientRecord = {
                id: Date.now(),
                name: updatedItem.name,
                doctor: updatedItem.doctor,
                time: updatedItem.time,
                phone: updatedItem.phone || 'غير متوفر', 
              };
              localStorage.setItem('reception_ended_patients', JSON.stringify([newPatientRecord, ...endedPatients]));
            }
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  const filteredPatients = queueData.filter(item => {
    const matchesSearch = item.name.includes(searchTerm) || item.doctor.includes(searchTerm);
    const matchesFilter = activeFilter === 'all' || item.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const totalToday = queueData.length;
  const arrivedCount = queueData.filter(i => i.status === 'arrived').length;
  const inExamCount = queueData.filter(i => i.status === 'in-exam').length;
  const endedCount = queueData.filter(i => i.status === 'ended').length;

  const translations = {
    ar: {
      title: 'طابور اليوم',
      subtitle: 'حالة كل مريض لحظة بلحظة',
      searchPlaceholder: 'ابحث باسم المريض أو الدكتور...',
      totalToday: 'إجمالي اليوم',
      arrived: 'وصل',
      inExam: 'في الكشف',
      ended: 'انتهى',
      thName: 'الاسم',
      thTime: 'الوقت',
      thStatus: 'الحالة',
      thActions: 'الإجراءات',
      noData: 'لا يوجد مرضى يطابقون البحث أو الفلتر المختار.',
      filters: [
        { label: 'الكل', key: 'all' },
        { label: 'لم يصل', key: 'not-arrived' },
        { label: 'وصل', key: 'arrived' },
        { label: 'في الكشف', key: 'in-exam' },
        { label: 'انتهى', key: 'ended' },
      ]
    },
    en: {
      title: "Today's Queue",
      subtitle: 'Real-time status of every patient',
      searchPlaceholder: 'Search by patient name or doctor...',
      totalToday: 'Total Today',
      arrived: 'Arrived',
      inExam: 'In Exam',
      ended: 'Ended',
      thName: 'Name',
      thTime: 'Time',
      thStatus: 'Status',
      thActions: 'Actions',
      noData: 'No patients match the selected search or filter.',
      filters: [
        { label: 'All', key: 'all' },
        { label: 'Not Arrived', key: 'not-arrived' },
        { label: 'Arrived', key: 'arrived' },
        { label: 'In Exam', key: 'in-exam' },
        { label: 'Ended', key: 'ended' },
      ]
    }
  };

  const t = translations[lang] || translations.ar;

  return (
    <div className={`reception-container ${isDark ? 'dark-mode' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="page-header">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      <div className="stats-cards-grid">
        <div className="stat-card">
          <span className="stat-title">{t.totalToday}</span>
          <span className="stat-value text-blue">{totalToday}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">{t.arrived}</span>
          <span className="stat-value text-blue">{arrivedCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">{t.inExam}</span>
          <span className="stat-value text-blue">{inExamCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">{t.ended}</span>
          <span className="stat-value text-blue">{endedCount}</span>
        </div>
      </div>

      <div className="queue-card">
        <div className="search-box-container">
          <input
            type="text"
            className="search-input"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-row">
          {t.filters.map(filter => (
            <button
              key={filter.key}
              className={`filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="table-responsive">
          <table className="reception-table">
            <thead>
              <tr>
                <th>{t.thName}</th>
                <th>{t.thTime}</th>
                <th>{t.thStatus}</th>
                <th>{t.thActions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="patient-cell">
                        <div className="avatar-circle">{item.initial}</div>
                        <div>
                          <div className="patient-name">{item.name}</div>
                          <div className="patient-doc">{item.doctor}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="time-text">{item.time}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${item.status}`}>{item.label}</span>
                    </td>
                    <td>
                      <div className="action-buttons-group">
                        <button
                          className={`action-btn btn-arrived ${item.status === 'arrived' ? 'active-action' : ''}`}
                          onClick={() => handleStatusChange(item.id, 'arrived', 'وصل', 'Arrived')}
                        >
                          {lang === 'ar' ? 'وصل' : 'Arrived'}
                        </button>
                        <button
                          className={`action-btn btn-inexam ${item.status === 'in-exam' ? 'active-action' : ''}`}
                          onClick={() => handleStatusChange(item.id, 'in-exam', 'في الكشف', 'In Exam')}
                        >
                          {lang === 'ar' ? 'في الكشف' : 'In Exam'}
                        </button>
                        <button
                          className={`action-btn btn-ended ${item.status === 'ended' ? 'active-action' : ''}`}
                          onClick={() => handleStatusChange(item.id, 'ended', 'انتهى', 'Ended')}
                        >
                          {lang === 'ar' ? 'انتهى' : 'Ended'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data-msg">{t.noData}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}