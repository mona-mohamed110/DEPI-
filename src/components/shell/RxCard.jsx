
import { useState } from 'react';
import Icon from '../Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';

export default function RxCard({ rx, children }) {
  const { t, L, fmtDate } = useI18n();
  const [open, setOpen] = useState(false);

  const tests = rx.tests || [];
  const labTests = tests.filter((test) => test.kind !== 'xray');
  const xrayTests = tests.filter((test) => test.kind === 'xray');

  return (
    <>
      <article className="rx-card">
        <header className="rx-head">
          <div className="res-icon">
            <Icon name="pill" size={22} />
          </div>

          <button
            type="button"
            className="rx-open-btn"
            onClick={() => setOpen(true)}
          >
            <div className="m">
              <b>
                {L(rx.doctor)} — {t(`visit_${rx.visit}`)}
              </b>

              <small>
                {L(rx.specialty)} · {fmtDate(rx.date)}
              </small>

              {rx.diagnosis && (
                <small>
                  {t('rx_diagnosis')}: {L(rx.diagnosis)}
                </small>
              )}

              <span className="rx-details-hint">
                عرض تفاصيل الروشتة
                <Icon name="chevron-left" size={15} />
              </span>
            </div>
          </button>

          <div className="rx-actions">
            {children}
          </div>
        </header>
      </article>

      {open && (
        <div
          className="rx-modal-overlay"
          onClick={() => setOpen(false)}
        >
          <section
            className="rx-modal"
            role="dialog"
            aria-modal="true"
            aria-label="تفاصيل الروشتة"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="rx-modal-header">
              <div>
                <div className="rx-modal-title">
                  <Icon name="pill" size={22} />
                  <h2>تفاصيل الروشتة</h2>
                </div>

                <p>{fmtDate(rx.date)}</p>
              </div>

              <button
                type="button"
                className="rx-modal-close"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
              >
                <Icon name="x" size={20} />
              </button>
            </header>

            <div className="rx-modal-body">
              <div className="rx-info-grid">
                <div className="rx-info-item">
                  <span>الطبيب</span>
                  <b>{L(rx.doctor)}</b>
                </div>

                <div className="rx-info-item">
                  <span>التخصص</span>
                  <b>{L(rx.specialty) || '—'}</b>
                </div>

                <div className="rx-info-item">
                  <span>نوع الكشف</span>
                  <b>{t(`visit_${rx.visit}`)}</b>
                </div>

                <div className="rx-info-item">
                  <span>التاريخ</span>
                  <b>{fmtDate(rx.date)}</b>
                </div>
              </div>

              {rx.diagnosis && (
                <section className="rx-detail-section">
                  <h3>التشخيص</h3>
                  <p>{L(rx.diagnosis)}</p>
                </section>
              )}

              {/* الأدوية */}
              <section className="rx-detail-section">
                <h3>
                  <Icon name="pill" size={18} />
                  الأدوية الموصوفة
                </h3>

                {rx.items?.length ? (
                  <div className="rx-medicine-list">
                    {rx.items.map((item, index) => (
                      <div className="rx-medicine" key={index}>
                        <div className="rx-medicine-number">
                          {index + 1}
                        </div>

                        <div className="rx-medicine-content">
                          <b dir="ltr">{item.name}</b>

                          <div>
                            <span>الجرعة:</span>
                            <strong>{L(item.dose)}</strong>
                          </div>

                          <div>
                            <span>مدة العلاج:</span>
                            <strong>{L(item.duration)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>لا توجد أدوية مسجلة في هذه الروشتة.</p>
                )}
              </section>

              {/* التحاليل */}
              <section className="rx-detail-section">
                <h3>
                  <Icon name="flask-conical" size={18} />
                  التحاليل المطلوبة
                </h3>

                {labTests.length > 0 ? (
                  <div className="rx-medicine-list">
                    {labTests.map((test, index) => (
                      <div className="rx-medicine" key={index}>
                        <div className="rx-medicine-number">
                          <Icon name="flask-conical" size={17} />
                        </div>

                        <div className="rx-medicine-content">
                          <b>{L(test.name)}</b>
                          <span>تحليل مطلوب من الطبيب</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>لا توجد تحاليل مطلوبة في هذه الروشتة.</p>
                )}
              </section>

              {/* الأشعة */}
              <section className="rx-detail-section">
                <h3>
                  <Icon name="scan" size={18} />
                  الأشعة المطلوبة
                </h3>

                {xrayTests.length > 0 ? (
                  <div className="rx-medicine-list">
                    {xrayTests.map((test, index) => (
                      <div className="rx-medicine" key={index}>
                        <div className="rx-medicine-number">
                          <Icon name="scan" size={17} />
                        </div>

                        <div className="rx-medicine-content">
                          <b>{L(test.name)}</b>
                          <span>أشعة مطلوبة من الطبيب</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>لا توجد أشعة مطلوبة في هذه الروشتة.</p>
                )}
              </section>
            </div>

            <footer className="rx-modal-footer">
              <button
                type="button"
                className="btn"
                onClick={() => setOpen(false)}
              >
                إغلاق
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
