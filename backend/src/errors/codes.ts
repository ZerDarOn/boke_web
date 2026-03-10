export enum ErrorCode {
  // 通用错误 (1000-1999)
  UNKNOWN_ERROR = 1000,
  INVALID_REQUEST = 1001,
  METHOD_NOT_ALLOWED = 1002,
  NOT_FOUND = 1003,
  INTERNAL_SERVER_ERROR = 1004,
  SERVICE_UNAVAILABLE = 1005,

  // 认证错误 (2000-2999)
  UNAUTHORIZED = 2000,
  INVALID_CREDENTIALS = 2001,
  TOKEN_EXPIRED = 2002,
  TOKEN_INVALID = 2003,
  FORBIDDEN = 2004,
  ACCOUNT_LOCKED = 2005,
  ACCOUNT_DISABLED = 2006,

  // 验证错误 (3000-3999)
  VALIDATION_ERROR = 3000,
  INVALID_EMAIL = 3001,
  INVALID_PASSWORD = 3002,
  INVALID_USERNAME = 3003,
  DUPLICATE_EMAIL = 3004,
  DUPLICATE_USERNAME = 3005,
  REQUIRED_FIELD_MISSING = 3006,
  INVALID_FORMAT = 3007,

  // 资源错误 (4000-4999)
  RESOURCE_NOT_FOUND = 4000,
  RESOURCE_ALREADY_EXISTS = 4001,
  RESOURCE_LOCKED = 4002,
  RESOURCE_DELETED = 4003,
  INSUFFICIENT_PERMISSIONS = 4004,

  // 文件错误 (5000-5999)
  FILE_TOO_LARGE = 5000,
  FILE_TYPE_NOT_ALLOWED = 5001,
  FILE_UPLOAD_FAILED = 5002,
  FILE_NOT_FOUND = 5003,
  INVALID_FILE_FORMAT = 5004,

  // 数据库错误 (6000-6999)
  DATABASE_ERROR = 6000,
  DATABASE_CONNECTION_FAILED = 6001,
  DATABASE_QUERY_FAILED = 6002,
  DATABASE_TIMEOUT = 6003,

  // 外部服务错误 (7000-7999)
  EXTERNAL_SERVICE_ERROR = 7000,
  API_RATE_LIMIT_EXCEEDED = 7001,
  EXTERNAL_SERVICE_TIMEOUT = 7002,
}

export const ErrorMessage: Record<ErrorCode, string> = {
  // 通用错误
  [ErrorCode.UNKNOWN_ERROR]: '未知错误，请稍后重试',
  [ErrorCode.INVALID_REQUEST]: '无效的请求',
  [ErrorCode.METHOD_NOT_ALLOWED]: '请求方法不允许',
  [ErrorCode.NOT_FOUND]: '请求的资源不存在',
  [ErrorCode.INTERNAL_SERVER_ERROR]: '服务器内部错误',
  [ErrorCode.SERVICE_UNAVAILABLE]: '服务暂时不可用',

  // 认证错误
  [ErrorCode.UNAUTHORIZED]: '未授权，请先登录',
  [ErrorCode.INVALID_CREDENTIALS]: '用户名或密码错误',
  [ErrorCode.TOKEN_EXPIRED]: '登录已过期，请重新登录',
  [ErrorCode.TOKEN_INVALID]: '无效的令牌',
  [ErrorCode.FORBIDDEN]: '权限不足',
  [ErrorCode.ACCOUNT_LOCKED]: '账户已锁定，请稍后再试',
  [ErrorCode.ACCOUNT_DISABLED]: '账户已被禁用',

  // 验证错误
  [ErrorCode.VALIDATION_ERROR]: '数据验证失败',
  [ErrorCode.INVALID_EMAIL]: '邮箱格式不正确',
  [ErrorCode.INVALID_PASSWORD]: '密码格式不正确',
  [ErrorCode.INVALID_USERNAME]: '用户名格式不正确',
  [ErrorCode.DUPLICATE_EMAIL]: '该邮箱已被注册',
  [ErrorCode.DUPLICATE_USERNAME]: '该用户名已被使用',
  [ErrorCode.REQUIRED_FIELD_MISSING]: '缺少必填字段',
  [ErrorCode.INVALID_FORMAT]: '数据格式不正确',

  // 资源错误
  [ErrorCode.RESOURCE_NOT_FOUND]: '资源不存在',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: '资源已存在',
  [ErrorCode.RESOURCE_LOCKED]: '资源已被锁定',
  [ErrorCode.RESOURCE_DELETED]: '资源已被删除',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: '权限不足，无法操作此资源',

  // 文件错误
  [ErrorCode.FILE_TOO_LARGE]: '文件大小超过限制',
  [ErrorCode.FILE_TYPE_NOT_ALLOWED]: '不支持的文件类型',
  [ErrorCode.FILE_UPLOAD_FAILED]: '文件上传失败',
  [ErrorCode.FILE_NOT_FOUND]: '文件不存在',
  [ErrorCode.INVALID_FILE_FORMAT]: '无效的文件格式',

  // 数据库错误
  [ErrorCode.DATABASE_ERROR]: '数据库错误',
  [ErrorCode.DATABASE_CONNECTION_FAILED]: '数据库连接失败',
  [ErrorCode.DATABASE_QUERY_FAILED]: '数据库查询失败',
  [ErrorCode.DATABASE_TIMEOUT]: '数据库操作超时',

  // 外部服务错误
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: '外部服务错误',
  [ErrorCode.API_RATE_LIMIT_EXCEEDED]: '请求过于频繁，请稍后再试',
  [ErrorCode.EXTERNAL_SERVICE_TIMEOUT]: '外部服务响应超时',
};

export const HttpStatusCode: Record<ErrorCode, number> = {
  // 通用错误
  [ErrorCode.UNKNOWN_ERROR]: 500,
  [ErrorCode.INVALID_REQUEST]: 400,
  [ErrorCode.METHOD_NOT_ALLOWED]: 405,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,

  // 认证错误
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.ACCOUNT_LOCKED]: 403,
  [ErrorCode.ACCOUNT_DISABLED]: 403,

  // 验证错误
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_EMAIL]: 400,
  [ErrorCode.INVALID_PASSWORD]: 400,
  [ErrorCode.INVALID_USERNAME]: 400,
  [ErrorCode.DUPLICATE_EMAIL]: 409,
  [ErrorCode.DUPLICATE_USERNAME]: 409,
  [ErrorCode.REQUIRED_FIELD_MISSING]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,

  // 资源错误
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [ErrorCode.RESOURCE_LOCKED]: 423,
  [ErrorCode.RESOURCE_DELETED]: 410,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,

  // 文件错误
  [ErrorCode.FILE_TOO_LARGE]: 413,
  [ErrorCode.FILE_TYPE_NOT_ALLOWED]: 415,
  [ErrorCode.FILE_UPLOAD_FAILED]: 500,
  [ErrorCode.FILE_NOT_FOUND]: 404,
  [ErrorCode.INVALID_FILE_FORMAT]: 400,

  // 数据库错误
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.DATABASE_CONNECTION_FAILED]: 503,
  [ErrorCode.DATABASE_QUERY_FAILED]: 500,
  [ErrorCode.DATABASE_TIMEOUT]: 504,

  // 外部服务错误
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.API_RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.EXTERNAL_SERVICE_TIMEOUT]: 504,
};
