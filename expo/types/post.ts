export interface PostAttachment {
  type: 'image' | 'file' | 'link';
  url: string;
  name?: string;
}

export interface QuotedPost {
  id: string;
  authorName: string;
  authorInitial: string;
  content: string;
  createdAt: string;
}

export interface EnrichedPost {
  id: string;
  authorId: string;
  content: string;
  topic: string;
  attachments: PostAttachment[];
  createdAt: string;
  authorName: string;
  authorRole: string;
  authorCompany: string;
  authorInitial: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  sharesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isRepost?: boolean;
  repostAuthorName?: string;
  repostAuthorId?: string;
  quotedPost?: QuotedPost | null;
}

export interface EnrichedComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  authorName: string;
  authorRole: string;
  authorInitial: string;
}

export type ShareAction =
  | 'repost'
  | 'quote'
  | 'send_private'
  | 'send_group'
  | 'copy_link'
  | 'external';
