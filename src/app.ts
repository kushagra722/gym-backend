import * as dotenv from 'dotenv';
dotenv.config({});
import express, { Request, Response } from "express";
import mongoose from 'mongoose';
import routes from './routes/index'
import morgan from 'morgan';
import cors from 'cors'
import "./connection";

const app: any = express();
const router = express.Router();
const port = process.env.PORT

declare global {
  namespace Express {
    interface Request {
      user: {
        _id: mongoose.Schema.Types.ObjectId,
        scope: string | never,
        email: string,
        role: string
      }
      subdomain: string;
    }
  }
}
app.use(morgan('dev'))
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

routes(router)
app.use(router);
app.listen(port, () => {
  console.log("Server started at ", port);
  console.log(`Connected to ${process.env.ENVIRONMENT} database`, port);
});

export default app