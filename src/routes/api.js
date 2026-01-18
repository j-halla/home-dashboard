import express from 'express';
import { lightService } from '../services/lightService.js';

const router = express.Router();

router.post('/trigger-light', async (req, res, next) => {
  try {
    const { id, on } = req.body;
    const data = await lightService.triggerLight(id, on);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
