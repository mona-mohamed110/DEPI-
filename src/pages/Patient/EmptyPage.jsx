import { useApp } from '../../context/AppContext.jsx';

// صفحة فارغة: عنوان فقط، جاهزة لإضافة المحتوى لاحقاً
export default function EmptyPage({ titleKey }) {
  const { t } = useApp();
  return (
    <section>
      <h1>{t(titleKey)}</h1>
    </section>
  );
}
