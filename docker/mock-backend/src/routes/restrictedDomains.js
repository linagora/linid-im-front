import { Router } from 'express';
import restrictedDomains from '../data/restrictedDomains.js';

const router = Router();

router.get('', (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { page = 0, size = 10, sort, direction, ...filters } = req.query;

  // Filter restricted domains based on query params (case-insensitive partial match)
  let filteredContent = restrictedDomains.content.filter((domain) => {
    return Object.entries(filters)
      .filter(([_, value]) => value && value !== '')
      .every(
        ([key, value]) =>
          domain[key] != null &&
          String(domain[key])
            .toLowerCase()
            .includes(String(value).toLowerCase())
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

export default router;
