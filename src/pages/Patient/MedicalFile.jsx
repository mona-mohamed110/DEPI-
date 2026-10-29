import  { useState } from 'react';
import { LuUpload } from 'react-icons/lu';
import './MedicalFile.css';

const MedicalFile = () => {
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file.name);
    }
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
              {uploadedFile ? `تم اختيار الملف: ${uploadedFile}` : 'اضغط هنا لرفع ملف أو اسحب الصورة / ملف الـ PDF هنا'}
            </span>
          </div>
        </label>
      </div>
    </div>
  );
};

export default MedicalFile;