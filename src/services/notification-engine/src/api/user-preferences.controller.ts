import { Request, Response } from 'express';
import { UserPreferences } from '../models/user-preferences.model';

export class UserPreferencesController {
    public static async getUserPreferences(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const preferences = await UserPreferences.findOne({ userId });

            if (!preferences) {
                res.status(404).json({
                    status: 'error',
                    message: 'User preferences not found'
                });
                return;
            }

            res.status(200).json({
                status: 'success',
                data: preferences
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Error fetching user preferences'
            });
        }
    }

    public static async updateUserPreferences(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const preferences = await UserPreferences.findOneAndUpdate(
                { userId },
                { $set: req.body },
                { new: true, upsert: true }
            );

            res.status(200).json({
                status: 'success',
                data: preferences
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Error updating user preferences'
            });
        }
    }
}
