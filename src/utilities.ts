import { pool } from "./dbconnection";

export const checkStore = async(storeId:number) =>{

    try {
        const query = `SELECT COUNT(*) FROM storefronts where store_id = $1`;
        const result = await pool.query(query, [storeId]);
        if(parseInt(result.rows[0].count) === 0){
            throw new Error('Store not found')
        }
    } catch (error) {
        console.error(error);;
        throw new Error('Error checking store');
    }
}


export const checkProduct = async(productId:number) =>{
    try {
        const query = `SELECT COUNT(*) FROM products WHERE product_id = $1`;
        const result = await pool.query(query, [productId]);
        if(parseInt(result.rows[0].count) === 0){
            throw new Error('Product not found')
        }
    } catch (error) {
        console.error(error);
        throw new Error('Error checking product');
    }
}

