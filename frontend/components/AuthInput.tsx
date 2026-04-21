interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function AuthInput({ label, className = "", ...props }: AuthInputProps) {
  return (
    <div className="form-control w-full">
      <label className="label pl-0 pb-1">
        <span className="label-text text-neutral-content font-medium text-sm">{label}</span>
      </label>
      <input
        className={`input w-full bg-base-200/50 border-transparent focus:border-primary/50 focus:bg-base-200 rounded-xl text-white placeholder:text-neutral-content/40 transition-all ${className}`}
        {...props}
      />
    </div>
  );
}
