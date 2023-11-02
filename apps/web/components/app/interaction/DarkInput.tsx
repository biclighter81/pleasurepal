export default function DarkInput({
  icon,
  placeholder,
  onChange,
  value,
  className,
  label,
}: {
  icon?: React.ReactNode;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: any;
  className?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-xs uppercase font-semibold mb-1">{label}</label>
      )}
      <div
        className={`bg-dark px-4 py-2 rounded-lg flex items-center space-x-4 ${className}`}
      >
        {icon}
        <input
          type="text"
          value={value}
          placeholder={placeholder || ""}
          className={`bg-transparent w-full ring-0 outline-none text-sm font-light text-gray-400`}
          onChange={(e) => {
            onChange && onChange(e);
          }}
        />
      </div>
    </div>
  );
}
