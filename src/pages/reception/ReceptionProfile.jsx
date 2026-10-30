import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Save, X, ArrowRight, ArrowLeft } from 'lucide-react';
import './ReceptionProfile.css';

export default function ReceptionProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

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

  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('reception_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      name: 'أمل محروس',
      email: 'mhrwshbyb6@gmail.com',
      password: '••••••••'
    };
  });

  const [formData, setFormData] = useState({
    name: userData.name,
    email: userData.email,
    password: ''
  });

  useEffect(() => {
    setFormData({
      name: userData.name,
      email: userData.email,
      password: ''
    });
  }, [userData]);

  const handleSave = (e) => {
    e.preventDefault();
    const updated = {
      name: formData.name.trim() || userData.name,
      email: formData.email.trim() || userData.email,
      password: formData.password.trim() ? formData.password : userData.password
    };
    
    setUserData(updated);
    localStorage.setItem('reception_user_profile', JSON.stringify(updated));
    setIsEditing(false);
    alert(lang === 'ar' ? 'تم حفظ التعديلات بنجاح!' : 'Changes saved successfully!');
  };

  const handleCancel = () => {
    setFormData({ name: userData.name, email: userData.email, password: '' });
    setIsEditing(false);
  };

  const translations = {
    ar: {
      title: 'الملف الشخصي',
      subtitle: 'بياناتك الشخصية الأساسية',
      back: 'رجوع',
      nameLabel: 'الاسم',
      emailLabel: 'البريد الإلكتروني',
      passLabel: 'كلمة المرور',
      editBtn: 'تعديل البيانات',
      newPassLabel: 'كلمة المرور الجديدة',
      passPlaceholder: 'اتركها فارغة إذا لم ترد التغيير',
      cancelBtn: 'إلغاء',
      saveBtn: 'حفظ التغييرات',
    },
    en: {
      title: 'Profile',
      subtitle: 'Your core personal information',
      back: 'Back',
      nameLabel: 'Name',
      emailLabel: 'Email',
      passLabel: 'Password',
      editBtn: 'Edit Details',
      newPassLabel: 'New Password',
      passPlaceholder: 'Leave blank if you do not want to change',
      cancelBtn: 'Cancel',
      saveBtn: 'Save Changes',
    }
  };

  const t = translations[lang] || translations.ar;
  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className={`profile-page-wrapper ${isDark ? 'dark-mode' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="page-title-container">
        <div className="title-text-group">
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <BackIcon size={18} /> {t.back}
        </button>
      </div>

      <div className="profile-main-card">
        <div className="card-top-header">
          <div className="user-avatar-circle">
            {userData.name ? userData.name.charAt(0) : 'أ'}
          </div>
          <div className="user-name-title">{userData.name}</div>
        </div>

        {!isEditing ? (
          <div className="card-content-body">
            <div className="info-stack-item">
              <span className="stack-label">{t.nameLabel}</span>
              <span className="stack-value">{userData.name}</span>
            </div>

            <div className="info-stack-item">
              <span className="stack-label">{t.emailLabel}</span>
              <span className="stack-value">{userData.email}</span>
            </div>

            <div className="info-stack-item">
              <span className="stack-label">{t.passLabel}</span>
              <span className="stack-value">••••••••</span>
            </div>

            <div className="card-footer-action">
              <button className="edit-action-btn" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} /> {t.editBtn}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="profile-edit-form">
            <div className="form-stack">
              <div className="form-group">
                <label>{t.nameLabel}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.emailLabel}</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.newPassLabel}</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder={t.passPlaceholder}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                <X size={16} /> {t.cancelBtn}
              </button>
              <button type="submit" className="save-btn">
                <Save size={16} /> {t.saveBtn}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}