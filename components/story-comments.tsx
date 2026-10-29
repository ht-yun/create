import { MessageCircle, Star, ThumbsUp } from "lucide-react";
import type { StoryDetail } from "@/shared/story-contract";

type Comment = {
  author: string;
  badge: string;
  date: string;
  rating: number;
  body: string;
  likes: number;
};

const homeComments: Comment[] = [
  { author: "住在故事里", badge: "安全体验官", date: "2 天前", rating: 5, body: "信息整理得很清楚，尤其是把“看到的”和“还不能确定的”分开这一点，玩完以后真的会重新检查家里的收纳方式。", likes: 28 },
  { author: "小满同学", badge: "完成 3 次体验", date: "5 天前", rating: 5, body: "节奏很适合和孩子一起讨论，不是直接告诉答案，而是让人先停下来想想下一步该核对什么。", likes: 19 },
  { author: "北窗", badge: "收藏用户", date: "1 周前", rating: 4, body: "画面和选择都很克制，最后的安全提示很有帮助，希望后面能继续更新更多生活场景。", likes: 11 },
];

const romanceComments: Comment[] = [
  { author: "晚风收信人", badge: "完成 2 次体验", date: "昨天", rating: 5, body: "选择并不多，但每一次都像真的在替角色说话，最后的回望很有余韵。", likes: 36 },
  { author: "南方站台", badge: "收藏用户", date: "3 天前", rating: 5, body: "很喜欢这种慢慢长出来的情绪，几个结局都值得走一遍。", likes: 24 },
  { author: "一页纸", badge: "首次体验", date: "1 周前", rating: 4, body: "文字很舒服，音乐和画面也配得上故事的气质。", likes: 9 },
];

const mysteryComments: Comment[] = [
  { author: "夜航灯", badge: "完成 4 次体验", date: "昨天", rating: 5, body: "线索藏得很自然，回头看才发现前面几处细节都在提示另一条路线。", likes: 42 },
  { author: "纸上追光", badge: "收藏用户", date: "4 天前", rating: 5, body: "氛围感很强，选择反馈也不会直接剧透，适合慢慢推理。", likes: 27 },
  { author: "青石巷口", badge: "首次体验", date: "2 周前", rating: 4, body: "希望以后能看到更多支线人物的故事。", likes: 13 },
];

function commentsFor(story: StoryDetail) {
  if (story.tags.includes("家庭") || story.tags.includes("安全教育") || story.slug.startsWith("home-safety")) return homeComments;
  if (story.tags.includes("恋爱") || story.tags.includes("校园")) return romanceComments;
  return mysteryComments;
}

export function StoryComments({ story }: { story: StoryDetail }) {
  const comments = commentsFor(story);
  return (
    <section className="story-comments" aria-labelledby="story-comments-title">
      <div className="story-detail-section-heading">
        <div><span className="eyebrow">FROM OTHER READERS</span><h2 id="story-comments-title">用户评论</h2><p>看看走过这段故事的人，留下了哪些感受。</p></div>
        <span className="result-count"><MessageCircle size={14} />{comments.length} 条评论</span>
      </div>
      <div className="comment-list">
        {comments.map((comment) => (
          <article className="comment-card" key={`${comment.author}-${comment.date}`}>
            <div className="comment-avatar" aria-hidden="true">{comment.author.slice(0, 1)}</div>
            <div className="comment-content">
              <div className="comment-heading"><div><strong>{comment.author}</strong><span>{comment.badge}</span></div><time>{comment.date}</time></div>
              <div className="comment-rating" aria-label={`${comment.rating} 星评价`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill={index < comment.rating ? "currentColor" : "none"} />)}</div>
              <p>{comment.body}</p>
              <span className="comment-like"><ThumbsUp size={13} />{comment.likes}</span>
            </div>
          </article>
        ))}
      </div>
      <div className="comment-coming-soon"><MessageCircle size={17} /><span><strong>也想留下你的体验？</strong><small>登录后即可参与评论，和其他读者交流分支选择。</small></span><a href={`/auth?returnTo=${encodeURIComponent(`/stories/${story.slug}`)}`}>登录评论</a></div>
    </section>
  );
}
