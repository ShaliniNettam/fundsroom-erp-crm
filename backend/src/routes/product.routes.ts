import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  getCategories,
} from '../controllers/product.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getProducts);
router.get('/categories', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getCategories);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getProductById);

router.post('/', authorizeRoles('ADMIN', 'WAREHOUSE', 'SALES'), createProduct);
router.put('/:id', authorizeRoles('ADMIN', 'WAREHOUSE', 'SALES'), updateProduct);

export default router;
