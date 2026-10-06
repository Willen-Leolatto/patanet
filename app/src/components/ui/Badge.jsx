export default function Badge({ children, tone='slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    red:   'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    blue:  'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${tones[tone]}`}>{children}</span>
}
