import express from "express";
import { newProduct , getLatestProducts, getCategories, getAdminProducts, getSingleProduct, updateProduct, deleteProduct, getSearchProducts, getRange } from "../Controllers/ProductControll.js";
import { upload } from "../Utils/Features.js";
import { adminOnly } from "../Middlewares/Auth.js";
const app = express.Router();

app.post("/new" , adminOnly , upload.single("photo") , newProduct)
app.get("/search" , getSearchProducts)
app.get("/latest" , getLatestProducts)
app.get("/categories" , getCategories)
app.get("/range" , getRange)
app.get("/admin-products"  , adminOnly , getAdminProducts)
app.route("/:id").get(getSingleProduct).put( adminOnly , upload.single("photo") , updateProduct).delete( adminOnly , deleteProduct)
export default app;