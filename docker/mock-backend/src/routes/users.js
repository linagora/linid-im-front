import { Router } from 'express';
import users from '../data/users.js';

const router = Router();

router.get('', (_req, res) => {
  res.status(200).json(users);
});

router.get('/:id', (req, res) => {
  const userId = req.params.id;
  const user = users.content.find((u) => u.id === userId);
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

router.post('', (req, res) => {
  const newUser = req.body;
  users.content.push(newUser);
  res.status(201).json(newUser);
});

router.put('/:id', (req, res) => {
  const userId = req.params.id;
  const updatedUser = req.body;
  const index = users.content.findIndex((u) => u.id === userId);
  if (index !== -1) {
    if (updatedUser?.id === userId) {
      users.content[index] = updatedUser;
    }
    res.status(200).json(updatedUser);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

export default router;
