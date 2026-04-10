export interface PostAttachment {
  type: 'image' | 'file' | 'link';
  url: string;
  name?: string;
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
  isLiked: boolean;
  isSaved: boolean;
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
