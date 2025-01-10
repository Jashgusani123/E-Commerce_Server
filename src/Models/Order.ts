import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    shippingInfo: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      pinCode: {
        type: Number,
        required: true,
      },
    },
    user: {
      type: String,
      ref: "User",
      required: true,
    },
    subTotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    shippingCharges: {
      type: Number,
      default:0
    },
    discount: {
      type: Number,
      default:0
    },
    totalAmount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered"],
      default: "Processing",
    },
    orderItems: [{
        name:String,
        photo:String,
        price:Number,
        quantity:Number,
        productId:{
            type:mongoose.Types.ObjectId,
            ref:"Product",
        }
    }]
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", OrderSchema);
