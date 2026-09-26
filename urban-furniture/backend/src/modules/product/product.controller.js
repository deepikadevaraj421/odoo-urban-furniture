const prisma = require('../../config/database');

// GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const { category, type, search } = req.query;
    const where = {};

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }
    if (type && ['GOODS', 'SERVICE', 'COMBO'].includes(type.toUpperCase())) {
      where.type = type.toUpperCase();
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const { name, type = 'GOODS', category = 'Furniture', salesPrice = 0, costPrice = 0, status = 'ACTIVE' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    const parsedSalesPrice = parseFloat(salesPrice);
    const parsedCostPrice = parseFloat(costPrice);

    if (isNaN(parsedSalesPrice) || parsedSalesPrice < 0) {
      return res.status(400).json({ success: false, message: 'Sales price must be a non-negative number.' });
    }
    if (isNaN(parsedCostPrice) || parsedCostPrice < 0) {
      return res.status(400).json({ success: false, message: 'Cost price must be a non-negative number.' });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        type: ['GOODS', 'SERVICE', 'COMBO'].includes(type) ? type : 'GOODS',
        category: category.trim(),
        salesPrice: parsedSalesPrice,
        costPrice: parsedCostPrice,
        status,
      },
    });

    res.status(201).json({ success: true, message: 'Product created successfully.', product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, category, salesPrice, costPrice, status } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (type && ['GOODS', 'SERVICE', 'COMBO'].includes(type)) updateData.type = type;
    if (category) updateData.category = category.trim();
    if (salesPrice !== undefined) {
      const sp = parseFloat(salesPrice);
      if (isNaN(sp) || sp < 0) {
        return res.status(400).json({ success: false, message: 'Sales price must be non-negative.' });
      }
      updateData.salesPrice = sp;
    }
    if (costPrice !== undefined) {
      const cp = parseFloat(costPrice);
      if (isNaN(cp) || cp < 0) {
        return res.status(400).json({ success: false, message: 'Cost price must be non-negative.' });
      }
      updateData.costPrice = cp;
    }
    if (status) updateData.status = status;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ success: true, message: 'Product updated successfully.', product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
