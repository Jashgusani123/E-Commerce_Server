import { NextFunction, Request, Response } from "express";
import { Document } from "mongoose";

export interface NewUserRequstBody {
  _id: string;
  name: string;
  email: string;
  photo: string;
  gender: string;
  dob: Date;
}

export interface NewProductRequstBody {
  name: string;
  price: number;
  stock: number;
  category: string;
}


export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export type SearchQuery = {
  search?: string;
  price?: number;
  category?: string;
  sort?: string;
  page?: number;
}

interface PriceQueryType {
  $lte?: number;
  $gte?: number;
}

export interface baseQuery {
  name?: { $regex: string; $options: string };
  price?: PriceQueryType;
  category?: string;
}

export type InvalidateCacheType = {
  products?:boolean;
  orders?:boolean;
  admin?:boolean;
  userId?:string;
  orderId?:string;
  productId?:string | string[];
}

export type orderItemType = {
  name:string,
  photo:string,
  price:number,
  quantity:number,
  productId:string
}
export type shippingInfoType = {
  address:string,
  city:string,
  state:string,
  country:string,
  pinCode:number
}
export interface NewOrderRequestBody {
  shippingInfo:shippingInfoType,
  user:string,
  subTotal:number,
  tax:number,
  shippingCharges:number,
  discount:number,
  totalAmount:number,
  orderItems:orderItemType[]
}

export interface MyDocument extends Document{
  createdAt:Date | NativeDate,
  discount?:number,
  totalAmount?:number
}
