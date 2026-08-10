import { Router } from 'express';
import { getStockMovements, recordStockMovement } from '../controllers/stock.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getStockMovements);
router.post('/', authorizeRoles('ADMIN', 'WAREHOUSE'), recordStockMovement);

export default router;
