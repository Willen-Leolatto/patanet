import React from "react";
import { Heart, MessageSquare } from "lucide-react";
import IconButton from "@/components/ui/IconButton";

/**
 * FeedPostActions
 * props:
 *  - liked (bool)
 *  - likes (number)
 *  - comments (number)
 *  - onLike(), onComment()
 */
export default function FeedPostActions({
  liked = false,
  likes = 0,
  comments = 0,
  onLike,
  onComment,
}) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <IconButton
        icon={Heart}
        label="Curtir"
        onClick={onLike}
        variant="primary"
        className={liked ? "ring-2 ring-[#f77904]" : ""}
      />
      <span className="text-xs text-slate-400">{likes}</span>

      <IconButton
        icon={MessageSquare}
        label="Comentar"
        onClick={onComment}
        variant="primary"
      />
      <span className="text-xs text-slate-400">{comments}</span>
    </div>
  );
}
