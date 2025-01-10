import { Request } from "express";
import { TryCatch } from "../Middlewares/error.js";
import { Product } from "../Models/Products.js";
import {
  baseQuery,
  NewProductRequstBody,
  SearchQuery,
} from "../Types/types.js";
import {
  deleteFromCloudinary,
  InvalidateCache,
  uploadToCloudinary,
} from "../Utils/Features.js";
import ErrorHandler from "../Utils/Utility-Class.js";
import { cache } from "../app.js";

export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequstBody>, res) => {
    const { name, price, stock, category } = req.body;

    if (!req.file?.buffer) throw new ErrorHandler("No Photo Found", 400);

    if (!name || !price || !stock || !category)
      throw new ErrorHandler("All Fields Are Required", 400);

    const photo = await uploadToCloudinary(req.file?.buffer);

    const product = await Product.create({
      name,
      price,
      stock,
      photo: photo,
      category: category.toLowerCase(),
    });
    InvalidateCache({ products: true, admin: true });
    res.status(201).json({
      success: true,
      message: "Product Created Successfully",
    });
  }
);

export const getLatestProducts = TryCatch(async (req, res) => {
  let products;
  if (cache.has("latestProducts")) {
    products = JSON.parse(cache.get("latestProducts") as string);
  } else {
    products = await Product.find().sort({ createdAt: -1 }).limit(5);
    cache.set("latestProducts", JSON.stringify(products));
  }

  res.status(200).json({
    success: true,
    products,
  });
});

export const getCategories = TryCatch(async (req, res) => {
  let categories;
  if (cache.has("categories")) {
    categories = JSON.parse(cache.get("categories") as string);
  } else {
    categories = await Product.distinct("category");
    cache.set("categories", JSON.stringify(categories));
  }
  res.status(200).json({
    success: true,
    categories,
  });
});

export const getAdminProducts = TryCatch(async (req, res) => {
  let products;
  if (cache.has("adminProducts")) {
    products = JSON.parse(cache.get("adminProducts") as string);
  } else {
    products = await Product.find();
    cache.set("adminProducts", JSON.stringify(products));
  }

  res.status(200).json({
    success: true,
    products,
  });
});

export const getSingleProduct = TryCatch(async (req, res) => {
  const { id } = req.params;
  let product;
  if (cache.has(`singleProduct-${id}`)) {
    product = JSON.parse(cache.get(`singleProduct-${id}`) as string);
  } else {
    product = await Product.findById(id);
    cache.set(`singleProduct-${id}`, JSON.stringify(product));
  }
  if (!product) throw new ErrorHandler("Product Not Found", 404);
  res.status(200).json({
    success: true,
    product,
  });
});

export const updateProduct = TryCatch(async (req, res) => {
  const { id } = req.params;
  const { name, price, stock, category } = req.body;
  const product = await Product.findById(id);
  if (!product) throw new ErrorHandler("Product Not Found", 404);

  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category;
  if (product.photo && req.file?.buffer) {
    const publicId = product.photo.split("/").pop()?.split(".")[0];
    if (!publicId) throw new ErrorHandler("Invalid photo URL", 400);
    await deleteFromCloudinary(publicId);
    const photo = await uploadToCloudinary(req.file.buffer);
    product.photo = photo;
  }
  await product.save();
  InvalidateCache({
    products: true,
    admin: true,
    productId: product._id.toString(),
  });
  res.status(201).json({
    success: true,
    message: "Product Updated Successfully",
  });
});

export const deleteProduct = TryCatch(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ErrorHandler("Product Not Found", 404);
  const publicId = product.photo.split("/").pop()?.split(".")[0];
  if (!publicId) throw new ErrorHandler("Invalid photo URL", 400);
  await deleteFromCloudinary(publicId);
  await product.deleteOne();
  InvalidateCache({
    products: true,
    admin: true,
    productId: product._id.toString(),
  });
  res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});

export const getSearchProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchQuery>, res) => {
    const { search, price, category, sort } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE_LIMIT) || 8;
    const skip = (page - 1) * limit;

    const baseQuery: baseQuery = {};

    // Search by name (case-insensitive)
    if (search) {
      baseQuery.name = { $regex: search, $options: "i" };
    }

    // Price filter
    if (price) {
      const priceValue = Number(price);
      baseQuery.price = { $lte: priceValue };
    }

    // Category filter
    if (category) {
      baseQuery.category = category;
    }

    console.log("Query Filters:", baseQuery);

    // Fetch filtered products and total count
    const [products, allProducts] = await Promise.all([
      Product.find(baseQuery)
        .sort(sort ? { price: sort === "asc" ? 1 : -1 } : undefined)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(baseQuery),
    ]);

    const totalPage = Math.ceil(allProducts / limit);

    // Response
    res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

export const getRange = TryCatch(async(req , res , next)=>{
  let products =[] ;
  const key = "HighestPrice";

  if(cache.has(key)){
    products = JSON.parse(cache.get(key) as string);
  }else{
    const allProducts = await Product.find({})
  
    const highestPriceProduct = allProducts.reduce((max, product) => {
      return product.price > max.price ? product : max;
    }, allProducts[0]);
    cache.set(key, JSON.stringify(highestPriceProduct));
  
  }
  res.status(200).json({
    success: true,
    products,
  });
});