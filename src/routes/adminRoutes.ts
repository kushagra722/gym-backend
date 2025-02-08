import auth from "../middleware/authentication";
import constants from "../constants";
import adminController from "../controller/adminController";
import { Request, Response } from "express";
export default (router: any) => {

    /*******************************ADMIN****************************/

    router.route("/api/v1/admin/users")
        .post(auth().verify([constants.SCOPE.ADMIN]), (req: Request, res: Response) => {
            adminController.addUser(req, (response: any) => {
                res.status(response.status).send(response);

            })
        })
        .get(auth().verify([constants.SCOPE.ADMIN]), (req: Request, res: Response) => {
            adminController.getAllUsers(req, (response: any) => {
                res.status(response.status).send(response);

            })
        })
    router.route("/api/v1/admin/user/:id")
        .get(auth().verify([constants.SCOPE.ADMIN]), (req: Request, res: Response) => {
            adminController.getUserById(req, (response: any) => {
                res.status(response.status).send(response);

            })
        })
        .put(auth().verify([constants.SCOPE.ADMIN]), (req: Request, res: Response) => {
            adminController.updateUser(req, (response: any) => {
                res.status(response.status).send(response);

            })
        })
        .delete(auth().verify([constants.SCOPE.ADMIN]), (req: Request, res: Response) => {
            adminController.deleteUser(req, (response: any) => {
                res.status(response.status).send(response);

            })
        })
    router.route("/api/v1/subscriptions")
        .get((req: Request, res: Response) => {
            adminController.getSubscriptions(req, (response: any) => {
                res.status(response.status).send(response);

            })
        })
    router.route("/api/v1/dashboard")
        .get(auth().verify([constants.SCOPE.ADMIN]),(req: Request, res: Response) => {
            adminController.getDashboard(req, (response: any) => {
                res.status(response.status).send(response);

            })
        })
};
