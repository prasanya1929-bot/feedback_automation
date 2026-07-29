import { Router } from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import { getFaculties, getFeedbackAnalytics, getResponses } from '../controllers/adminController.js'
import statusRoutes from './statusRoutes.js'

const router = Router()

// Every admin route requires a valid JWT with role === 'admin'
router.use(verifyToken)
router.use((req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' })
  }
  next()
})

// GET /admin/faculties?year=&branch=&section=
router.get('/faculties', getFaculties)

// GET /admin/analytics?year=&branch=&section=&subject=&faculty=
router.get('/analytics', getFeedbackAnalytics)

// GET /admin/responses?year=&branch=&section=&subject=&faculty=
router.get('/responses', getResponses)

// GET /admin/status   POST /admin/status
router.use('/status', statusRoutes)

export default router
