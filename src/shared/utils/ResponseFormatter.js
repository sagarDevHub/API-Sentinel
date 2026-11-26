class ResponseFormatter {
  static success(data = null, message = 'Success', statusCode = 200) {
    return {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message = 'Internal Server Error', statusCode = 500, errors = null) {
    return {
      success: false,
      statusCode,
      message,
      ...(errors !== null && { errors }),
      timestamp: new Date().toISOString(),
    };
  }

  static validationError(errors = [], message = 'Validation failed') {
    return {
      success: false,
      statusCode: 400,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated(data = [], page = 1, limit = 10, total = 0, message = 'Success') {
    const safeLimit = Math.max(1, Number(limit) || 10);
    const safePage = Math.max(1, Number(page) || 1);
    const safeTotal = Math.max(0, Number(total) || 0);
    const totalPages = Math.ceil(safeTotal / safeLimit);

    return {
      success: true,
      statusCode: 200,
      message,
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: safeTotal,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export default ResponseFormatter;
