import React from 'react'
import clsx from 'clsx'

export default function Skeleton({ className='', height=12, width='100%', rounded='0.5rem' }) {
  const style = { height: typeof height==='number' ? `${height}px` : height,
                  width, borderRadius: rounded }
  return <div className={clsx('skeleton', className)} style={style} />
}
