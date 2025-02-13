import { Request, Response, RequestHandler } from "express";
import { CreateProduct, deleteProduct, updateProduct,GetProductById, checkStock, addStock, reduceStock } from "./queries";


export const create_product:RequestHandler = async (req: Request, res: Response) =>{
    const { storeId, name, description, price, image, category_id } = req.body;

    try {
        // if(!storeId ||!name ||!description ||!price ||!image ||!category_id){
        //     res.status(400).json({ message:'All fields are required'})
        //     return
        // }
        await CreateProduct(storeId, name, description, price, image, category_id)
        res.status(201).json({ message:'Product created successfully'})
    }catch(error){
        console.error(error)
        res.status(500).json({message:"Error creating product"})
    }

}

export const update_product:RequestHandler = async (req: Request, res: Response)=>{
    const { name, description, price, image, category_id } = req.body;
    const productId = parseInt(req.params.productId)
    try {
       if(!name ||!description ||!price ||!image ||!category_id || !productId){
            res.status(400).json({ message:'All fields are required'})
            return
        }

        await updateProduct(productId, name, description, price, image, category_id)
        res.status(200).json({ message:'Product updated successfully'})
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Error updating product"})
        
    }
}


export const delete_Product:RequestHandler = async(req:Request,res:Response) =>{
    const productId = parseInt(req.params.productId)
    try {
        await deleteProduct(productId)
        res.status(200).json({ message:'Product deleted successfully'});
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Error deleting product"})
    }
}

export const GetProduct_ById:RequestHandler = async(req:Request,res:Response)=>{
    const productId = parseInt(req.params.productId)

    try {
        if(!productId){
            res.status(400).json({ message:'productId is required'})
            return
        }
        const product = await GetProductById(productId)
        if(!product){
            res.status(404).json({ message:'Product not found'})
            return
        }
        res.status(200).json(product)
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Error getting product by ID"})
    }
}


export const check_stock:RequestHandler = async(req:Request, res:Response)=>{
    const productId = parseInt(req.params.productId)
    const { attributes } = req.body

    try {
        const stock = await checkStock(productId, attributes);
        res.status(200).json({stock: stock})
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Error checking stock"})
    }
}

export const add_stock:RequestHandler = async(req:Request,res:Response) =>{
    const productId = parseInt(req.params.productId)
    
    const { quantity, attributes } = req.body
    try {
        const stock = await addStock(productId, quantity, attributes)
        if(stock){
            res.status(201).json({message:"stock added successfully"})  // 201 created
        }else{
            res.json({ message:'error adding stock try after sometime'})  // 404 not found  // 400 bad request  // 409 conflict  // 500 server error  // 412 precondition failed  // 413 payload too large  // 415 unsupported media type  // 429 too many requests  // 431 request header fields too large  // 451 unavailable for legal reasons  // 501 not implemented  // 503 service unavailable  // 511 network authentication required  // 400 Bad Request  // 401 Unauthorized  // 403 Forbidden  // 404 Not Found  // 405 Method Not Allowed  // 406 Not Acceptable  // 407 Proxy Authentication Required  // 408 Request Timeout  // 4
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"error adding stock"})
    }
}

export const reduce_stock:RequestHandler = async(req:Request, res:Response) =>{
    const productId = parseInt(req.params.productId)
    
    const { quantity, attributes } = req.body
    try {
        const stock = await reduceStock(productId, quantity, attributes)
        if(stock){
            res.status(200).json({message:"stock reduced successfully"}) 
        }else{
            res.json({message : "no stock found or Not enough stock available"})
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"error reduncing stock"})
    }
}


