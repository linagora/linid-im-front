/**
 * Todo item representation
 */
export interface Todo {
  id: number;
  content: string;
}

/**
 * Meta information for paginated responses
 */
export interface Meta {
  totalCount: number;
}
