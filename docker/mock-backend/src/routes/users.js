import { Router } from 'express';
import users from '../data/users.js';

const router = Router();

router.get('', (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { page = 0, size = 10, sort, direction, ...filters } = req.query;

  // Filter users based on query params (case-insensitive partial match)
  let filteredContent = users.content.filter((user) => {
    return Object.entries(filters)
      .filter(([_, value]) => value && value !== '')
      .every(
        ([key, value]) =>
          user[key] != null &&
          String(user[key]).toLowerCase().includes(String(value).toLowerCase())
      );
  });

  // Pagination
  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(size, 10);
  const totalElements = filteredContent.length;
  const totalPages = Math.ceil(totalElements / pageSize);
  const start = pageNumber * pageSize;
  const end = start + pageSize;
  const paginatedContent = filteredContent.slice(start, end);

  res.status(200).json({
    content: paginatedContent,
    pageable: {
      sort: { sorted: false, unsorted: true, empty: true },
      pageNumber,
      pageSize,
      offset: start,
      paged: true,
      unpaged: false,
    },
    totalElements,
    totalPages,
    last: pageNumber >= totalPages - 1,
    first: pageNumber === 0,
    numberOfElements: paginatedContent.length,
    sort: { sorted: false, unsorted: true, empty: true },
    size: pageSize,
    number: pageNumber,
    empty: paginatedContent.length === 0,
  });
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
  const newUser = { ...req.body, id: String(Date.now()) };
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
