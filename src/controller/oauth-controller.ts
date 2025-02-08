import crypto from "crypto";
import db from "../model/index"
import bcrypt from "bcrypt";
export default {
    createTokens,
    login: async (username: string, password: string, scope: string, callback: Function) => {
        try {
            let user = await db.User.findOne({ email: username, scope: scope })
            if (user) {
                // Check user scope
                if (!scope || !user.scope.includes(scope)) {
                    return callback(401, { data: null, message: "Invalid credentials", status: 401 });
                }
                // Check password
                let pass

                pass = await bcrypt.compare(password, user.password);
                if (pass) {
                    const accessToken = crypto.randomBytes(64).toString('hex');
                    const accessTokenExpireTime = Date.now() + 8 * 60 * 60 * 1000; // 8 hours in milliseconds
                    const tokenData = {
                        accessToken,
                        access_expire_at: new Date(accessTokenExpireTime),
                        user_id: user._id,
                        scope,
                    };
                    const newToken = await db.AccessToken.create(tokenData);
                    return callback(200, {
                        message: "Logged in Successfully",
                        data: {
                            _id: user._id,
                            accessToken: accessToken,
                            scope: user.scope,
                            email: user.email,
                        },
                        status: 200
                    });
                } else {
                    callback(401, { data: null, message: "User credentials are invalid", status: 401 });
                }
            } else {
                callback(404, { data: null, message: "User not found", status: 404 });
            }
        } catch (error) {
            console.error(error);
            callback(500, { data: null, message: "Error occurred", status: 500 });
        }
    },
    verifyAccessToken: async (token: string, callback: Function) => {
        try {
            if (!token) {
                return callback(401, { message: "Provide Access Token", response: null, status: 401 });
            }
            const currentTimestamp = Date.now();

            const tokenData = await db.AccessToken
                .findOne({ accessToken: token, access_expire_at: { $gte: currentTimestamp } })
                .lean();
            if (!tokenData) {
                return callback(401, { message: "Session expired", data: null, status: 401 });
            }
            const userData = await db.User
                .findOne({ _id: tokenData.user_id })
                .lean();

            if (!userData) {
                return callback(404, { message: "Not found", data: null, status: 404 });
            }

            const { _id, scope, email } = userData;
            const user = {
                _id,
                scope,
                email,
            };
            return callback(200, user);
        } catch (err) {
            console.error(err);
            return callback(500, { error: err, message: "Something went wrong", status: 500 });
        }
    }

}

async function createTokens(userId: string, scope: string, callback: Function) {
    const accessToken = crypto.randomBytes(64).toString('hex');
    const refreshToken = crypto.randomBytes(64).toString('hex');

    const accessTokenExpireTime = Date.now() + 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const refreshTokenExpireTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    try {
        const tokenData = {
            accessToken,
            access_expire_at: new Date(accessTokenExpireTime),
            refreshToken,
            refresh_expire_at: new Date(refreshTokenExpireTime),
            user_id: userId,
            scope,
            client_id: 1
        };

        // Assuming 'AccessToken' is your Mongoose model for access tokens
        const newToken = await db.AccessToken.create(tokenData);

        callback({ accessToken, refreshToken });
    } catch (error) {
        console.error(error);
        // Handle error
        callback(null); // Or handle the error in a suitable way
    }
}
