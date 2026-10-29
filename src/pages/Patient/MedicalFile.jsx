import { useState, useEffect } from 'react';
import { LuUpload, LuTrash2, LuFileText, LuEye, LuX } from 'react-icons/lu';
import '../../components/Style/Patient/MedicalFile.css';

const MedicalFile = () => {
  // استرجاع التقارير المحفوظة من localStorage أو استخدام القيم الافتراضية
  const [reports, setReports] = useState(() => {
    const savedReports = localStorage.getItem('medical_reports');
    if (savedReports) {
      try {
        return JSON.parse(savedReports);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 1, name: 'تقرير تحليل الدم الشامل.pdf', date: '٢٠٢٦/١٠/١٥', size: '2.4 MB', type: 'pdf', url: '' },
      { id: 2, name: 'أشعة الصدر.jpg', date: '٢٠٢٦/١٠/٢٠', size: '1.1 MB', type: 'image', url: '' },
    ];
  });

  // حالة الـ Modal لعرض الملف فوق الشاشة
  const [activeModalReport, setActiveModalReport] = useState(null);

  // حفظ التقارير في localStorage كلما حدث تغيير
  useEffect(() => {
    // نتأكد ألا نخزن روابط مؤقتة قديمة قد تنتهي صلاحيتها، نخزن البيانات الأساسية
    const reportsToSave = reports.map(r => ({
      id: r.id,
      name: r.name,
      date: r.date,
      size: r.size,
      type: r.type,
      url: r.url && !r.url.startsWith('blob:') ? r.url : '' // حفظ الرابط لو كان حقيقي، أو فارغ للملفات المرفوعة حديثاً بجلسة جديدة
    }));
    localStorage.setItem('medical_reports', JSON.stringify(reportsToSave));
  }, [reports]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      
      const newReport = {
        id: Date.now(),
        name: file.name,
        date: new Date().toLocaleDateString('ar-EG'),
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        type: isPdf ? 'pdf' : 'image',
        url: fileUrl,
      };
      setReports((prev) => [newReport, ...prev]);
      e.target.value = null;
    }
  };

  const handleDeleteReport = (id) => {
    setReports((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target && target.url && target.url.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((report) => report.id !== id);
    });
    // لو الملف المحذوف مفتوح حالياً في الـ Modal، نقفل الـ Modal
    if (activeModalReport && activeModalReport.id === id) {
      setActiveModalReport(null);
    }
  };

  const handleViewReport = (report) => {
    if (report.url) {
      setActiveModalReport(report);
    } else {
      alert('هذا ملف تجريبي افتراضي، جرب رفع ملف حقيقي لفتحه ومعاينته.');
    }
  };

  const closeModal = () => {
    setActiveModalReport(null);
  };

  const medicalHistory = [
    { id: 1, condition: 'استئصال الزائدة', date: '٢٠١٩', notes: 'عملية جراحية ناجحة' },
    { id: 2, condition: 'التهاب الجيوب الأنفية', date: '٢٠٢٣', notes: 'حالة موسمية' },
  ];

  return (
    <div className="medical-file-wrapper" dir="rtl">
      <div className="page-header">
        <h1 className="main-title">ملفي الطبي</h1>
        <p className="sub-title">بياناتك الصحية في مكان واحد</p>
      </div>

      <div className="medical-card info-summary-card">
        <h3 className="card-section-title">البيانات الشخصية والمزمنة</h3>
        
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">الاسم:</span>
            <span className="info-value">منى محمد</span>
          </div>
          <div className="info-item">
            <span className="info-label">العمر:</span>
            <span className="info-value">٢٥ سنة</span>
          </div>
          <div className="info-item">
            <span className="info-label">فصيلة الدم:</span>
            <span className="info-value">+O</span>
          </div>
          <div className="info-item">
            <span className="info-label">الطول / الوزن:</span>
            <span className="info-value">١٦٥ سم / ٦٠ كجم</span>
          </div>
        </div>

        <div className="chronic-diseases-row">
          <span className="info-label">الأمراض المزمنة:</span>
          <div className="chips-group">
            <span className="chronic-chip">ضغط الدم</span>
            <span className="chronic-chip">السكر النوع ٢</span>
          </div>
        </div>
      </div>

      <div className="medical-card table-card">
        <h3 className="card-section-title">التاريخ المرضي</h3>
        <table className="medical-table">
          <thead>
            <tr>
              <th>الحالة المرضية</th>
              <th>التاريخ</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {medicalHistory.map((item) => (
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
        <h3 className="card-section-title">إرفاق تقارير أو أشعة جديدة</h3>
        <label className="upload-dropzone">
          <input 
            type="file" 
            accept="image/*,.pdf" 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          <div className="upload-content">
            <LuUpload className="upload-icon" />
            <span className="upload-text">
              اضغط هنا لرفع ملف أو اسحب الصورة / ملف الـ PDF هنا
            </span>
          </div>
        </label>
      </div>

      <div className="medical-card table-card">
        <h3 className="card-section-title">التقارير والأشعة المرفوعة</h3>
        {reports.length === 0 ? (
          <p className="empty-reports-text">لا توجد أي تقارير مرفوعة حالياً.</p>
        ) : (
          <table className="medical-table">
            <thead>
              <tr>
                <th>اسم الملف</th>
                <th>تاريخ الرفع</th>
                <th>الحجم</th>
                <th className="action-col">الإجراءات</th>
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
                        title="عرض الملف"
                      >
                        <LuEye />
                        <span>عرض</span>
                      </button>
                      <button 
                        className="delete-report-btn" 
                        onClick={() => handleDeleteReport(report.id)}
                        title="حذف الملف"
                      >
                        <LuTrash2 />
                        <span>حذف</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* نافذة العرض المنبثقة (Modal) فوق الشاشة */}
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