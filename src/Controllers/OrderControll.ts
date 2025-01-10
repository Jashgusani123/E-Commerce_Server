import { Request } from "express";
import { TryCatch } from "../Middlewares/error.js";
import { NewOrderRequestBody } from "../Types/types.js";
import { Order } from "../Models/Order.js";
import { InvalidateCache, reduceStock } from "../Utils/Features.js";
import ErrorHandler from "../Utils/Utility-Class.js";
import { cache } from "../app.js";

export const newOrder = TryCatch(
  async (req: Request<{}, {}, NewOrderRequestBody>, res, next) => {
    const {
      shippingInfo,
      orderItems,
      user,
      subTotal,
      tax,
      shippingCharges,
      discount,
      totalAmount,
    } = req.body;

    if (
      !shippingInfo ||
      !orderItems ||
      !user ||
      !subTotal ||
      !tax ||
      !totalAmount
    ) {
      return next(new ErrorHandler("Enter all the fields", 400));
    }

    const order = await Order.create({
      orderItems,
      shippingInfo,
      tax,
      subTotal,
      shippingCharges,
      discount,
      totalAmount,
      user,
    });

    await reduceStock(orderItems);

    InvalidateCache({
      products: true,
      orders: true,
      admin: true,
      userId: user,
      productId: order.orderItems.map((i) => String(i.productId)),
    });

    return res.status(201).json({
      success: true,
      message: "Order Placed Successfully",
    });
  }
);

export const getMyOrders = TryCatch(async (req, res, next) => {
  const { id } = req.query;
  const key = `myOrders-${id}`;
  let Orders = [];

  if (cache.has(key)) Orders = JSON.parse(cache.get(key) as string);
  else {
    Orders = await Order.find({ user: id });
    cache.set(key, JSON.stringify(Orders));
  }

  return res.status(200).json({
    success: true,
    Orders,
  });
});

export const getAllOrders = TryCatch(async (req, res, next) => {
  const key = `allOrders`;
  let Orders = [];

  if (cache.has(key)) Orders = JSON.parse(cache.get(key) as string);
  else {
    Orders = await Order.find().populate("user", "name");
    cache.set(key, JSON.stringify(Orders));
  }
  return res.status(200).json({
    success: true,
    Orders,
  });
});

export const getSingleOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const key = `singleOrder-${id}`;
  let Orders;

  if (cache.has(key)) Orders = JSON.parse(cache.get(key) as string);
  else {
    Orders = await Order.findById(id).populate("user", "name");
    if (!Orders) return next(new ErrorHandler("Order not found", 404));
    cache.set(key, JSON.stringify(Orders));
  }
  console.log(Orders);
  
  return res.status(200).json({
    success: true,
    Orders,
  });
});

export const processOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) return next(new ErrorHandler("Order not found", 404));

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }

  await order.save();

  InvalidateCache({
    orders: true,
    admin: true,
    userId: order.user,
    orderId: order._id.toString(),
  });

  return res.status(200).json({
    success: true,
    message: "Order Processed Successfully",
  });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) return next(new ErrorHandler("Order not found", 404));
  await order.deleteOne();
  InvalidateCache({
    orders: true,
    admin: true,
    userId: order.user,
    orderId: order._id.toString(),
  });
  res.status(200).json({
    success: true,
    message: "Order Deleted Successfully",
  });
});
