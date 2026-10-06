import { cn } from '@/utils/cn'
export default function Input({ className='', ...props }) {
  return (
    <input
      className={cn(
        'w-full rounded-md border px-3 py-2 text-sm outline-none',
        'border-slate-300 bg-white focus:border-slate-400',
        'dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600',
        className
      )}
      {...props}
    />
  )
}
