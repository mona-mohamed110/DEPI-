
import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import RxCard from '../../components/shell/RxCard.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/patient.js';

export default function Prescriptions() {
  const { t, num } = useI18n();
  const { act } = useToast();
  const [tab, setTab] = useState('current');

  const state = useAsync(async () => {
    const [cur, past] = await Promise.all([
      api.getPrescriptions(true),
      api.getPrescriptions(false),
    ]);

    return { cur, past };
  }, []);

  // نقل روشتة بين الحالية والسابقة
  const move = async (rx, toCurrent) => {
    const r = await act(
      () => api.setPrescriptionCurrent(rx.id, toCurrent),
      'rx_moved'
    );

    if (!r) return;

    state.setData((d) => {
      const all = [...d.cur, ...d.past]
        .map((x) =>
          x.id === rx.id ? { ...x, current: toCurrent } : x
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        cur: all.filter((x) => x.current),
        past: all.filter((x) => !x.current),
      };
    });
  };

  return (
    <section>
      <h1>{t('rx_title')}</h1>
      <p className="sub">{t('rx_sub')}</p>

      <Async state={state}>
        {(d) => {
          const list = tab === 'current' ? d.cur : d.past;

          return (
            <>
              <div className="tabs">
                <button
                  type="button"
                  className={tab === 'current' ? 'on' : ''}
                  onClick={() => setTab('current')}
                >
                  {t('rx_current')} ({num(d.cur.length)})
                </button>

                <button
                  type="button"
                  className={tab === 'past' ? 'on' : ''}
                  onClick={() => setTab('past')}
                >
                  {t('rx_past')} ({num(d.past.length)})
                </button>
              </div>

              {list.length === 0 ? (
                <div className="card state">
                  {t(
                    tab === 'current'
                      ? 'rx_empty_current'
                      : 'rx_empty_past'
                  )}
                </div>
              ) : (
                <div className="rx-grid">
                  {list.map((rx) => (
                    <RxCard key={rx.id} rx={rx}>
                      {/* التحاليل والأشعة */}
                      {rx.tests && rx.tests.length > 0 && (
                        <div
                          className="rx-tests"
                          style={{
                            marginTop: 16,
                            padding: 14,
                            borderRadius: 10,
                            background: 'var(--surface, #f5f8fc)',
                          }}
                        >
                          <h4
                            style={{
                              margin: '0 0 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <Icon name="flask-conical" size={18} />
                            التحاليل والأشعة المطلوبة
                          </h4>

                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                            }}
                          >
                            {rx.tests.map((test, index) => (
                              <div
                                key={`${test.name}-${index}`}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                  padding: '9px 12px',
                                  borderRadius: 8,
                                  background: 'var(--card, #fff)',
                                }}
                              >
                                <span>{test.name}</span>

                                <span
                                  className="badge"
                                  style={{ whiteSpace: 'nowrap' }}
                                >
                                  {test.kind === 'xray'
                                    ? 'أشعة'
                                    : 'تحليل'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn s o"
                        onClick={() => move(rx, tab !== 'current')}
                      >
                        <Icon
                          name={tab === 'current' ? 'clock' : 'check'}
                          size={15}
                        />
                        {t(
                          tab === 'current'
                            ? 'rx_move_past'
                            : 'rx_move_current'
                        )}
                      </button>
                    </RxCard>
                  ))}
                </div>
              )}
            </>
          );
        }}
      </Async>
    </section>
  );
}
