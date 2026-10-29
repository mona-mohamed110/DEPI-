import  { useState } from 'react';
import './prescriptions.css';

const Prescriptions = () => {
  const [activeTab, setActiveTab] = useState('current');

  const currentMeds = [
    { id: 1, name: 'ميتفورمين', dosage: '٥٠٠ مجم · مرتين يومياً', doctor: 'د. أحمد سمير', date: '٢٠ أكت ٢٠٢٦', status: 'مستمر' },
    { id: 2, name: 'أملوديبين', dosage: '٥ مجم · مرة صباحاً', doctor: 'د. أحمد سمير', date: '٢٠ أكت ٢٠٢٦', status: 'مستمر' },
    { id: 3, name: 'فيتامين د', dosage: '٥٠٠ وحدة · أسبوعياً', doctor: 'د. سارة علي', date: '١٠ أكت ٢٠٢٦', status: 'مستمر' },
  ];

  const pastMeds = [
    { id: 1, name: 'أموكسيسيلين', dosage: '١ جم · ٣ مرات', doctor: 'د. هبة نبيل', date: '١٢ مارس ٢٠٢٦', status: 'منتهي' },
    { id: 2, name: 'باراسيتامول', dosage: '٥٠٠ مجم · عند اللزوم', doctor: 'د. هبة نبيل', date: '١٢ مارس ٢٠٢٦', status: 'منتهي' },
  ];

  const dataToDisplay = activeTab === 'current' ? currentMeds : pastMeds;

  return (
    <div className="prescriptions-wrapper" dir="rtl">
      <div className="prescriptions-header">
        <div className="header-text">
          <h1 className="main-title">الروشتات والأدوية</h1>
          {/* <p className="sub-title">الحالية والسابقة</p> */}
        </div>

        <div className="tab-buttons-group">
          <button 
            type="button"
            className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
            onClick={() => setActiveTab('current')}
          >
            الحالية
          </button>
          <button 
            type="button"
            className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            السابقة
          </button>
        </div>
      </div>

      <div className="prescriptions-card">
        <table className="prescriptions-table">
          <thead>
            <tr>
              <th>الدواء</th>
              <th>الجرعة</th>
              <th>الدكتور</th>
              <th>التاريخ</th>
              {/* <th>الحالة</th> */}
            </tr>
          </thead>
          <tbody>
            {dataToDisplay.map((item) => (
              <tr key={item.id}>
                <td className="drug-name">{item.name}</td>
                <td>{item.dosage}</td>
                <td>{item.doctor}</td>
                <td>{item.date}</td>
                {/* <td>
                  <span className={`status-tag ${item.status === 'مستمر' ? 'status-green' : 'status-blue'}`}>
                    {item.status}
                  </span>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Prescriptions;