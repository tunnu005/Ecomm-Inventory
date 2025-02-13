import { Router } from "express";
import { add_stock, check_stock, create_product, delete_Product, GetProduct_ById, reduce_stock, update_product } from "./controller";

const router:Router = Router()

router.post('createproduct',create_product)

router.put('updateproduct/:productId',update_product)

router.delete('/deleteproduct/:productId',delete_Product)

router.get('/getproduct/:productId',GetProduct_ById)

router.post('/checkout/:productId',check_stock)

router.post('/addstock/:productId',add_stock)

router.post('/deletestock/:productId',reduce_stock)


export default router;