
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import "../../components/Style/Patient/Booking.css";

const SEARCH_ROUTE = "/ClinicLabSearch";

const FALLBACK_AVAILABLE_DAYS = [0, 1, 2, 3, 4, 6];

const FALLBACK_TIME_SLOTS = [
  "10:00",
  "10:30",
  "11:00",
  "16:00",
  "16:30",
  "17:00",
];

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildDays(availableDays, t) {
  const days = [];
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 14 && days.length < 7; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    if (availableDays.includes(date.getDay())) {
      let label = date.toLocaleDateString(t.locale, {
        weekday: "short",
      });

      if (i === 0) label = t.today;
      if (i === 1) label = t.tomorrow;

      days.push({
        key: toDateKey(date),
        label,
        dayNumber: date.getDate(),
        month: date.toLocaleDateString(t.locale, {
          month: "short",
        }),
        fullLabel: date.toLocaleDateString(t.locale, {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
      });
    }
  }

  return days;
}

function formatTime(slot, locale) {
  const [hours, minutes] = slot.split(":").map(Number);
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function Booking() {
  const navigate = useNavigate();
  const location = useLocation();

  const { lang: appLang, t: translate } = useApp();

  const lang = appLang === "en" ? "en" : "ar";
  const dir = lang === "ar" ? "rtl" : "ltr";

  const t = {
    title: translate("title"),
    searchButton: translate("searchButton"),
    searchHint: translate("searchHint"),
    selectedDoctor: translate("selectedDoctor"),
    changeDoctor: translate("changeDoctor"),
    stepDay: translate("stepDay"),
    stepTime: translate("stepTime"),
    today: translate("today"),
    tomorrow: translate("tomorrow"),
    noDays: translate("noDays"),
    confirm: translate("confirm"),
    success: translate("success"),
    at: translate("at"),
    time: translate("time"),
    locale: translate("locale"),
    noDoctor: translate("noDoctor"),
  };

  const doctor =
    location.state?.selectedDoctor ||
    location.state?.doctor ||
    null;

  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const days = useMemo(() => {
    if (!doctor) return [];

    const availableDays =
      doctor.availableDays?.length > 0
        ? doctor.availableDays
        : FALLBACK_AVAILABLE_DAYS;

    return buildDays(availableDays, t);
  }, [doctor, lang]);

  const timeSlots =
    doctor?.timeSlots?.length > 0
      ? doctor.timeSlots
      : FALLBACK_TIME_SLOTS;

  const selectedDayData = days.find(
    (day) => day.key === selectedDay
  );

  const handleSearchClick = () => {
    navigate(SEARCH_ROUTE, {
      state: { fromBooking: true },
    });
  };

  const handleDaySelect = (dayKey) => {
    setSelectedDay(dayKey);
    setSelectedTime("");
    setConfirmed(false);
  };

  const handleTimeSelect = (slot) => {
    setSelectedTime(slot);
    setConfirmed(false);
  };

  const handleConfirm = () => {
    if (!doctor || !selectedDay || !selectedTime) return;

    setConfirmed(true);
  };

  return (
    <main className="booking-page" dir={dir} lang={lang}>
      <div className="booking-container">
        <div className="booking-topbar">
          <h1 className="booking-title">{t.title}</h1>

          <button
            type="button"
            className="booking-search-btn"
            onClick={handleSearchClick}
          >
            <span aria-hidden="true">⌕</span>
            {t.searchButton}
          </button>
        </div>

        {!doctor ? (
          <section className="booking-empty-state">
            <div
              className="booking-empty-icon"
              aria-hidden="true"
            >
              <span>＋</span>
            </div>

            <h2>{t.noDoctor}</h2>
            <p>{t.searchHint}</p>

            <button
              type="button"
              className="booking-primary-btn"
              onClick={handleSearchClick}
            >
              {t.searchButton}
            </button>
          </section>
        ) : (
          <>
            <section className="booking-doctor-section">
              <div className="booking-section-heading">
                <h2>{t.selectedDoctor}</h2>

                <button
                  type="button"
                  className="booking-change-btn"
                  onClick={handleSearchClick}
                >
                  {t.changeDoctor}
                </button>
              </div>

              <div className="booking-doctor-info">
                <div
                  className="booking-avatar"
                  aria-hidden="true"
                >
                  {doctor.name?.trim()?.charAt(0) ||
                    (lang === "ar" ? "ط" : "D")}
                </div>

                <div className="booking-doctor-details">
                  <h3>{doctor.name || t.noDoctor}</h3>
                  <p>{doctor.specialty || ""}</p>
                </div>

                {doctor.rating != null && (
                  <div className="booking-rating">
                    <span aria-hidden="true">★</span>
                    {doctor.rating}
                  </div>
                )}
              </div>
            </section>

            <section className="booking-selection-section">
              <div className="booking-section-heading">
                <h2>{t.stepDay}</h2>
              </div>

              {days.length === 0 ? (
                <p className="booking-empty-message">
                  {t.noDays}
                </p>
              ) : (
                <div className="booking-days">
                  {days.map((day) => (
                    <button
                      key={day.key}
                      type="button"
                      className={`booking-day ${
                        selectedDay === day.key
                          ? "booking-day-active"
                          : ""
                      }`}
                      aria-pressed={selectedDay === day.key}
                      onClick={() => handleDaySelect(day.key)}
                    >
                      <span className="booking-day-name">
                        {day.label}
                      </span>

                      <span className="booking-day-number">
                        {day.dayNumber}
                      </span>

                      <span className="booking-day-month">
                        {day.month}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {selectedDay && (
              <section className="booking-selection-section">
                <div className="booking-section-heading">
                  <h2>{t.stepTime}</h2>
                </div>

                <div className="booking-times">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`booking-time ${
                        selectedTime === slot
                          ? "booking-time-active"
                          : ""
                      }`}
                      aria-pressed={selectedTime === slot}
                      onClick={() => handleTimeSelect(slot)}
                    >
                      {formatTime(slot, t.locale)}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="booking-footer">
              <button
                type="button"
                className="booking-primary-btn booking-confirm-btn"
                onClick={handleConfirm}
                disabled={!selectedDay || !selectedTime}
              >
                {t.confirm}
              </button>
            </div>

            {confirmed && selectedDayData && (
              <p className="booking-success" role="status">
                {t.success} {doctor.name} {t.at}{" "}
                {selectedDayData.fullLabel} {t.time}{" "}
                {formatTime(selectedTime, t.locale)}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default Booking;
