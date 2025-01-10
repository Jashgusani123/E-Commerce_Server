import express from "express";
import { newOrder , getMyOrders , getAllOrders, getSingleOrder, processOrder, deleteOrder} from "../Controllers/OrderControll.js";
import { adminOnly } from "../Middlewares/Auth.js";

const app = express.Router();

app.post("/new",newOrder)
app.get("/my" , getMyOrders)
app.get("/all" , getAllOrders)
app.route("/:id").get(getSingleOrder).put(adminOnly, processOrder).delete(adminOnly, deleteOrder)

export default app;