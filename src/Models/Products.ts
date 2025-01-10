import mongoose, { Document } from "mongoose";

const productSchema = new mongoose.Schema(
  {
    
    name: {
        type: String,
        required: [true, "Please Enter Name"],
    },
    photo:{
        type: String,
        required: [true, "Please Enter Photo"],
    },
    price:{
        type: Number,
        required: [true, "Please Enter Price"],
    },
    stock:{
        type: Number,
        required: [true, "Please Enter Stock"],
    },
    category:{
        type: String,
        trim: true,
        required: [true, "Please Enter Category"],
    },
    
  },
  {
    timestamps: true,
  }
);


export const Product = mongoose.model("Product", productSchema);
