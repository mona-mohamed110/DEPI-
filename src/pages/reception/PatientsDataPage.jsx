import { useState, useEffect } from 'react';
import { Search, Phone, Trash2 } from 'lucide-react';
import './PatientsDataPage.css';

export default function PatientsDataPage() {
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

  const [patients, setPatients] = useState(() => {
    const savedPatients = localStorage.getItem('reception_ended_patients');
    if (savedPatients) {
      try {
        return JSON.parse(savedPatients);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 1, name: 'أحمد حسن', phone: '01012345678', doctor: 'د. أحمد سمير · باطنة', time: 'اليوم · ٩:٠٠ ص' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('reception_ended_patients', JSON.stringify(patients));
  }, [patients]);

  const handleDeletePatient = (patientToDelete) => {
    const confirmMsg = lang === 'ar' 
      ? `هل أنت متأكد من حذف بيانات المريض (${patientToDelete.name}) من السجل والنظام؟`
      : `Are you sure you want to delete patient (${patientToDelete.name}) from records?`;
      
    if (window.confirm(confirmMsg)) {
      setPatients(prev => prev.filter(p => p.id !== patientToDelete.id));

      const savedQueue = localStorage.getItem('reception_queue_data');
      if (savedQueue) {
        try {
          const queueData = JSON.parse(savedQueue);
          const updatedQueue = queueData.filter(item => item.name !== patientToDelete.name);
          localStorage.setItem('reception_queue_data', JSON.stringify(updatedQueue));
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const filteredPatients = patients.filter(patient => 
    (patient.name && patient.name.includes(searchTerm)) || 
    (patient.phone && patient.phone.includes(searchTerm)) ||
    (patient.doctor && patient.doctor.includes(searchTerm))
  );

  const translations = {
    ar: {
      title: 'سجل المرضى (منتهى الكشف)',
      subtitle: 'قائمة بجميع المرضى الذين أتموا الكشف الطبي بنجاح وتم تحويلهم للسجل',
      searchPlaceholder: 'ابحث باسم المريض، رقم الهاتف، أو الدكتور...',
      thPatientDoc: 'المريض والدكتور',
      thPhone: 'رقم الهاتف',
      thTime: 'وقت الكشف',
      thActions: 'الإجراءات',
      deleteText: 'حذف',
      noData: 'لا توجد سجلات لمرضى انتهى كشفهم بعد.'
    },
    en: {
      title: 'Patients Record (Completed Exams)',
      subtitle: 'List of all patients who successfully completed their medical exam',
      searchPlaceholder: 'Search by patient name, phone, or doctor...',
      thPatientDoc: 'Patient & Doctor',
      thPhone: 'Phone Number',
      thTime: 'Exam Time',
      thActions: 'Actions',
      deleteText: 'Delete',
      noData: 'No completed patient records found yet.'
    }
  };

  const t = translations[lang] || translations.ar;

  return (
    <div className={`reception-container ${isDark ? 'dark-mode' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="page-header">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      <div className="queue-card">
        <div className="search-box-container">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input-with-icon"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="reception-table">
            <thead>
              <tr>
                <th>{t.thPatientDoc}</th>
                <th>{t.thPhone}</th>
                <th>{t.thTime}</th>
                <th>{t.thActions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className="patient-cell">
                        <div className="avatar-circle">
                          {patient.name ? patient.name.charAt(0) : 'م'}
                        </div>
                        <div>
                          <div className="patient-name">{patient.name}</div>
                          <div className="patient-doc">{patient.doctor || (lang === 'ar' ? 'طبيب عام' : 'General Practitioner')}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="phone-text">
                        <Phone size={14} className="inline-icon" /> {patient.phone || '010XXXXXXXX'}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge ended">
                        {patient.time || (lang === 'ar' ? 'اليوم' : 'Today')}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-group">
                        <button 
                          className="action-btn delete-btn-custom"
                          onClick={() => handleDeletePatient(patient)}
                          title={t.deleteText}
                        >
                          <Trash2 size={14} /> {t.deleteText}
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