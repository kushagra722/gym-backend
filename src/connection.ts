import mongoose from 'mongoose';
let URL: any = process.env.MONGODB_CONNECTION
let env: any = process.env.ENVIRONMENT
let password: any = process.env.ADMIN_PASSWORD
import db from './model'
import constants from './constants';
mongoose.connect(URL).then(async (connection: any) => {


  const admin = await db.User.findOne({ scope: constants.SCOPE.ADMIN });
  if (!admin) {
    await db.User.create({
      email: 'gym@admin.com',
      password: password,
      scope: '1',
    })
  }
  const subscription = await db.Subscription.findOne();
  if (!subscription) {
    await db.Subscription.insertMany([
      { 
        name: 'MONTHLY',
        price: 1500,
      },
      {
        name: 'QUATERLY',
        price: 5000,
      },
      {
        name: 'YEARLY',
        price: 8000,
      }
    ])
  }
  console.log(`${env} MongoDB connected `);
}).catch((error: any) => {
  console.log('Error connecting', error);
})
const conn = mongoose.connection;

export default conn;

