import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code:{
        type:String,
        required:[true , "Please Provide Coupon Name"],
        unique:true,
    },
    amount:{
        type:Number,
        required:[true , "Please Provide Discount Amount"],
    }
});

export const Coupon = mongoose.model("Coupon", couponSchema);
