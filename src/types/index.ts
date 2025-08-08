export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Date;
}

export interface Memory {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  content: string;
  hashtags: string[];
  images: string[];
  likes: string[];
  comments: Comment[];
  createdAt: Date;
  editedAt?: Date;
  isEdited?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  content: string;
  createdAt: Date;
}
