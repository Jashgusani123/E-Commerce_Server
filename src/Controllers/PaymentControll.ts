import { cache, stripe } from "../app.js";
import { TryCatch } from "../Middlewares/error.js";
import { Coupon } from "../Models/Coupon.js";
import ErrorHandler from "../Utils/Utility-Class.js";


export const createPaymentIntent = TryCatch(async(req , res , next)=>{
    const {amount} = req.body;
    if(!amount){
        return next(new ErrorHandler("Please enter Amount" , 400))
    }
    const paymentIntent = await stripe.paymentIntents.create({amount:Number(amount)*100 , currency:"inr"})
    res.status(201).json({
        success:true,
        clientSecret:paymentIntent.client_secret
    })
})

export const createCoupon = TryCatch(async (req, res , next) => {
    const { code, amount } = req.body;

    if(!code || !amount) return next(new ErrorHandler("Please Provide Coupon Code and Amount", 400));

    await Coupon.create({ code, amount });

    res.status(201).json({ success: true, message: "Coupon Created Successfully" });
});

export const applyDiscount = TryCatch(async (req, res , next) => {
    const { code } = req.query;
    const discount = await Coupon.findOne({ code });
    if(!discount) return next(new ErrorHandler("Invalid Coupon Code", 400));

    res.status(200).json({ success: true  , discount:discount.amount});
});

export const getAllCoupons = TryCatch(async (req, res , next) => {
    if(cache.has("coupons")){   
        return res.status(200).json({ success: true , coupons:cache.get("coupons")});
    }else{
        const coupons = await Coupon.find();
        cache.set("coupons" , coupons);
        return res.status(200).json({ success: true , coupons});
    }
})

export const deleteCoupon = TryCatch(async (req, res , next) => {
    const { code } = req.params;
    const coupon = await Coupon.findOneAndDelete({code})
    if(!coupon) return next(new ErrorHandler("Coupon Not Found", 404));
    
    res.status(200).json({ success: true , message: "Coupon Deleted Successfully"});
})