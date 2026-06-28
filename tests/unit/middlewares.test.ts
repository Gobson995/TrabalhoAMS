import { Request, Response } from 'express';
import { autorizar } from '../../src/middlewares/rbac';
import { errorHandler } from '../../src/middlewares/error';
import { Usuario } from '../../src/models/Usuario';
import { Papel } from '../../src/types/domain';
import { Permissao } from '../../src/types/rbac';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../src/utils/errors';

function usuario(papel: Papel): Usuario {
  return new Usuario({
    id: 'u', nome: 'n', email: 'e@e.com', senhaHash: 'h', papel, ativo: true,
    criadoEm: new Date(), atualizadoEm: new Date(),
  });
}

describe('Middleware autorizar (RBAC)', () => {
  it('chama next() sem erro quando o papel tem a permissão', () => {
    const req = { usuario: usuario(Papel.ADMINISTRADOR) } as unknown as Request;
    const next = jest.fn();
    autorizar(Permissao.GERENCIAR_USUARIOS)(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('encaminha ForbiddenError quando falta permissão', () => {
    const req = { usuario: usuario(Papel.COLABORADOR) } as unknown as Request;
    const next = jest.fn();
    autorizar(Permissao.GERENCIAR_USUARIOS)(req, {} as Response, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  it('encaminha UnauthorizedError quando não há usuário', () => {
    const req = {} as Request;
    const next = jest.fn();
    autorizar(Permissao.BUSCAR_SINAIS_PUBLICADOS)(req, {} as Response, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });
});

describe('errorHandler', () => {
  function fakeRes() {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res) as never;
    res.json = jest.fn().mockReturnValue(res) as never;
    res.render = jest.fn().mockReturnValue(res) as never;
    return res as Response;
  }
  const reqJson = { accepts: () => false } as unknown as Request;

  it('traduz NotFoundError para 404', () => {
    const res = fakeRes();
    errorHandler(new NotFoundError(), reqJson, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ erro: 'NAO_ENCONTRADO' }));
  });

  it('erros desconhecidos viram 500 sem vazar detalhes', () => {
    const res = fakeRes();
    errorHandler(new Error('boom'), reqJson, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ erro: 'ERRO_INTERNO' }));
  });
});
