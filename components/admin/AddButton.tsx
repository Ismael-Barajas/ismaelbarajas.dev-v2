import clsx from "clsx";
import { FiPlus } from "react-icons/fi";

export interface AddButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

/** Dashed, frosted "add another" button shown under an editable list. */
const AddButton = ({ label, onClick, className }: AddButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      "inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/25 bg-white/40 px-5 py-3 text-sm font-medium text-text backdrop-blur-xl transition-[background-color,border-color,scale] duration-300 ease-out hover:border-black/45 hover:bg-white/70 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-background ring-text dark:border-white/25 dark:bg-white/[0.05] dark:hover:border-white/45 dark:hover:bg-white/[0.1]",
      className,
    )}
  >
    <FiPlus aria-hidden="true" className="h-4 w-4" />
    {label}
  </button>
);

export default AddButton;
