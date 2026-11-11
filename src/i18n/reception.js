// ترجمة لوحة الاستقبال
import { common, merge } from './common.js';

const base = {
  ar: {
    nav_dash: 'طابور اليوم', nav_appts: 'حجز وتعديل المواعيد', nav_pts: 'سجل المرضى',
    title: 'طابور اليوم', subtitle: 'حالة كل مريض لحظة بلحظة', search_ph: 'ابحث باسم المريض أو الدكتور...',
    total: 'إجمالي اليوم', arrived: 'وصل', inExam: 'في الكشف', ended: 'انتهى', notArrived: 'لم يصل', f_all: 'الكل',
    th_name: 'الاسم', th_time: 'الوقت', th_status: 'الحالة', th_actions: 'الإجراءات', th_phone: 'الهاتف', th_doctor: 'الدكتور',
    no_data: 'لا يوجد مرضى يطابقون البحث أو الفلتر المختار.',
    'st_not-arrived': 'لم يصل', 'st_arrived': 'وصل', 'st_in-exam': 'في الكشف', 'st_ended': 'انتهى',
    ap_title: 'حجز وتعديل المواعيد', ap_sub: 'احجز أو عدّل أو ألغِ ميعاد لمريض',
    add_pt_title: 'إضافة مريض جديد', phone_label: 'رقم الهاتف', name_ph: 'اكتب اسم المريض...', add_pt: 'إضافة مريض',
    book_title: 'حجز ميعاد جديد', patient: 'المريض', pick_patient: 'اختر المريض', day: 'اليوم', time: 'الوقت', confirm_book: 'تأكيد الحجز',
    err_name: 'يرجى كتابة اسم المريض (٣ حروف على الأقل)', err_phone: 'رقم هاتف مصري غير صحيح', err_select: 'الرجاء اختيار مريض أولاً', err_dt: 'اختر اليوم والوقت',
    pt_added: 'تمت إضافة المريض بنجاح', booked: 'تم تأكيد الحجز وإضافته لطابور الاستقبال',
    today: 'اليوم', tomorrow: 'بكرة',
    rq_title: 'طلبات الحجز الجديدة', rq_sub: 'طلبات المرضى لدكتورك — اقبلها ليظهر المريض في الطابور وعند الدكتور', rq_empty: 'لا توجد طلبات حجز جديدة', rq_accept: 'قبول', rq_reject: 'رفض', rq_accepted: 'تم قبول الحجز وإضافته للطابور', rq_rejected: 'تم رفض الطلب', rq_for: 'ميعاد',
    confirm_msg: 'لا يمكن تعديل بيانات المريض بعد الإضافة. هل أنت متأكد من صحة البيانات؟', confirm_yes: 'نعم، البيانات صحيحة', confirm_review: 'مراجعة البيانات',
    rec_title: 'سجل المرضى (منتهى الكشف)', rec_sub: 'قائمة بجميع المرضى الذين أتموا الكشف الطبي وتم تحويلهم للسجل', rec_empty: 'لا يوجد مرضى في السجل حتى الآن.',
    rec_del_q: 'هل أنت متأكد من حذف بيانات المريض ({name}) من السجل؟', rec_deleted: 'تم حذف المريض من السجل',
  },
  en: {
    nav_dash: "Today's queue", nav_appts: 'Book & manage appointments', nav_pts: 'Patients record',
    title: "Today's queue", subtitle: 'Real-time status of every patient', search_ph: 'Search by patient or doctor...',
    total: 'Total today', arrived: 'Arrived', inExam: 'In exam', ended: 'Ended', notArrived: 'Not arrived', f_all: 'All',
    th_name: 'Name', th_time: 'Time', th_status: 'Status', th_actions: 'Actions', th_phone: 'Phone', th_doctor: 'Doctor',
    no_data: 'No patients match the selected search or filter.',
    'st_not-arrived': 'Not arrived', 'st_arrived': 'Arrived', 'st_in-exam': 'In exam', 'st_ended': 'Ended',
    ap_title: 'Book & manage appointments', ap_sub: 'Book, edit or cancel a patient appointment',
    add_pt_title: 'Add new patient', phone_label: 'Phone number', name_ph: 'Enter patient name...', add_pt: 'Add patient',
    book_title: 'Book new appointment', patient: 'Patient', pick_patient: 'Select patient', day: 'Day', time: 'Time', confirm_book: 'Confirm booking',
    err_name: 'Enter the patient name (3+ characters)', err_phone: 'Invalid Egyptian phone number', err_select: 'Please select a patient first', err_dt: 'Pick a day and a time',
    pt_added: 'Patient added successfully', booked: 'Booking confirmed and added to the reception queue',
    today: 'Today', tomorrow: 'Tomorrow',
    rq_title: 'New booking requests', rq_sub: 'Patient requests for your doctor — accept to add them to the queue and to the doctor', rq_empty: 'No new booking requests', rq_accept: 'Accept', rq_reject: 'Reject', rq_accepted: 'Booking accepted and added to the queue', rq_rejected: 'Request rejected', rq_for: 'Appointment',
    confirm_msg: 'The patient data cannot be edited after adding. Are you sure the data is correct?', confirm_yes: 'Yes, the data is correct', confirm_review: 'Review data',
    rec_title: 'Patients record (completed exams)', rec_sub: 'All patients who completed their exam and were moved to the record', rec_empty: 'No patients in the record yet.',
    rec_del_q: 'Are you sure you want to delete patient ({name}) from the record?', rec_deleted: 'Patient removed from the record',
  },
};
export const receptionDict = merge(common, base);
