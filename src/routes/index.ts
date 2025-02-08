
import oauth from "./login.routes";
import admin from "./adminRoutes";

export default (router: any) => {
        oauth(router)
        admin(router)
}