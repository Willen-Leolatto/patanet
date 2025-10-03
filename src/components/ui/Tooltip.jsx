import React, { useState } from 'react'
import clsx from 'clsx'

export default function Tooltip({ label, children, className='' }) {
  const [open, setOpen] = useState(false)
  return (
    <span className={clsx('relative inline-block', className)}
          onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}>
      {children}
      {open && label && (
        <span className="absolute left-1/2 -translate-x-1/2 -top-2 translate-y-[-100%] 
                         whitespace-nowrap rounded-md px-2 py-1 text-xs
                         bg-black/80 text-white shadow-sm z-50">
          {label}
        </span>
      )}
    </span>
  )
}
