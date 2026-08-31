import { Router, Request, Response } from 'express';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Simple static login
  const token = process.env.AUTH_TOKEN || 'mock-jwt-token-12345';
  return res.json({
    token,
    user: {
      username: username || 'admin',
      role: 'Procurement Specialist',
    },
  });
});

export default router;
