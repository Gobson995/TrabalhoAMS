import { StatusSinal } from '../../src/types/domain';
import { proximoStatus, transicaoPermitida } from '../../src/types/workflow';

describe('Máquina de estados do fluxo de aprovação', () => {
  it('RASCUNHO --submeter--> PENDENTE', () => {
    expect(proximoStatus(StatusSinal.RASCUNHO, 'submeter')).toBe(StatusSinal.PENDENTE);
  });

  it('PENDENTE --aprovar--> APROVADO e --rejeitar--> REJEITADO', () => {
    expect(proximoStatus(StatusSinal.PENDENTE, 'aprovar')).toBe(StatusSinal.APROVADO);
    expect(proximoStatus(StatusSinal.PENDENTE, 'rejeitar')).toBe(StatusSinal.REJEITADO);
  });

  it('APROVADO --publicar--> PUBLICADO', () => {
    expect(proximoStatus(StatusSinal.APROVADO, 'publicar')).toBe(StatusSinal.PUBLICADO);
  });

  it('REJEITADO --reabrir--> RASCUNHO', () => {
    expect(proximoStatus(StatusSinal.REJEITADO, 'reabrir')).toBe(StatusSinal.RASCUNHO);
  });

  it('transições inválidas são rejeitadas', () => {
    expect(transicaoPermitida(StatusSinal.PUBLICADO, 'aprovar')).toBe(false);
    expect(transicaoPermitida(StatusSinal.RASCUNHO, 'aprovar')).toBe(false);
    expect(proximoStatus(StatusSinal.PENDENTE, 'publicar')).toBeNull();
  });
});
