import React from 'react'
import clsx from 'clsx'

export default function Button({ as:Comp='button', className='', variant='brand', size='md', ...props }){
  const base = 'inline-flex items-center justify-center rounded-lg transition focus:outline-none disabled:opacity-50 disabled:pointer-events-none'
  const sizes = { sm:'h-8 px-3 text-xs', md:'h-9 px-3 text-sm', lg:'h-10 px-4 text-base' }
  const variants = {
    brand: 'btn-brand',
    outline: 'border border-[var(--card-border)] hover:bg-white/5',
    ghost: 'hover:bg-white/5',
    subtle: 'bg-white/5',
  }
  return <Comp className={clsx(base, sizes[size], variants[variant], className)} {...props}/>
}
