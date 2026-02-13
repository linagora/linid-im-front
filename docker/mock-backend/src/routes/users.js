import { Router } from 'express';
import entities from '../data/entities.js';
import users from '../data/users.js';
import { createErrorResponse } from '../utils.js';

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
    res
      .status(404)
      .json(createErrorResponse(404, 'User not found', 'error.user_not_found'));
  }
});

router.post('', (req, res) => {
  const newUser = { ...req.body, id: String(Date.now()) };
  users.content.push(newUser);
  res.status(201).json(newUser);
});

router.post('/validate/:field', (req, res) => {
  const field = req.params.field;
  const value = req.body;

  const fieldSettings = entities
    .find((e) => e.route === 'users')
    ?.attributes.find((a) => a.name === field);

  for (const [setting, settingValue] of Object.entries(
    fieldSettings.inputSettings
  )) {
    switch (setting) {
      case 'maxLength':
        if (value.length > settingValue) {
          return res
            .status(400)
            .json(
              createErrorResponse(
                400,
                'Invalid field value',
                'error.entity.attributes'
              )
            );
        }
        break;
      case 'pattern':
        if (!new RegExp(settingValue).test(value)) {
          return res
            .status(400)
            .json(
              createErrorResponse(
                400,
                'Invalid field value',
                'error.entity.attributes'
              )
            );
        }
        break;
      case 'values':
        if (!settingValue.includes(value)) {
          return res
            .status(400)
            .json(
              createErrorResponse(
                400,
                'Invalid field value',
                'error.entity.attributes'
              )
            );
        }
        break;
      default:
        break;
    }
  }

  res.status(204).send();
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
    res
      .status(404)
      .json(createErrorResponse(404, 'User not found', 'error.user_not_found'));
  }
});

export default router;
