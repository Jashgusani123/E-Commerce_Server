import express from "express";
import { applyDiscount, createCoupon, createPaymentIntent, deleteCoupon, getAllCoupons } from "../Controllers/PaymentControll.js";
import { adminOnly } from "../Middlewares/Auth.js";

const app = express.Router();


app.post("/create" ,createPaymentIntent)
app.get("/discount" , applyDiscount)
app.post("/coupon/new" , adminOnly , createCoupon)
app.get("/coupon/all" , adminOnly , getAllCoupons)
app.delete("/coupon/:code" , adminOnly , deleteCoupon)

export default app;