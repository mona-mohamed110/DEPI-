import { useState, useEffect, useRef } from 'react';
import './AppointmentsManager.css';


const TRANSLATIONS = {
  ar: {
    pageTitle: 'حجز وتعديل المواعيد',
    pageSubtitle: 'احجزي أو عدّلي أو ألغي ميعاد لمريض',
    addPatientTitle: 'إضافة مريض جديد',
    nameLabel: 'الاسم',
    namePlaceholder: 'اكتب اسم المريض...',
    phoneLabel: 'رقم الهاتف',
    phonePlaceholder: '01xxxxxxxxx',
    addPatientBtn: 'إضافة مريض',
    bookingTitle: 'حجز ميعاد جديد',
    patientLabel: 'المريض',
    dayLabel: 'اليوم',
    timeLabel: 'الوقت',
    confirmBtn: 'تأكيد الحجز',
    confirming: 'جاري تأكيد الحجز...',
    notAvailable: 'غير متوفر',
    notArrived: 'لم يصل',
    errNameRequired: 'يرجى كتابة اسم المريض على الأقل',
    errSelectPatient: 'الرجاء اختيار مريض أولاً',
    patientAdded: (name) => `تم إضافة المريض (${name}) بنجاح!`,
    bookingConfirmed: 'تم تأكيد حجز الميعاد وإضافته لطابور الاستقبال بنجاح!',
    days: [
      { id: 'today', label: 'اليوم' },
      { id: 'tomorrow', label: 'بكرة' },
      { id: 'sunday', label: 'الأحد' },
      { id: 'monday', label: 'الإثنين' },
    ],
    times: [
      { id: '09:00', label: '٩:٠٠ ص' },
      { id: '09:30', label: '٩:٣٠ ص' },
      { id: '10:00', label: '١٠:٠٠ ص' },
      { id: '11:00', label: '١١:٠٠ ص' },
      { id: '12:00', label: '١٢:٠٠ م' },
      { id: '16:00', label: '٤:٠0 م' },
      { id: '17:00', label: '٥:٠٠ م' },
    ],
    seedPatients: [
      { id: 1, name: 'أحمد حسن', phone: '01012345678' },
      { id: 2, name: 'فاطمة علي', phone: '01123456789' },
      { id: 3, name: 'محمود سعيد', phone: '01234567890' },
    ],
  },
  en: {
    pageTitle: 'Book & Manage Appointments',
    pageSubtitle: 'Book, edit, or cancel a patient appointment',
    addPatientTitle: 'Add New Patient',
    nameLabel: 'Name',
    namePlaceholder: 'Enter patient name...',
    phoneLabel: 'Phone Number',
    phonePlaceholder: '01xxxxxxxxx',
    addPatientBtn: 'Add Patient',
    bookingTitle: 'Book New Appointment',
    patientLabel: 'Patient',
    dayLabel: 'Day',
    timeLabel: 'Time',
    confirmBtn: 'Confirm Booking',
    confirming: 'Confirming booking...',
    notAvailable: 'N/A',
    notArrived: 'Not arrived',
    errNameRequired: 'Please enter the patient name at least',
    errSelectPatient: 'Please select a patient first',
    patientAdded: (name) => `Patient (${name}) added successfully!`,
    bookingConfirmed: 'Appointment confirmed and added to the reception queue!',
    days: [
      { id: 'today', label: 'Today' },
      { id: 'tomorrow', label: 'Tomorrow' },
      { id: 'sunday', label: 'Sunday' },
      { id: 'monday', label: 'Monday' },
    ],
    times: [
      { id: '09:00', label: '9:00 AM' },
      { id: '09:30', label: '9:30 AM' },
      { id: '10:00', label: '10:00 AM' },
      { id: '11:00', label: '11:00 AM' },
      { id: '12:00', label: '12:00 PM' },
      { id: '16:00', label: '4:00 PM' },
      { id: '17:00', label: '5:00 PM' },
    ],
    seedPatients: [
      { id: 1, name: 'Ahmed Hassan', phone: '01012345678' },
      { id: 2, name: 'Fatma Ali', phone: '01123456789' },
      { id: 3, name: 'Mahmoud Said', phone: '01234567890' },
    ],
  },
};

const readLang = () => (localStorage.getItem('reception_lang') === 'en' ? 'en' : 'ar');
const readDark = () => localStorage.getItem('reception_theme') === 'dark';


export default function AppointmentsManager() {
  const [lang, setLang] = useState(readLang);
  const [isDark, setIsDark] = useState(readDark);

  const t = TRANSLATIONS[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const [selectedDayId, setSelectedDayId] = useState('today');
  const [selectedTimeId, setSelectedTimeId] = useState('09:00');

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    const sync = () => {
      setIsDark(readDark());
      setLang(readLang());
    };
    window.addEventListener('storage', sync);
    const interval = setInterval(sync, 300);
    return () => {
      window.removeEventListener('storage', sync);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem('reception_patients_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return TRANSLATIONS[readLang()].seedPatients;
  });

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState('');

  useEffect(() => {
    localStorage.setItem('reception_patients_list', JSON.stringify(patients));
    if (patients.length > 0 && !selectedPatientName) {
      setSelectedPatientName(patients[0].name);
    }
  }, [patients, selectedPatientName]);

  const showToast = (message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setNotification({ show: true, message, type });
    toastTimer.current = setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  const handleAddPatient = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast(t.errNameRequired, 'error');
      return;
    }

    const newPatientObj = {
      id: Date.now(),
      name: newName.trim(),
      phone: newPhone.trim() || t.notAvailable,
    };

    setPatients((prev) => [...prev, newPatientObj]);
    setSelectedPatientName(newPatientObj.name);
    setNewName('');
    setNewPhone('');

    showToast(t.patientAdded(newPatientObj.name));
  };

  const handleConfirmBooking = () => {
    if (isSubmitting) return;

    if (!selectedPatientName) {
      showToast(t.errSelectPatient, 'error');
      return;
    }

    setIsSubmitting(true);

    const currentPatientObj = patients.find((p) => p.name === selectedPatientName);
    const patientPhone = currentPatientObj ? currentPatientObj.phone : t.notAvailable;

    const dayLabel = t.days.find((d) => d.id === selectedDayId)?.label ?? '';
    const timeLabel = t.times.find((x) => x.id === selectedTimeId)?.label ?? '';

    let existingQueue = [];
    try {
      existingQueue = JSON.parse(localStorage.getItem('reception_queue_data') || '[]');
    } catch (e) {
      console.error(e);
    }

    const newQueueItem = {
      id: Date.now(),
      name: selectedPatientName,
      phone: patientPhone,
      time: `${dayLabel} · ${timeLabel}`,
      status: 'not-arrived',
      label: t.notArrived,
      initial: selectedPatientName.charAt(0),
    };

    localStorage.setItem('reception_queue_data', JSON.stringify([newQueueItem, ...existingQueue]));
    showToast(t.bookingConfirmed);

    setTimeout(() => setIsSubmitting(false), 2000);
  };

  return (
    <div
      className={`reception-container appointments-page-wrapper ${isDark ? 'dark-mode' : ''}`}
      dir={dir}
      lang={lang}
    >
      {notification.show && (
        <div className={`notification-toast ${notification.type}`} role="status">
          <span>{notification.message}</span>
        </div>
      )}

      <header className="page-header">
        <h1>{t.pageTitle}</h1>
        <p>{t.pageSubtitle}</p>
      </header>

      <div className="appointments-grid">
        <div className="add-patient-card">
          <h2>{t.addPatientTitle}</h2>
          <form onSubmit={handleAddPatient}>
            <div className="form-group">
              <label htmlFor="new-patient-name">{t.nameLabel}</label>
              <input
                id="new-patient-name"
                type="text"
                dir={dir}
                className="form-input"
                placeholder={t.namePlaceholder}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-patient-phone">{t.phoneLabel}</label>
              <input
                id="new-patient-phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                className="form-input phone-input"
                placeholder={t.phonePlaceholder}
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>
            <button type="submit" className="submit-btn">{t.addPatientBtn}</button>
          </form>
        </div>

        <div className="booking-form-card">
          <h2>{t.bookingTitle}</h2>

          <div className="form-group">
            <label htmlFor="booking-patient">{t.patientLabel}</label>
            <select
              id="booking-patient"
              dir={dir}
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
            <label>{t.dayLabel}</label>
            <div className="days-selector">
              {t.days.map((day) => (
                <button
                  type="button"
                  key={day.id}
                  className={`day-btn ${selectedDayId === day.id ? 'active' : ''}`}
                  onClick={() => setSelectedDayId(day.id)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>{t.timeLabel}</label>
            <div className="times-grid">
              {t.times.map((time) => (
                <button
                  type="button"
                  key={time.id}
                  className={`time-btn ${selectedTimeId === time.id ? 'active' : ''}`}
                  onClick={() => setSelectedTimeId(time.id)}
                >
                  {time.label}
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
            {isSubmitting ? t.confirming : t.confirmBtn}
          </button>
        </div>
      </div>
    </div>
  );
}