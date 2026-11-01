import { useState, useEffect } from 'react';
import { LuUpload, LuTrash2, LuFileText, LuEye, LuX } from 'react-icons/lu';
import { useApp } from '../../context/AppContext.jsx';
import '../../components/Style/Patient/MedicalFile.css';

const translations = {
  ar: {
    mainTitle: "ملفي الطبي",
    subTitle: "بياناتك الصحية في مكان واحد",
    personalSection: "Personal & Chronic Data",
    nameLabel: "Name:",
    nameVal: "Mona Mohamed",
    ageLabel: "Age:",
    ageVal: "25 Years",
    bloodLabel: "Blood Type:",
    bloodVal: "O+",
    heightWeightLabel: "Height / Weight:",
    heightWeightVal: "165 cm / 60 kg",
    chronicLabel: "Chronic Diseases:",
    chronicChips: ["Type 2 Diabetes", "Blood Pressure"],
    historySection: "التاريخ المرضي",
    thCondition: "الحالة المرضية",
    thDate: "التاريخ",
    thNotes: "ملاحظات",
    medicalHistory: [
      { id: 1, condition: 'استئصال الزائدة', date: '٢٠١٩', notes: 'عملية جراحية ناجحة' },
      { id: 2, condition: 'التهاب الجيوب الأنفية', date: '٢٠٢٣', notes: 'حالة موسمية' },
    ],
    uploadSection: "إرفاق تقارير أو أشعة جديدة",
    uploadText: "اضغط هنا لرفع ملف أو اسحب الصورة / ملف الـ PDF هنا",
    reportsSection: "التقارير والأشعة المرفوعة",
    emptyReports: "لا توجد أي تقارير مرفوعة حالياً.",
    thFileName: "اسم الملف",
    thUploadDate: "تاريخ الرفع",
    thSize: "الحجم",
    thActions: "الإجراءات",
    viewBtn: "عرض",
    deleteBtn: "حذف",
    defaultReports: [
      { id: 1, name: 'تقرير تحليل الدم الشامل.pdf', date: '٢٠٢٦/١٠/١٥', size: '2.4 MB', type: 'pdf', url: '' },
      { id: 2, name: 'أشعة الصدر.jpg', date: '٢٠٢٦/١٠/٢٠', size: '1.1 MB', type: 'image', url: '' },
    ],
    demoAlert: 'هذا ملف تجريبي افتراضي، جرب رفع ملف حقيقي لفتحه ومعاينته.'
  },
  en: {
    mainTitle: "My Medical File",
    subTitle: "Your health records in one place",
    personalSection: "Personal & Chronic Data",
    nameLabel: "Name:",
    nameVal: "Mona Mohamed",
    ageLabel: "Age:",
    ageVal: "25 Years",
    bloodLabel: "Blood Type:",
    bloodVal: "O+",
    heightWeightLabel: "Height / Weight:",
    heightWeightVal: "165 cm / 60 kg",
    chronicLabel: "Chronic Diseases:",
    chronicChips: ["Type 2 Diabetes", "Blood Pressure"],
    historySection: "Medical History",
    thCondition: "Condition",
    thDate: "Date",
    thNotes: "Notes",
    medicalHistory: [
      { id: 1, condition: 'Appendectomy', date: '2019', notes: 'Successful surgery' },
      { id: 2, condition: 'Sinusitis', date: '2023', notes: 'Seasonal condition' },
    ],
    uploadSection: "Attach New Reports or Scans",
    uploadText: "Click here to upload file or drag image / PDF here",
    reportsSection: "Uploaded Reports & Scans",
    emptyReports: "No reports uploaded yet.",
    thFileName: "File Name",
    thUploadDate: "Upload Date",
    thSize: "Size",
    thActions: "Actions",
    viewBtn: "View",
    deleteBtn: "Delete",
    defaultReports: [
      { id: 1, name: 'Blood_Test_Report.pdf', date: '2025/10/15', size: '2.4 MB', type: 'pdf', url: '' },
      { id: 2, name: 'Chest_XRay.jpg', date: '2025/10/20', size: '1.1 MB', type: 'image', url: '' },
    ],
    demoAlert: 'This is a default demo file, try uploading a real file to view it.'
  }
};

const MedicalFile = () => {
  const app = useApp() || {};
  const currentLang = app.lang || app.language || 'ar';
  const isArabic = currentLang === 'ar' || currentLang === 'AR';
  const currentTheme = app.theme || (app.isDark || app.darkMode ? 'dark' : 'light');

  const t = translations[isArabic ? 'ar' : 'en'];

  const [reports, setReports] = useState(() => {
    const savedReports = localStorage.getItem('medical_reports');
    if (savedReports) {
      try {
        return JSON.parse(savedReports);
      } catch (e) {
        console.error(e);
      }
    }
    return t.defaultReports;
  });

  const [activeModalReport, setActiveModalReport] = useState(null);

  useEffect(() => {
    localStorage.setItem('medical_reports', JSON.stringify(reports));
  }, [reports]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        const newReport = {
          id: Date.now(),
          name: file.name,
          date: new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US'),
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          type: isPdf ? 'pdf' : 'image',
          url: reader.result, 
        };
        setReports((prev) => [newReport, ...prev]);
      };
      reader.readAsDataURL(file);
      e.target.value = null;
    }
  };

  const handleDeleteReport = (id) => {
    setReports((prev) => prev.filter((report) => report.id !== id));
    if (activeModalReport && activeModalReport.id === id) {
      setActiveModalReport(null);
    }
  };

  const handleViewReport = (report) => {
    if (report.url && report.url.trim() !== '') {
      setActiveModalReport(report);
    } else {
      alert(t.demoAlert);
    }
  };

  const closeModal = () => {
    setActiveModalReport(null);
  };

  return (
    <div className={`medical-file-wrapper ${currentTheme}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="page-header">
        <h1 className="main-title">{t.mainTitle}</h1>
        <p className="sub-title">{t.subTitle}</p>
      </div>

      <div className="medical-card info-summary-card">
        <h3 className="card-section-title">{t.personalSection}</h3>
        
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label" dir="ltr">{t.nameLabel}</span>
            <span className="info-value" dir="ltr">{t.nameVal}</span>
          </div>
          <div className="info-item">
            <span className="info-label" dir="ltr">{t.ageLabel}</span>
            <span className="info-value" dir="ltr">{t.ageVal}</span>
          </div>
          <div className="info-item">
            <span className="info-label" dir="ltr">{t.bloodLabel}</span>
            <span className="info-value" dir="ltr">{t.bloodVal}</span>
          </div>
          <div className="info-item">
            <span className="info-label" dir="ltr">{t.heightWeightLabel}</span>
            <span className="info-value" dir="ltr">{t.heightWeightVal}</span>
          </div>
        </div>

        <div className="chronic-diseases-row">
          <span className="info-label" dir="ltr">{t.chronicLabel}</span>
          <div className="chips-group">
            {t.chronicChips.map((chip, idx) => (
              <span key={idx} className="chronic-chip">{chip}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="medical-card table-card">
        <h3 className="card-section-title">{t.historySection}</h3>
        <table className="medical-table">
          <thead>
            <tr>
              <th>{t.thCondition}</th>
              <th>{t.thDate}</th>
              <th>{t.thNotes}</th>
            </tr>
          </thead>
          <tbody>
            {t.medicalHistory.map((item) => (
              <tr key={item.id}>
                <td className="condition-name">{item.condition}</td>
                <td>{item.date}</td>
                <td>{item.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="medical-card upload-card">
        <h3 className="card-section-title">{t.uploadSection}</h3>
        <label className="upload-dropzone">
          <input 
            type="file" 
            accept="image/*,.pdf" 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          <div className="upload-content">
            <LuUpload className="upload-icon" />
            <span className="upload-text">{t.uploadText}</span>
          </div>
        </label>
      </div>

      <div className="medical-card table-card">
        <h3 className="card-section-title">{t.reportsSection}</h3>
        {reports.length === 0 ? (
          <p className="empty-reports-text">{t.emptyReports}</p>
        ) : (
          <table className="medical-table">
            <thead>
              <tr>
                <th>{t.thFileName}</th>
                <th>{t.thUploadDate}</th>
                <th>{t.thSize}</th>
                <th className="action-col">{t.thActions}</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="condition-name file-name-cell">
                    <LuFileText className="file-row-icon" />
                    {report.name}
                  </td>
                  <td>{report.date}</td>
                  <td>{report.size}</td>
                  <td className="action-col">
                    <div className="actions-buttons-group">
                      <button 
                        className="view-report-btn" 
                        onClick={() => handleViewReport(report)}
                        title={t.viewBtn}
                      >
                        <LuEye />
                        <span>{t.viewBtn}</span>
                      </button>
                      <button 
                        className="delete-report-btn" 
                        onClick={() => handleDeleteReport(report.id)}
                        title={t.deleteBtn}
                      >
                        <LuTrash2 />
                        <span>{t.deleteBtn}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {activeModalReport && (
        <div className="file-modal-overlay" onClick={closeModal}>
          <div className="file-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header">
              <h3>{activeModalReport.name}</h3>
              <button className="close-modal-btn" onClick={closeModal}>
                <LuX />
              </button>
            </div>
            <div className="file-modal-body">
              {activeModalReport.type === 'pdf' ? (
                <iframe 
                  src={activeModalReport.url} 
                  title={activeModalReport.name} 
                  className="modal-pdf-viewer"
                />
              ) : (
                <img 
                  src={activeModalReport.url} 
                  alt={activeModalReport.name} 
                  className="modal-img-viewer"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalFile;