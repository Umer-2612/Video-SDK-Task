export interface IUser {
  _id?: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface IUserCreate extends Omit<IUser, '_id' | 'createdAt' | 'updatedAt'> {}
