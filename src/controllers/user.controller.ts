import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { IUserCreate } from '../interfaces/user.interface';
import { logger } from '../utils/logger';

export class UserController {
  private static instance: UserController;

  private constructor() {}

  public static getInstance(): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController();
    }
    return UserController.instance;
  }

  public createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: IUserCreate = req.body;
      const user = new UserModel(userData);
      await user.save();

      logger.info('User created successfully', { userId: user._id });
      res.status(201).json({
        status: 'success',
        data: {
          user,
        },
      });
    } catch (error) {
      logger.error('Error creating user', { error });
      res.status(500).json({
        status: 'error',
        message: 'Failed to create user',
      });
    }
  };

  public getUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await UserModel.find({ isActive: true });
      res.status(200).json({
        status: 'success',
        data: {
          users,
        },
      });
    } catch (error) {
      logger.error('Error fetching users', { error });
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch users',
      });
    }
  };

  public getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: {
          user,
        },
      });
    } catch (error) {
      logger.error('Error fetching user', { error });
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user',
      });
    }
  };
}
