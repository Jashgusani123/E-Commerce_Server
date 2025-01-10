import express from "express";
import { ConnectDB } from "./Utils/Features.js";
import { errorHandler } from "./Middlewares/error.js";
import NodeCache from "node-cache";
import {config} from "dotenv"
import morgan from "morgan"
import Stripe from "stripe";
import cors from 'cors'
//Importing Routes
import UserRoute from "./Routes/UserRoute.js";
import ProductsRoute from "./Routes/ProductsRoute.js";
import OrdersRoute from "./Routes/OrdersRoute.js";
import PaymentRoute from "./Routes/PaymentRoute.js";
import AdminRoute from "./Routes/AdminRoute.js";

const app = express();

config({
  path:"./.env"
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI ||"";
const STRIPE_KEY = process.env.STRIPE_KEY ||"";


ConnectDB(MONGO_URI);

app.use(express.json());
app.use(morgan("dev"));


app.use(cors({
  origin:"https://e-commerce-client-2025-283nr2zpn-jashgusani123s-projects.vercel.app",
  credentials: true 
}))

export const stripe = new Stripe(STRIPE_KEY);
export const cache = new NodeCache();

app.get("/", (req, res)=>{
    res.send("API Working Perfectly");
})
//Using Routes
app.use("/api/v1/user", UserRoute);
app.use("/api/v1/product", ProductsRoute);
app.use("/api/v1/order", OrdersRoute);
app.use("/api/v1/payment", PaymentRoute);
app.use("/api/v1/admin/dashboard", AdminRoute);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
