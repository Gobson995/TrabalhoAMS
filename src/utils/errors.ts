/**
 * Hierarquia de erros de aplicação. O middleware central de erros traduz cada
 * um para o status HTTP correto, garantindo respostas consistentes (RNF
 * confiabilidade: nenhuma falha não tratada derruba a aplicação).
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly codigo: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Dados inválidos.', public readonly detalhes?: unknown) {
    super(message, 400, 'VALIDACAO');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Autenticação necessária.') {
    super(message, 401, 'NAO_AUTENTICADO');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Você não tem permissão para esta ação.') {
    super(message, 403, 'SEM_PERMISSAO');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado.') {
    super(message, 404, 'NAO_ENCONTRADO');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito com o estado atual do recurso.') {
    super(message, 409, 'CONFLITO');
  }
}
