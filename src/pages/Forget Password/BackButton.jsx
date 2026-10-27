import { FaChevronRight } from "react-icons/fa";

// في الاتجاه العربي (RTL) السهم بيشاور لليمين
export default function BackButton({ onClick }) {
  return (
    <button type="button" className="fp-back" onClick={onClick} aria-label="رجوع">
      <FaChevronRight />
    </button>
  );
}
