import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addCustomerNote,
} from '../controllers/customer.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { Role } from '../types/db.js';

const router = Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'), getCustomers);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'), getCustomerById);

router.post('/', authorizeRoles('ADMIN', 'SALES'), createCustomer);
router.put('/:id', authorizeRoles('ADMIN', 'SALES'), updateCustomer);
router.post('/:id/notes', authorizeRoles('ADMIN', 'SALES'), addCustomerNote);

export default router;
