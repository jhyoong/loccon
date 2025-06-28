export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class Validator {
  public static validateTag(tag: string): void {
    if (!tag || typeof tag !== 'string') {
      throw new ValidationError('Tag must be a non-empty string');
    }

    if (tag.trim() !== tag) {
      throw new ValidationError('Tag cannot have leading or trailing whitespace');
    }

    if (tag.length === 0) {
      throw new ValidationError('Tag cannot be empty');
    }

    if (tag.length > 100) {
      throw new ValidationError('Tag cannot be longer than 100 characters');
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(tag)) {
      throw new ValidationError('Tag contains invalid characters');
    }
  }

  public static validateContent(content: string): void {
    if (typeof content !== 'string') {
      throw new ValidationError('Content must be a string');
    }

    if (content.length === 0) {
      throw new ValidationError('Content cannot be empty');
    }

    // Check for reasonable size limit (1MB)
    if (content.length > 1024 * 1024) {
      throw new ValidationError('Content cannot exceed 1MB');
    }
  }

  public static validateCategories(categories: string[]): void {
    if (!Array.isArray(categories)) {
      throw new ValidationError('Categories must be an array');
    }

    for (const category of categories) {
      if (typeof category !== 'string') {
        throw new ValidationError('All categories must be strings');
      }

      if (category.trim() !== category) {
        throw new ValidationError('Categories cannot have leading or trailing whitespace');
      }

      if (category.length === 0) {
        throw new ValidationError('Categories cannot be empty strings');
      }

      if (category.length > 50) {
        throw new ValidationError('Categories cannot be longer than 50 characters');
      }
    }

    if (categories.length > 20) {
      throw new ValidationError('Cannot have more than 20 categories');
    }
  }

  public static sanitizeInput(input: string): string {
    // Remove null bytes and other control characters except newlines and tabs
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
}