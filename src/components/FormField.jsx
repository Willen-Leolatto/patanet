export default function FormField({ label, hint, required=false, children }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium">{label}{required && ' *'}</label>}
      {children}
      {hint && <p className="text-xs opacity-70">{hint}</p>}
    </div>
  )
}
