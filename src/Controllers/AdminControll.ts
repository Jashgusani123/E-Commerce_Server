import { TryCatch } from "../Middlewares/error.js";
import { Order } from "../Models/Order.js";
import { Product } from "../Models/Products.js";
import { User } from "../Models/user.js";
import { MyDocument } from "../Types/types.js";
import {
  calculatePercentage,
  getDiffreationDate,
  getInventory,
} from "../Utils/Features.js";

export const getDashboardStats = TryCatch(async (req, res, next) => {
  let stats = {};

  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const thisMonth = {
    start: new Date(today.getFullYear(), today.getMonth(), 1),
    end: today,
  };
  const lastMonth = {
    start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
    end: new Date(today.getFullYear(), today.getMonth(), 0),
  };

  const thisMonthProductPromise = Product.find({
    createdAt: { $gte: thisMonth.start, $lt: thisMonth.end },
  });
  const lastMonthProductPromise = Product.find({
    createdAt: { $gte: lastMonth.start, $lt: lastMonth.end },
  });

  const thisMonthUserPromise = User.find({
    createdAt: { $gte: thisMonth.start, $lt: thisMonth.end },
  });
  const lastMonthUserPromise = User.find({
    createdAt: { $gte: lastMonth.start, $lt: lastMonth.end },
  });

  const thisMonthOrderPromise = Order.find({
    createdAt: { $gte: thisMonth.start, $lt: thisMonth.end },
  });
  const lastMonthOrderPromise = Order.find({
    createdAt: { $gte: lastMonth.start, $lt: lastMonth.end },
  });
  const lastSixMonthOrderPromise = Order.find({
    createdAt: { $gte: sixMonthsAgo, $lt: today },
  });

  const latestTransactionPromise = Order.find({})
    .select(["totalAmount", "orderItems", "status", "discount"])
    .limit(4);

  const [
    thisMonthProduct,
    lastMonthProduct,
    thisMonthUser,
    lastMonthUser,
    thisMonthOrder,
    lastMonthOrder,
    productCount,
    userCount,
    allOrders,
    lastSixMonthOrder,
    categories,
    femaleUsersCount,
    latestTransaction,
  ] = await Promise.all([
    thisMonthProductPromise,
    lastMonthProductPromise,
    thisMonthUserPromise,
    lastMonthUserPromise,
    thisMonthOrderPromise,
    lastMonthOrderPromise,
    Product.countDocuments(),
    User.countDocuments(),
    Order.find({}).select("totalAmount"),
    lastSixMonthOrderPromise,
    Product.distinct("category"),
    User.countDocuments({ gender: "female" }),
    latestTransactionPromise,
  ]);

  const userPercentage = calculatePercentage(
    thisMonthUser.length,
    lastMonthUser.length
  );
  const productPercentage = calculatePercentage(
    thisMonthProduct.length,
    lastMonthProduct.length
  );

  const orderPercentage = calculatePercentage(
    thisMonthOrder.length,
    lastMonthOrder.length
  );
  const thisMonthRevenue = thisMonthOrder.reduce(
    (total, order) => total + (order.totalAmount || 0),
    0
  );
  const lastMonthRevenue = lastMonthOrder.reduce(
    (total, order) => total + (order.totalAmount || 0),
    0
  );

  const revenuePercentage = calculatePercentage(
    thisMonthRevenue,
    lastMonthRevenue
  );

  const Revenue = allOrders.reduce(
    (total, order) => total + (order.totalAmount || 0),
    0
  );

  const Percentage = {
    user: userPercentage,
    product: productPercentage,
    order: orderPercentage,
    revenue: revenuePercentage,
  };

  const count = {
    revenue: Revenue,
    user: userCount,
    product: productCount,
    order: allOrders.length,
  };
  const OrderMonthConts = new Array(6).fill(0);
  const OrderMonthRevenue = new Array(6).fill(0);

  lastSixMonthOrder.forEach((order) => {
    const creationDate = order.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < 6) {
      OrderMonthConts[6 - monthDiff - 1] += 1;
      OrderMonthRevenue[6 - monthDiff - 1] += order.totalAmount;
    }
  });

  const categoryCount = await getInventory({ categories, productCount });

  const userRatio = {
    male: userCount - femaleUsersCount,
    female: femaleUsersCount,
  };
  const ModifyLatestTransaction = latestTransaction.map((i) => ({
    _id: i._id,
    discount: i.discount,
    amount: i.totalAmount,
    quantity: i.orderItems.length,
    status: i.status,
  }));

  stats = {
    Percentage,
    count,
    chart: {
      order: OrderMonthConts,
      revenue: OrderMonthRevenue,
    },
    categoryCount,
    userRatio,
    ModifyLatestTransaction,
  };

  return res.status(200).json({ success: true, stats });
});

export const getPieChart = TryCatch(async (req, res, next) => {
  let pieChart;

  const allOrdersPromise = Order.find({}).select([
    "totalAmount",
    "discount",
    "subTotal",
    "tax",
    "shippingCharges",
  ]);

  const [
    processing,
    shipped,
    delivered,
    categories,
    productCount,
    productOutOfStock,
    allOrders,
    allUsers,
    adminUsers,
    userUsers,
  ] = await Promise.all([
    Order.countDocuments({ status: "Processing" }),
    Order.countDocuments({ status: "Shipped" }),
    Order.countDocuments({ status: "Delivered" }),
    Product.distinct("category"),
    Product.countDocuments(),
    Product.countDocuments({ stock: 0 }),
    allOrdersPromise,
    User.find({}).select(["role", "dob"]),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ role: "user" }),
  ]);
  const orderFullFillment = {
    processing,
    shipped,
    delivered,
  };

  const ProductCategory = await getInventory({ categories, productCount });

  const stockAvailablity = {
    inStock: productCount - productOutOfStock,
    outOfStock: productOutOfStock,
  };

  const grossIncome = allOrders.reduce(
    (total, order) => total + (order.totalAmount || 0),
    0
  );

  const discount = allOrders.reduce(
    (total, order) => total + (order.discount || 0),
    0
  );
  const productionCost = allOrders.reduce(
    (total, order) => total + (order.shippingCharges || 0),
    0
  );
  const burnt = allOrders.reduce((total, order) => total + (order.tax || 0), 0);
  const marketingCost = Math.round(grossIncome * (30 / 100));

  const netMargin =
    grossIncome - discount - productionCost - burnt - marketingCost;
  const revenueDistribution = {
    netMargin: netMargin,
    discount: discount,
    productionCost: productionCost,
    burnt: burnt,
    marketingCost: marketingCost,
  };
  const adminCoustmoers = {
    admin: adminUsers,
    coustmoers: userUsers,
  };

  const userAgesGroup = {
    teen: allUsers.filter((i) => i.age < 20).length,
    adult: allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
    old: allUsers.filter((i) => i.age >= 40).length,
  };
  pieChart = {
    orderFullFillment,
    ProductCategory,
    stockAvailablity,
    revenueDistribution,
    userAgesGroup,
    adminCoustmoers,
  };
  return res.status(200).json({ success: true, pieChart });
});

export const getBarChart = TryCatch(async (req, res, next) => {
  let barChart;

  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const lastsixMonthUserPromise = User.find({
    createdAt: { $gte: sixMonthsAgo, $lt: today },
  }).select("createdAt");
  const lastsixMonthProductsPromise = Product.find({
    createdAt: { $gte: sixMonthsAgo, $lt: today },
  }).select("createdAt");
  const lastTwelveMonthOrdersPromise = Order.find({
    createdAt: { $gte: twelveMonthsAgo, $lt: today },
  }).select("createdAt");

  const [LSMUsers, LSMProducts, LTMOrders] = await Promise.all([
    lastsixMonthUserPromise,
    lastsixMonthProductsPromise,
    lastTwelveMonthOrdersPromise,
  ]);

  const productsMonths = getDiffreationDate({
    length: 6,
    today,
    docArr: LSMProducts,
  });
  const usersMonths = getDiffreationDate({
    length: 6,
    today,
    docArr: LSMUsers,
  });
  const ordersMonths = getDiffreationDate({
    length: 12,
    today,
    docArr: LTMOrders as MyDocument[],
  });

  barChart = {
    users: usersMonths,
    products: productsMonths,
    orders: ordersMonths,
  };

  return res.status(200).json({ success: true, barChart });
});

export const getLineChart = TryCatch(async (req, res, next) => {
  let lineChart;

  const today = new Date();

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const baseQuery = {
    createdAt: { $gte: twelveMonthsAgo, $lt: today },
  };

  const [LSMUsers, LSMProducts, LTMOrders] = await Promise.all([
    User.find(baseQuery).select("createdAt"),
    Product.find(baseQuery).select("createdAt"),
    Order.find(baseQuery).select(["createdAt", "discount", "totalAmount"]),
  ]);

  const productsMonths = getDiffreationDate({
    length: 12,
    today,
    docArr: LSMProducts,
  });
  const usersMonths = getDiffreationDate({
    length: 12,
    today,
    docArr: LSMUsers,
  });
  const discount = getDiffreationDate({
    length: 12,
    today,
    docArr: LTMOrders as MyDocument[],
    property: "discount",
  });

  const revenue = getDiffreationDate({
    length: 12,
    today,
    docArr: LTMOrders as MyDocument[],
    property: "totalAmount",
  });
  lineChart = {
    users: usersMonths,
    products: productsMonths,
    discount,
    revenue,
  };

  return res.status(200).json({ success: true, lineChart });
});
