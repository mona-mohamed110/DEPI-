import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import '../../components/Style/Patient/prescriptions.css';

const translations = {
  ar: {
    mainTitle: "الروشتات والأدوية",
    currentTab: "الحالية",
    pastTab: "السابقة",
    thDrug: "الدواء",
    thDosage: "الجرعة",
    thDoctor: "الدكتور",
    thDate: "التاريخ",
    currentMeds: [
      { id: 1, name: 'ميتفورمين', dosage: '٥٠٠ مجم · مرتين يومياً', doctor: 'د. أحمد سمير', date: '٢٠ أكت ٢٠٢٦', status: 'مستمر' },
      { id: 2, name: 'أملوديبين', dosage: '٥ مجم · مرة صباحاً', doctor: 'د. أحمد سمير', date: '٢٠ أكت ٢٠٢٦', status: 'مستمر' },
      { id: 3, name: 'فيتامين د', dosage: '٥٠٠ وحدة · أسبوعياً', doctor: 'د. سارة علي', date: '١٠ أكت ٢٠٢٦', status: 'مستمر' },
    ],
    pastMeds: [
      { id: 1, name: 'أموكسيسيلين', dosage: '١ جم · ٣ مرات', doctor: 'د. هبة نبيل', date: '١٢ مارس ٢٠٢٦', status: 'منتهي' },
      { id: 2, name: 'باراسيتامول', dosage: '٥٠٠ مجم · عند اللزوم', doctor: 'د. هبة نبيل', date: '١٢ مارس ٢٠٢٦', status: 'منتهي' },
    ]
  },
  en: {
    mainTitle: "Prescriptions & Medications",
    currentTab: "Current",
    pastTab: "Past",
    thDrug: "Medication",
    thDosage: "Dosage",
    thDoctor: "Doctor",
    thDate: "Date",
    currentMeds: [
      { id: 1, name: 'Metformin', dosage: '500 mg · Twice daily', doctor: 'Dr. Ahmed Samir', date: 'Oct 20, 2026', status: 'Active' },
      { id: 2, name: 'Amlodipine', dosage: '5 mg · Once morning', doctor: 'Dr. Ahmed Samir', date: 'Oct 20, 2026', status: 'Active' },
      { id: 3, name: 'Vitamin D', dosage: '500 IU · Weekly', doctor: 'Dr. Sara Ali', date: 'Oct 10, 2026', status: 'Active' },
    ],
    pastMeds: [
      { id: 1, name: 'Amoxicillin', dosage: '1 g · 3 times', doctor: 'Dr. Heba Nabil', date: 'Mar 12, 2026', status: 'Ended' },
      { id: 2, name: 'Paracetamol', dosage: '500 mg · As needed', doctor: 'Dr. Heba Nabil', date: 'Mar 12, 2026', status: 'Ended' },
    ]
  }
};

const Prescriptions = () => {
  const [activeTab, setActiveTab] = useState('current');
  const app = useApp() || {};

  const currentLang = app.lang || app.language || 'ar';
  const isArabic = currentLang === 'ar' || currentLang === 'AR';
  const currentTheme = app.theme || (app.isDark || app.darkMode ? 'dark' : 'light');

  const t = translations[isArabic ? 'ar' : 'en'];
  const dataToDisplay = activeTab === 'current' ? t.currentMeds : t.pastMeds;

  return (
    <div className={`prescriptions-wrapper ${currentTheme}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="prescriptions-header">
        <div className="header-text">
          <h1 className="main-title">{t.mainTitle}</h1>
        </div>

        <div className="tab-buttons-group">
          <button 
            type="button"
            className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
            onClick={() => setActiveTab('current')}
          >
            {t.currentTab}
          </button>
          <button 
            type="button"
            className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            {t.pastTab}
          </button>
        </div>
      </div>

      <div className="prescriptions-card">
        <table className="prescriptions-table">
          <thead>
            <tr>
              <th>{t.thDrug}</th>
              <th>{t.thDosage}</th>
              <th>{t.thDoctor}</th>
              <th>{t.thDate}</th>
            </tr>
          </thead>
          <tbody>
            {dataToDisplay.map((item) => (
              <tr key={item.id}>
                <td className="drug-name">{item.name}</td>
                <td>{item.dosage}</td>
                <td>{item.doctor}</td>
                <td>{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Prescriptions;