
import authController from "../controller/oauth-controller";
import { Request, Response, NextFunction } from 'express';
import db from "../model";

const authenticate = () => {
    return {
        verify: (scopes: string[]) => async (req: Request, res: Response, next: NextFunction) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return res.status(401).json({ message: 'Invalid token format' });
                }
                const accessToken = authHeader.slice(7);
                await new Promise<void>((resolve, reject) => {
                    authController.verifyAccessToken(accessToken, async (status: number, response: any) => {
                        if (status === 200) {
                            req.user = response;
                            try {
                                const token = await db.AccessToken.findOne({ accessToken }).lean();

                                if (!token || req.user._id.toString() !== token.user_id.toString()) {
                                    return res.status(401).send({ message: "Unauthorized user", status: 401, response: null });
                                }

                                if (!scopes || scopes.includes(req.user.scope)) {
                                    resolve();
                                    next();
                                } else {
                                    res.status(403).send({ message: "Insufficient permissions", status: 403, response: null });
                                }
                            } catch (error) {
                                reject(error);
                            }
                        } else {
                            res.status(status).send(response);
                        }
                    });
                });

            } catch (error) {
                res.status(403).json({ message: 'Invalid token' });
            }
        },
    };
};
export default authenticate;