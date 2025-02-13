/*
    create Product,
    update product information,
    delete product,
    get product by ID,
    check stock,
    add stock,
    reduce stock,
    
*/


interface Product{
  product_id: number,
  storeront_id: number,
  name: string,
  description: string,
  price: number,
  category_id :number,
  image: string,
}

import { pool } from "./dbconnection";
import { checkProduct, checkStore } from "./utilities";


export const CreateProduct = async (storeId: number, name: string, description: string, price: number, image: string, category_id: string) => {
  try {
    await checkStore(storeId)
    const query = `
    INSERT INTO "product"
    ("storeId", "name", "description", "price", "image", "category_id")
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
`;

    await pool.query(query, [storeId, name, description, price, image, category_id]);
  } catch (error) {
    console.error(error);
    throw new Error('Error creating product');
  }
}

export const updateProduct = async (productId: number, name: string, description: string, price: number, image: string, category_id: string) => {
  try {
    await checkProduct(productId)
    const query = `
  UPDATE "product" 
  SET "name" = $2, "description" = $3, "price" = $4, "image" = $5, "category_id" = $6
  WHERE "product_id" = $1;
`;

    await pool.query(query, [productId, name, description, price, image, category_id]);
  } catch (error) {
    console.error(error);
    throw new Error('Error updating product');
  }
}

export const deleteProduct = async (productId: number) => {
  try {
    await checkProduct(productId)
    const query = `
        DELETE FROM "product"
        WHERE "product_id" = $1;
    `;

    await pool.query(query, [productId]);
  } catch (error) {
    console.error(error);
    throw new Error('Error deleting product');
  }
}

export const GetProductById = async (productId: number):Promise<Product | null> => {
  try {
    await checkProduct(productId)
    const query = `
        SELECT * FROM "product" WHERE "product_id" = $1;
    `;

  const result = await pool.query(query, [productId]);
  return result.rows[0];
  } catch (error) {
    console.error(error);
    throw new Error('Error getting product by ID');
  }
}

export const checkStock = async (productId: number, attributes: Record<string, string>):Promise<number |  null> => {
  try {
    const attributeConditions = Object.entries(attributes)
      .map(([key, value], index) => `
          (a.name = $${index * 2 + 1} AND av.value_name = $${index * 2 + 2})
        `)
      .join(' AND ');

    const query = `
        SELECT s.quantity
        FROM stock s
        JOIN stock_attributes sa ON s.stock_id = sa.stock_id
        JOIN attributes a ON sa.attribute_id = a.attribute_id
        JOIN attribute_values av ON sa.value_id = av.value_id
        WHERE s.product_id = $1 AND ${attributeConditions}
        GROUP BY s.stock_id, s.quantity;
      `;

    const values = [productId, ...Object.entries(attributes).flat()];

    const result = await pool.query(query, values);

    return result.rows.length > 0 ? result.rows[0].quantity : 0;
  } catch (error) {
    console.error('Error checking stock:', error);
    return null;
  }

}

export const addStock = async (productId: number, attributes: Record<string, string>, quantity: number): Promise<boolean> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start transaction

    // Build query for attribute conditions
    const attributeConditions = Object.entries(attributes)
      .map(([key, value], index) => `(a.name = $${index * 2 + 2} AND av.value_name = $${index * 2 + 3})`)
      .join(' AND ');

    // Find stock entry with matching attributes
    const findStockQuery = `
      SELECT s.stock_id FROM stock s
      JOIN stock_attributes sa ON s.stock_id = sa.stock_id
      JOIN attributes a ON sa.attribute_id = a.attribute_id
      JOIN attribute_values av ON sa.value_id = av.value_id
      WHERE s.product_id = $1 AND ${attributeConditions}
      GROUP BY s.stock_id;
    `;

    const values = [productId, ...Object.entries(attributes).flat()];
    const stockResult = await client.query(findStockQuery, values);

    if (stockResult.rows.length > 0) {
      // Update existing stock
      const stockId = stockResult.rows[0].stock_id;
      await client.query(
        'UPDATE stock SET quantity = quantity + $1 WHERE stock_id = $2',
        [quantity, stockId]
      );
    } else {
      // Insert new stock entry
      const insertStockQuery = `INSERT INTO stock (product_id, quantity) VALUES ($1, $2) RETURNING stock_id;`;
      const newStock = await client.query(insertStockQuery, [productId, quantity]);
      const newStockId = newStock.rows[0].stock_id;

      // Map new stock to attributes
      for (const [key, value] of Object.entries(attributes)) {
        await client.query(`
          INSERT INTO stock_attributes (stock_id, attribute_id, value_id)
          SELECT $1, a.attribute_id, av.value_id
          FROM attributes a
          JOIN attribute_values av ON a.attribute_id = av.attribute_id
          WHERE a.name = $2 AND av.value_name = $3
        `, [newStockId, key, value]);
      }
    }

    await client.query('COMMIT'); // Commit transaction
    return true;
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback in case of error
    console.error('Error adding stock:', error);
    return false;
  } finally {
    client.release();
  }
};


export const reduceStock = async (
  productId: number,
  attributes: Record<string, string>,
  quantity: number
): Promise<boolean> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start transaction

    // Build query for attribute conditions
    const attributeConditions = Object.entries(attributes)
      .map(([key, value], index) => `(a.name = $${index * 2 + 2} AND av.value_name = $${index * 2 + 3})`)
      .join(' AND ');

    // Find stock entry
    const findStockQuery = `
        SELECT s.stock_id, s.quantity FROM stock s
        JOIN stock_attributes sa ON s.stock_id = sa.stock_id
        JOIN attributes a ON sa.attribute_id = a.attribute_id
        JOIN attribute_values av ON sa.value_id = av.value_id
        WHERE s.product_id = $1 AND ${attributeConditions}
        GROUP BY s.stock_id, s.quantity;
      `;

    const values = [productId, ...Object.entries(attributes).flat()];
    const stockResult = await client.query(findStockQuery, values);

    if (stockResult.rows.length === 0) {
      console.log('No stock found for given attributes.');
      await client.query('ROLLBACK');
      return false;
    }

    const stockId = stockResult.rows[0].stock_id;
    const currentQuantity = stockResult.rows[0].quantity;

    if (currentQuantity < quantity) {
      console.log('Not enough stock available.');
      await client.query('ROLLBACK');
      return false;
    }

    // Reduce stock quantity
    await client.query(
      'UPDATE stock SET quantity = quantity - $1 WHERE stock_id = $2',
      [quantity, stockId]
    );

    await client.query('COMMIT'); // Commit transaction
    return true;
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback in case of error
    console.error('Error reducing stock:', error);
    return false;
  } finally {
    client.release();
  }
};

