import { useState, useEffect } from 'react';
import './AppointmentsManager.css';

export default function AppointmentsManager() {
  const [selectedDay, setSelectedDay] = useState('اليوم');
  const [selectedTime, setSelectedTime] = useState('٩:٠٠ ص');
  
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('reception_theme') === 'dark';
  });

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(localStorage.getItem('reception_theme') === 'dark');
    };
    window.addEventListener('storage', checkTheme);
    const interval = setInterval(checkTheme, 300);
    return () => {
      window.removeEventListener('storage', checkTheme);
      clearInterval(interval);
    };
  }, []);

  const [patients, setPatients] = useState(() => {
    const savedPatients = localStorage.getItem('reception_patients_list');
    if (savedPatients) {
      try { return JSON.parse(savedPatients); } catch (e) { console.error(e); }
    }
    return [
      { id: 1, name: 'أحمد حسن', phone: '01012345678' },
      { id: 2, name: 'فاطمة علي', phone: '01123456789' },
      { id: 3, name: 'محمود سعيد', phone: '01234567890' },
    ];
  });

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('د. أحمد سمير · باطنة');

  useEffect(() => {
    localStorage.setItem('reception_patients_list', JSON.stringify(patients));
    if (patients.length > 0 && !selectedPatientName) {
      setSelectedPatientName(patients[0].name);
    }
  }, [patients]);

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  const handleAddPatient = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('يرجى كتابة اسم المريض على الأقل', 'error');
      return;
    }

    const newPatientObj = {
      id: Date.now(),
      name: newName.trim(),
      phone: newPhone.trim() || 'غير متوفر',
    };

    setPatients(prev => [...prev, newPatientObj]);
    setSelectedPatientName(newPatientObj.name);
    setNewName('');
    setNewPhone('');
    
    showToast(`تم إضافة المريض (${newPatientObj.name}) بنجاح! `);
  };

  const handleConfirmBooking = () => {
    if (isSubmitting) return; 

    if (!selectedPatientName) {
      showToast('الرجاء اختيار مريض أولاً', 'error');
      return;
    }

    setIsSubmitting(true);

    const currentPatientObj = patients.find(p => p.name === selectedPatientName);
    const patientPhone = currentPatientObj ? currentPatientObj.phone : 'غير متوفر';

    const existingQueue = JSON.parse(localStorage.getItem('reception_queue_data') || '[]');
    
    const newQueueItem = {
      id: Date.now(),
      name: selectedPatientName,
      phone: patientPhone,
      doctor: selectedDoctor,
      time: `${selectedDay} · ${selectedTime}`,
      status: 'not-arrived',
      label: 'لم يصل',
      initial: selectedPatientName.charAt(0)
    };

    localStorage.setItem('reception_queue_data', JSON.stringify([newQueueItem, ...existingQueue]));
    showToast(`تم تأكيد حجز الميعاد وإضافته لطابور الاستقبال بنجاح! `);

    setTimeout(() => {
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <div className={`reception-container appointments-page-wrapper ${isDark ? 'dark-mode' : ''}`} dir="rtl">
      {notification.show && (
        <div className={`notification-toast ${notification.type}`}>
          <span>{notification.message}</span>
        </div>
      )}

      <header className="page-header">
        <h1>حجز وتعديل المواعيد</h1>
        <p>احجزي أو عدّلي أو ألغي ميعاد لمريض</p>
      </header>

      <div className="appointments-grid">
        <div className="add-patient-card">
          <h2>إضافة مريض جديد</h2>
          <form onSubmit={handleAddPatient}>
            <div className="form-group">
              <label>الاسم</label>
              <input
                type="text"
                className="form-input"
                placeholder="اكتب اسم المريض..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>رقم الهاتف</label>
              <input
                type="text"
                className="form-input"
                placeholder="01xxxxxxxxx"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>
            <button type="submit" className="submit-btn">إضافة مريض</button>
          </form>
        </div>

        <div className="booking-form-card">
          <h2>حجز ميعاد جديد</h2>
          
          <div className="form-group">
            <label>المريض</label>
            <select 
              className="form-select"
              value={selectedPatientName}
              onChange={(e) => setSelectedPatientName(e.target.value)}
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.name}>
                  {patient.name} ({patient.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>الدكتور</label>
            <select 
              className="form-select"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              <option>د. أحمد سمير · باطنة</option>
              <option>د. سارة علي · قلب</option>
              <option>د. مها خالد · أطفال</option>
            </select>
          </div>

          <div className="form-group">
            <label>اليوم</label>
            <div className="days-selector">
              {['اليوم', 'بكرة', 'الأحد', 'الإثنين'].map((day) => (
                <button
                  type="button"
                  key={day}
                  className={`day-btn ${selectedDay === day ? 'active' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>الوقت</label>
            <div className="times-grid">
              {['٩:٠٠ ص', '٩:٣٠ ص', '١٠:٠٠ ص', '١١:٠٠ ص', '١٢:٠٠ م', '٤:٠٠ م', '٥:٠٠ م'].map((time) => (
                <button
                  type="button"
                  key={time}
                  className={`time-btn ${selectedTime === time ? 'active' : ''}`}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="button" 
            className={`confirm-booking-btn ${isSubmitting ? 'disabled-btn' : ''}`}
            onClick={handleConfirmBooking}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'جاري تأكيد الحجز...' : 'تأكيد الحجز '}
          </button>
        </div>
      </div>
    </div>
  );
}