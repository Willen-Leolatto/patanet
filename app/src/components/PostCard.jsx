import { useState } from 'react'
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

function timeAgo(ts){
  const d = typeof ts==='number' ? ts : new Date(ts).getTime()
  const diff = Math.max(0, Date.now()-d)
  const mins = Math.floor(diff/60000)
  if (mins<1) return 'agora'
  if (mins<60) return `${mins}min`
  const h = Math.floor(mins/60); if (h<24) return `${h}h`
  const days = Math.floor(h/24); return `${days}d`
}

export default function PostCard({ post, onLike, onComment, onShare, className='' }) {
  const [liked, setLiked] = useState(!!post?.liked)
  const [likes, setLikes] = useState(post?.likesCount ?? 0)

  const handleLike = () => {
    const next = !liked
    setLiked(next); setLikes(v => v + (next ? 1 : -1))
    onLike?.(post)
  }

  const images = Array.isArray(post?.images) ? post.images : []
  return (
    <article className={cn(
      'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm',
      'dark:border-slate-800 dark:bg-slate-900', className
    )}>
      {/* Cabeçalho */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={post?.author?.avatarUrl} name={post?.author?.name} size={40} />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{post?.author?.name || 'Usuário'}</p>
              {post?.petNames?.map(n => <Badge key={n}>{n}</Badge>)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{timeAgo(post?.createdAt)}</p>
          </div>
        </div>
        <button className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Texto */}
      {post?.text && (
        <div className="mb-3 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">
          {post.text}
        </div>
      )}

      {/* Imagens (grid responsivo) */}
      {!!images.length && (
        <div className={cn('mb-3 grid gap-2', images.length===1 ? 'grid-cols-1' : images.length===2 ? 'grid-cols-2' : 'grid-cols-2')}>
          {images.slice(0,4).map((src, i) => (
            <img key={i} src={src} alt="" className={cn('h-64 w-full rounded-lg object-cover', images.length===1 && 'h-80')} />
          ))}
        </div>
      )}

      {/* Ações */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant={liked ? 'subtle':'ghost'} size="sm" onClick={handleLike} className="gap-1.5">
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {likes}
          </Button>
          <Button variant="ghost" size="sm" onClick={()=>onComment?.(post)} className="gap-1.5">
            <MessageCircle className="h-4 w-4" /> {post?.commentsCount ?? 0}
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={()=>onShare?.(post)} className="gap-1.5">
          <Share2 className="h-4 w-4" /> Compartilhar
        </Button>
      </div>
    </article>
  )
}
