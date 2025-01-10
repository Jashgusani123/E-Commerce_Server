import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import { cache } from "../app.js";
import { Product } from "../Models/Products.js";
import { InvalidateCacheType, MyDocument, orderItemType } from "../Types/types.js";

dotenv.config();

export const ConnectDB = async (url:string) => {
  try {
    await mongoose.connect(url, {
      dbName: "E-Commerce",
    });
    console.log(`DB Connected to ${mongoose.connection.host}`);
  } catch (error) {
    console.log(error);
  }
};

const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (buffer: Buffer) => {
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "E-Commerce_Images" }, (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      })
      .end(buffer);
  });
};

export const deleteFromCloudinary = (url: string) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(`E-Commerce_Images/${url}`, (error, result) => {
      if (error || !result)
        return reject(error || new Error("Resource not found"));
      resolve(result);
    });
  });
};

export const InvalidateCache = ({
  products,
  orders,
  admin,
  userId,
  orderId,
  productId
}: InvalidateCacheType) => {
  if (products) {
    const productsKeys: string[] = [
      "latestProducts",
      "categories",
      "adminProducts",
      `singleProduct-${productId}`
    ];
    if(typeof productId === "string"){
      productsKeys.push(`singleProduct-${productId}`);
    }
    if(typeof productId === "object"){
      productId?.forEach((i)=>productsKeys.push(`singleProduct-${i}`))
    }
    cache.del(productsKeys);
  }
  if (orders) {
    const ordersKeys:string[] = ["allOrders",`myOrders-${userId}`,`singleOrder-${orderId}`];
    cache.del(ordersKeys);
  }
  if (admin) {
    cache.del(["stats","pieChart","barChart","lineChart"])
  }
};

export const reduceStock = async(orderItems:orderItemType[]) => {
  for( let i = 0 ; i < orderItems.length ; i++){
    const order = orderItems[i];
    const product = await Product.findById(order.productId);
    if(!product){
      throw new Error("Product not found");
    }
    product.stock -= order.quantity;
    await product.save();
  }
}

export const calculatePercentage = (thisMonth:number, lastMonth:number) => {
  
  if(lastMonth === 0) return thisMonth*100;
  const percentage = (thisMonth  / lastMonth) * 100;
  return percentage;
}

export const getInventory = async({categories,productCount}:{categories:string[] , productCount:number}) => {
  
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category: category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, index) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[index] / productCount) * 100),
    });
  });
  return categoryCount;
}

export const getDiffreationDate = ({length,docArr,today,property}:{length:number , docArr:MyDocument[] ,today:Date , property?:"discount"|"totalAmount"})=>{
  const Data:number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < 6) {
      Data[length - monthDiff - 1]+=property?i[property]!:1;
    }
  });

  return Data;

}