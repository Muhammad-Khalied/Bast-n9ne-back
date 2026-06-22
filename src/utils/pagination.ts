export const parsePagination = (page?: string, perPage?: string) => {
  const pageNumber = Math.max(parseInt(page ?? "1", 10) || 1, 1);
  const perPageNumber = Math.min(Math.max(parseInt(perPage ?? "20", 10) || 20, 1), 100);
  const skip = Math.min((pageNumber - 1) * perPageNumber, 10000);

  return { page: pageNumber, perPage: perPageNumber, skip };
};
