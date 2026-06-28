import { parseSinalForm, parseAssuntoIds } from '../../src/utils/sinalForm';
import { ClasseGramatical, ClassificacaoSinal, OrigemSinal, PontoArticulacao } from '../../src/types/domain';

describe('parseSinalForm', () => {
  it('normaliza strings vazias para null e converte número', () => {
    const d = parseSinalForm({ palavra: 'CASA', numero: '2', acepcao: '   ', exemplo: '' });
    expect(d.palavra).toBe('CASA');
    expect(d.numero).toBe(2);
    expect(d.acepcao).toBeNull();
    expect(d.exemplo).toBeNull();
  });

  it('aceita apenas valores válidos dos enums', () => {
    const ok = parseSinalForm({
      palavra: 'X',
      classeGramatical: ClasseGramatical.VERBO,
      classificacao: ClassificacaoSinal.UMA_MAO,
      pontoArticulacao: PontoArticulacao.MAOS,
      origem: OrigemSinal.REGIONAL,
    });
    expect(ok.classeGramatical).toBe(ClasseGramatical.VERBO);
    expect(ok.origem).toBe(OrigemSinal.REGIONAL);

    const lixo = parseSinalForm({ palavra: 'X', classeGramatical: 'INVALIDO', origem: 'xpto' });
    expect(lixo.classeGramatical).toBeNull();
    expect(lixo.origem).toBe(OrigemSinal.NACIONAL); 
  });
});

describe('parseAssuntoIds', () => {
  it('normaliza string única, array e vazio', () => {
    expect(parseAssuntoIds({ assuntoIds: 'a1' })).toEqual(['a1']);
    expect(parseAssuntoIds({ assuntoIds: ['a1', 'a2'] })).toEqual(['a1', 'a2']);
    expect(parseAssuntoIds({})).toEqual([]);
  });
});
