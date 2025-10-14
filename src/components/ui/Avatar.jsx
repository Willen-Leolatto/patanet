export default function Avatar({ src, name='', size=36 }) {
  const initials = name.trim().split(' ').slice(0,2).map(n=>n[0]?.toUpperCase()).join('') || 'P'
  return (
    <div className="relative inline-flex items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
         style={{width:size, height:size}}>
      {src
        ? <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
        : <span className="text-xs font-semibold">{initials}</span>}
    </div>
  )
}
