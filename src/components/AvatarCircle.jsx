import React from 'react'
import clsx from 'clsx'

export default function AvatarCircle({ src, alt='', children, size=40, className='' }){
  const s = typeof size==='number' ? `${size}px` : size
  return (
    <div className={clsx("shrink-0 rounded-full overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center", className)}
         style={{ width:s, height:s }}>
      {src ? <img src={src} alt={alt} className="w-full h-full object-cover" /> : children}
    </div>
  )
}
