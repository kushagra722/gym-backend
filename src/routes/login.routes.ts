import constants from "../constants";
import OauthController1 from "../controller/oauth-controller";
import auth from "../middleware/authentication";
import mongo from '../model'
import { Request, Response } from "express";

// constants
export default (router: any) => {
    router.route("/api/v1/login")
        .post((req: any, res: any) => {
            if (req.body.scope) {
                OauthController1.login(req.body.username, req.body.password, req.body.scope, (status: number, data: any) => {
                    res.status(status).send(data)
                })
            }
            else {
                res.status(401).send({ data: null, message: "Scope not found", status: 401 })
            }
        })
    router.route("/api/v1/logout")
        .get(auth().verify([constants.SCOPE.ADMIN, constants.SCOPE.CUSTOMER]), async (req: Request, res: Response) => {
            try {
                const conditionField = 'user_id';
                const conditionValue = req.user._id;

                // Find documents that match the condition and delete them
                await mongo.AccessToken.deleteMany({ [conditionField]: conditionValue });
                console.log('Logout successfully.');

                res.status(200).send({ message: "Logout successfully", status: 200 });
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Internal server error", data: null, error: err, status: 500 });
            }
        });
};

