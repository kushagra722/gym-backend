
import { Request } from "express";
import db from '../model/index'
import bcrypt from 'bcrypt'
import constants from "../constants";
import mongoose from "mongoose";
import moment from "moment";
export default {
    /********************USER**********************/
    addUser: async (req: Request, callback: Function) => {
        try {
            const requiredFields = [
                'email', 'first_name', 'last_name', 'phone', 'dob',
            ];

            const missingFields = requiredFields.filter(field => !req.body[field]);
            if (missingFields.length > 0) {
                return callback({
                    message: `Missing required fields: ${missingFields.join(', ')}`,
                    status: 404,
                });
            }
            const {
                email, first_name, last_name, dob, phone, subscription, discount
            } = req.body;
            if (!subscription) {
                return callback({
                    message: `Subscription required`,
                    status: 400,
                });
            }

            const subscriptionData = await db.Subscription.findById(subscription).lean();
            if (!subscriptionData) {
                return callback({
                    message: `Subscription Not Found`,
                    status: 404,
                });
            }
            let updatedPrice = subscriptionData.price;

            const trimmedEmail = email.trim().toLowerCase();

            if (!isNaN(discount)) {
                if (discount > updatedPrice) {
                    return callback({
                        message: `Invalid Discount`,
                        status: 404,
                    });
                }
                updatedPrice = updatedPrice - discount;
            }
            const userBody: any = {
                first_name,
                last_name,
                email: trimmedEmail,
                phone,
                dob,
                status: req.body.status || constants.STATUS.ACTIVE,
                scope: constants.SCOPE.CUSTOMER,
                password: await bcrypt.hash("password", 10),
            };
            // Check if the email already exists
            const existingUser = await db.User.findOne({ email: trimmedEmail, scope: constants.SCOPE.CUSTOMER }).lean()
            if (existingUser) {
                return callback({ message: "Email already exists", data: null, status: 409 });
            }
            const calculateEndDate = (type: string): Date => {
                const startDate = new Date(); // Current date
                switch (type) {
                    case 'MONTHLY':
                        return moment(startDate).add(1, 'month').toDate();
                    case 'QUATERLY':
                        return moment(startDate).add(3, 'months').toDate();
                    case 'YEARLY':
                        return moment(startDate).add(1, 'year').toDate();
                    default:
                        throw new Error('Invalid subscription type');
                }
            };
            const end_date = calculateEndDate(subscriptionData.name);
            const user = await db.User.create(userBody);
            const subscriptionNew = await db.UserSubscription.create({
                user_id: user._id,
                subscription_id: subscription,
                end_date: end_date,
                discount: discount,
                price: updatedPrice,
                type: subscriptionData.name
            });
            delete userBody.password;
            delete userBody.scope;
            callback({ message: "User Added Successfully", data: { userBody, subscriptionNew }, status: 201 });
        } catch (err) {
            console.error(err);
            callback({ message: "Internal server error", error: err, data: null, status: 500 });
        }
    },
    getAllUsers: async (req: Request, callback: Function) => {
        try {
            const limit = Number(req.query.limit) || 10;
            const page = Number(req.query.page) || 1;
            const offset = Number(page - 1) * limit;
            const searchQuery: any = req.query.search;
            const statusQuery: any = req.query.status;
            const matchQuery: any = {
                scope: constants.SCOPE.CUSTOMER,
            };
            if (statusQuery) {
                matchQuery['status'] = statusQuery;
            }
            if (searchQuery) {
                const search = new RegExp(searchQuery, 'i')
                matchQuery['$or'] = [
                    { 'email': { $regex: search } },
                    { 'last_name': { $regex: search } },
                    { 'first_name': { $regex: search } },
                    { 'phone': { $regex: search } },
                    { 'address': { $regex: search } },
                ];

            }
            const pipeline: any = [
                {
                    $lookup: {
                        from: "user_subscriptions",
                        localField: "_id",
                        foreignField: "user_id", // Assuming user_id in user_subscriptions corresponds to _id in Contractor
                        as: "user_subscriptions"
                    }
                },
                {
                    $unwind: "$user_subscriptions" // Unwind the user_subscriptions array
                },
                {
                    $lookup: {
                        from: "subscriptions", // Assuming your subscriptions collection is named "subscriptions"
                        localField: "user_subscriptions.subscription_id", // Get subscription_id from user_subscriptions
                        foreignField: "_id", // Assuming subscriptions have _id that corresponds to subscription_id
                        as: "subscription_data" // Field that will hold the subscription data
                    }
                },
                {
                    $unwind: {
                        path: "$subscription_data", // Unwind the subscription_data array to get a single subscription object
                        preserveNullAndEmptyArrays: true // Optional: if no subscription data exists, keep the document
                    }
                },
                {
                    $match: matchQuery
                },
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $skip: offset
                },
                {
                    $limit: limit
                },
                {
                    $project: { password: 0 } // Exclude the password field
                }

            ];
            const countPipeline: any = [
                {
                    $lookup: {
                        from: "user_subscriptions",
                        localField: "_id",
                        foreignField: "user_id", // Assuming user_id in user_subscriptions corresponds to _id in Contractor
                        as: "user_subscriptions"
                    }
                },
                {
                    $unwind: "$user_subscriptions" // Unwind the user_subscriptions array
                },
                {
                    $lookup: {
                        from: "subscriptions", // Assuming your subscriptions collection is named "subscriptions"
                        localField: "user_subscriptions.subscription_id", // Get subscription_id from user_subscriptions
                        foreignField: "_id", // Assuming subscriptions have _id that corresponds to subscription_id
                        as: "subscription_data" // Field that will hold the subscription data
                    }
                },
                {
                    $unwind: {
                        path: "$subscription_data", // Unwind the subscription_data array to get a single subscription object
                        preserveNullAndEmptyArrays: true // Optional: if no subscription data exists, keep the document
                    }
                },
                {
                    $match: matchQuery // Apply any filtering
                },
                {
                    $group: {
                        _id: null, // Group everything together, or you can group by some other field if needed
                        count: { $sum: 1 }
                    }
                }
            ];

            const [users, count] = await Promise.all([
                db.User.aggregate(pipeline),
                db.User.aggregate(countPipeline)
            ]);
            const totalUsers = count.length > 0 ? count[0].count : 0;
            const totalPages = Math.ceil(totalUsers / limit);
            const responseData = {
                count: totalUsers,
                currentPage: page,
                users: users,
                totalPages: totalPages
            };
            callback({ message: "Documents retrieved", data: responseData, error: null, status: 200 });
        } catch (err) {
            console.error(err);
            callback({ message: "Internal server error", data: null, error: err, status: 500 });
        }
    },
    getUserById: async (req: Request, callback: Function) => {
        try {
            const id = req.params.id
            const user = await db.User.findById(id).lean()
            if (user) {
                const subscription = await db.UserSubscription.findOne({ user_id: user._id }).lean()
                const data = { ...user, subscription }
                // delete user.password;
                callback({ message: "User detail", data: data, status: 200 });
            } else {
                callback({ message: "User Not found", data: null, status: 404 });
            }
        } catch (err) {
            console.error(err);
            callback({ message: "Internal server error", data: null, error: err, status: 500 });
        }
    },
    updateUser: async (req: Request, callback: Function) => {
        try {
            const userId = req.params.userId; //This is contractor user id 
            const data = req.body;
            const user = await db.User.findOne({ _id: userId, isDeleted: false });
            if (!user) {
                return callback({ message: "Contractor not found", data: null, status: 404 });
            }
            let userBody: any = {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                status: req.body.status || constants.STATUS.ACTIVE,
            }
            const contractorBody: any = {
                subscription_type: data.subscription_type,
                sub_domain: data.sub_domain,
                contract_type: data.contract_type,
            };

            const existingUserWithEmail = await db.User.findOne({ _id: { $ne: new mongoose.Types.ObjectId(userId) }, email: userBody.email, scope: constants.SCOPE.CUSTOMER });

            if (existingUserWithEmail) {
                return callback({ message: "Email already exists", data: null, status: 409 });
            }
            if (data.password) {
                const hashedPassword = await bcrypt.hash(data.password, 10);
                contractorBody.password = hashedPassword;
            }
            await db.User.findByIdAndUpdate(userId, userBody);
            // await db.UserSubscription.findByIdAndUpdate(user?._id, contractorBody);

            callback({ message: "User updated successfully", data: null, status: 200 });
        } catch (err) {
            console.error(err);
            callback({ message: "Internal server error", data: null, error: err, status: 500 });
        }
    },
    deleteUser: async (req: Request, callback: Function) => {
        try {
            const id = req.params.id;

            const user = await db.User.findOne({ _id: id });

            await Promise.all([
                db.AccessToken.deleteMany({ user_id: user?._id }),
                db.User.deleteMany({ _id: user?._id }),
            ]);
            callback({ message: "User deleted successfully", status: 200 });
        } catch (err) {
            console.error(err);
            callback({ message: "Internal server error", data: null, error: err, status: 500 });
        }
    },


    getSubscriptions: async (req: Request, callback: Function) => {
        try {
            const id = req.params.id
            const Subscription = await db.Subscription.find({}).lean()
            callback({ message: "Subscriptions", data: Subscription, status: 200 });
        } catch (err) {
            console.error(err);
            callback({ message: "Internal server error", data: null, error: err, status: 500 });
        }
    },
    getDashboard: async (req: Request, callback: Function) => {
        try {
            // Get the current date and the start of the current month
            const startOfMonth = moment().startOf('month').toDate();
            const endOfMonth = moment().endOf('month').toDate();
    
            // Total number of users
            const totalUsers = await db.User.countDocuments({ scope:constants.SCOPE.CUSTOMER});
    
            // Total number of users registered this month
            const usersRegisteredThisMonth = await db.User.countDocuments({
                createdAt: { $gte: startOfMonth },
                scope:constants.SCOPE.CUSTOMER
            });
    
            // Users whose subscriptions are expiring this month
            const usersExpiringThisMonth = await db.UserSubscription.aggregate([
                {
                    $match: {
                        end_date: {
                            $gte: startOfMonth,
                            $lte: endOfMonth,
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'users', // The User collection
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'user_info',
                    },
                },
                {
                    $unwind: '$user_info',
                },
                {
                    $project: {
                        'user_info.first_name': 1,
                        'user_info.last_name': 1,
                        'user_info.email': 1,
                        'user_info.phone': 1,
                        'user_info.dob': 1,
                        'user_info.address': 1,
                        'user_info.gender': 1,
                        subscription_end_date: '$end_date',
                    },
                },
            ]);
    
            // Callback with data
            callback({
                message: "",
                data: {
                    totalUsers,
                    usersRegisteredThisMonth,
                    usersExpiringThisMonth,
                },
                status: 200,
            });
        } catch (err) {
            console.error(err);
            callback({
                message: "Internal server error",
                data: null,
                error: err,
                status: 500,
            });
        }
    },
}
