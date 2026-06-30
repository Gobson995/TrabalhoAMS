import argon2 from 'argon2';
import { pool, withTransaction } from '../src/config/db';
import { explicarErroConexao } from '../src/utils/dbError';
import {
  Papel,
  StatusSinal,
  ClasseGramatical,
  OrigemSinal,
  PontoArticulacao,
  ClassificacaoSinal,
  DecisaoRevisao,
  TipoDadoSensivel,
} from '../src/types/domain';

async function main() {
  console.log('[seed] iniciando...');

  await withTransaction(async (c) => {
    await c.query(`
      TRUNCATE audit_log, consent_record, revisao, video, sinal_assunto,
               variante_sinal, sinal, assunto, usuario RESTART IDENTITY CASCADE;
    `);

    const senha = async (s: string) => argon2.hash(s);
    const admin = (
      await c.query(
        `INSERT INTO usuario (nome, email, senha_hash, papel)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        ['Administrador Demo', 'admin@libras.gov.br', await senha('Admin@123'), Papel.ADMINISTRADOR],
      )
    ).rows[0].id as string;

    const revisor = (
      await c.query(
        `INSERT INTO usuario (nome, email, senha_hash, papel)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        ['Revisor Demo', 'revisor@libras.gov.br', await senha('Revisor@123'), Papel.REVISOR],
      )
    ).rows[0].id as string;

    const colaborador = (
      await c.query(
        `INSERT INTO usuario (nome, email, senha_hash, papel)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        ['Colaborador Demo', 'colaborador@libras.gov.br', await senha('Colab@123'), Papel.COLABORADOR],
      )
    ).rows[0].id as string;

    const assuntoId: Record<string, string> = {};
    for (const nome of ['FAMÍLIA', 'EDUCAÇÃO', 'TRABALHO', 'GERAL']) {
      assuntoId[nome] = (
        await c.query(`INSERT INTO assunto (nome) VALUES ($1) RETURNING id`, [nome])
      ).rows[0].id;
    }

    async function inserirSinal(s: Record<string, unknown>): Promise<string> {
      const { rows } = await c.query(
        `INSERT INTO sinal
           (palavra, numero, acepcao, exemplo, exemplo_libras, classe_gramatical, origem,
            status, ponto_articulacao, configuracao_mao, disposicao_mao,
            orientacao_mao, regiao_contato, componentes_nao_manuais, classificacao,
            criado_por, revisado_por)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING id`,
        [
          s.palavra, s.numero, s.acepcao, s.exemplo, s.exemploLibras, s.classeGramatical, s.origem,
          s.status, s.pontoArticulacao, s.configuracaoMao, s.disposicaoMao,
          s.orientacaoMao, s.regiaoContato, s.componentesNaoManuais, s.classificacao,
          s.criadoPor, s.revisadoPor,
        ],
      );
      return rows[0].id;
    }

    async function ligarAssunto(sinalId: string, nomeAssunto: string) {
      await c.query(`INSERT INTO sinal_assunto (sinal_id, assunto_id) VALUES ($1,$2)`, [
        sinalId,
        assuntoId[nomeAssunto],
      ]);
    }

    async function inserirVideo(alvo: { sinalId?: string; varianteId?: string }, slug: string) {
      await c.query(
        `INSERT INTO video (sinal_id, variante_id, url, legenda_url, duracao_seg, tamanho_bytes)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          alvo.sinalId ?? null,
          alvo.varianteId ?? null,
          `/uploads/videos/${slug}.mp4`,
          `/uploads/captions/${slug}.vtt`,
          4,
          0,
        ],
      );
    }

    const mamae = await inserirSinal({
      palavra: 'MAMÃE',
      numero: 1,
      acepcao: 'Mulher em relação aos filhos que gerou ou criou; mãe.',
      exemplo: 'Minha mamãe prepara o almoço todos os dias.',
      exemploLibras: 'MINHA MAMÃE ALMOÇO PREPARAR TODO-DIA.',
      classeGramatical: ClasseGramatical.SUBSTANTIVO,
      origem: OrigemSinal.NACIONAL,
      status: StatusSinal.PUBLICADO,
      pontoArticulacao: PontoArticulacao.CABECA,
      configuracaoMao: 'Mão em "P" tocando o queixo',
      disposicaoMao: 'Mão dominante',
      orientacaoMao: 'Palma para baixo',
      regiaoContato: 'Queixo',
      componentesNaoManuais: 'Expressão neutra',
      classificacao: ClassificacaoSinal.UMA_MAO,
      criadoPor: admin,
      revisadoPor: revisor,
    });
    await ligarAssunto(mamae, 'FAMÍLIA');
    await inserirVideo({ sinalId: mamae }, 'mamae1');

    const pai = await inserirSinal({
      palavra: 'PAI',
      numero: 1,
      acepcao: 'Homem em relação aos filhos que gerou ou criou.',
      exemplo: 'Meu pai trabalha na cidade.',
      exemploLibras: 'MEU PAI CIDADE TRABALHAR.',
      classeGramatical: ClasseGramatical.SUBSTANTIVO,
      origem: OrigemSinal.NACIONAL,
      status: StatusSinal.PUBLICADO,
      pontoArticulacao: PontoArticulacao.CABECA,
      configuracaoMao: 'Mão em "P"',
      disposicaoMao: 'Mão dominante',
      orientacaoMao: 'Palma para a esquerda',
      regiaoContato: 'Testa',
      componentesNaoManuais: 'Expressão neutra',
      classificacao: ClassificacaoSinal.UMA_MAO,
      criadoPor: admin,
      revisadoPor: revisor,
    });
    await ligarAssunto(pai, 'FAMÍLIA');

    const variantes = [
      { regiao: 'Padrão', descricao: 'Sinal padrão registrado no dicionário nacional.', slug: 'pai-padrao' },
      { regiao: 'RJ', descricao: 'Variante usada na região do Rio de Janeiro.', slug: 'pai-rj' },
      { regiao: 'RS', descricao: 'Variante usada na região do Rio Grande do Sul.', slug: 'pai-rs' },
    ];
    for (const v of variantes) {
      const varId = (
        await c.query(
          `INSERT INTO variante_sinal (sinal_id, regiao, video_url, descricao)
           VALUES ($1,$2,$3,$4) RETURNING id`,
          [pai, v.regiao, `/uploads/videos/${v.slug}.mp4`, v.descricao],
        )
      ).rows[0].id as string;
      await inserirVideo({ varianteId: varId }, v.slug);
    }

    const amigo = await inserirSinal({
      palavra: 'AMIGO', numero: 1,
      acepcao: 'Pessoa ligada a outra por amizade.', exemplo: 'Ele é meu amigo de infância.',
      exemploLibras: 'ELE MEU AMIGO INFÂNCIA.', classeGramatical: ClasseGramatical.SUBSTANTIVO,
      origem: OrigemSinal.NACIONAL, status: StatusSinal.PUBLICADO,
      pontoArticulacao: PontoArticulacao.MAOS, configuracaoMao: 'Mãos em "X" entrelaçadas',
      disposicaoMao: 'Duas mãos', orientacaoMao: 'Palmas frente a frente', regiaoContato: 'Dedos',
      componentesNaoManuais: 'Expressão leve', classificacao: ClassificacaoSinal.UMA_MAO,
      criadoPor: admin, revisadoPor: revisor,
    });
    await ligarAssunto(amigo, 'GERAL');
    await inserirVideo({ sinalId: amigo }, 'amigo');

    const papel = await inserirSinal({
      palavra: 'PAPEL', numero: 1,
      acepcao: 'Material feito de fibras de celulose usado para escrever.', exemplo: 'Escrevi no papel.',
      exemploLibras: 'EU PAPEL ESCREVER.', classeGramatical: ClasseGramatical.SUBSTANTIVO,
      origem: OrigemSinal.NACIONAL, status: StatusSinal.PUBLICADO,
      pontoArticulacao: PontoArticulacao.PEITO, configuracaoMao: 'Mão aberta',
      disposicaoMao: 'Duas mãos', orientacaoMao: 'Palma para cima', regiaoContato: 'Palma',
      componentesNaoManuais: 'Expressão neutra',
      classificacao: ClassificacaoSinal.DOIS_MOVIMENTOS_DIFERENTES,
      criadoPor: admin, revisadoPor: revisor,
    });
    await ligarAssunto(papel, 'EDUCAÇÃO');
    await inserirVideo({ sinalId: papel }, 'papel');

    const trabalhar = await inserirSinal({
      palavra: 'TRABALHAR', numero: 1,
      acepcao: 'Exercer atividade ou ofício.', exemplo: 'Eu trabalho de manhã.',
      exemploLibras: 'EU MANHÃ TRABALHAR.', classeGramatical: ClasseGramatical.VERBO,
      origem: OrigemSinal.NACIONAL, status: StatusSinal.PUBLICADO,
      pontoArticulacao: PontoArticulacao.PEITO, configuracaoMao: 'Mãos em "S"',
      disposicaoMao: 'Duas mãos', orientacaoMao: 'Palmas para baixo', regiaoContato: 'Punhos',
      componentesNaoManuais: 'Expressão neutra',
      classificacao: ClassificacaoSinal.DOIS_MOVIMENTOS_IGUAIS,
      criadoPor: admin, revisadoPor: revisor,
    });
    await ligarAssunto(trabalhar, 'TRABALHO');
    await inserirVideo({ sinalId: trabalhar }, 'trabalhar');

    const sexo = await inserirSinal({
      palavra: 'SEXO', numero: 1,
      acepcao: 'Conjunto de características que distinguem machos e fêmeas.', exemplo: 'Sexo masculino ou feminino.',
      exemploLibras: 'SEXO HOMEM MULHER.', classeGramatical: ClasseGramatical.SUBSTANTIVO,
      origem: OrigemSinal.NACIONAL, status: StatusSinal.PUBLICADO,
      pontoArticulacao: PontoArticulacao.OLHOS, configuracaoMao: 'Mão em "G"',
      disposicaoMao: 'Mão dominante', orientacaoMao: 'Palma para dentro', regiaoContato: 'Face',
      componentesNaoManuais: 'Movimento dos lábios',
      classificacao: ClassificacaoSinal.MOVIMENTOS_DA_FACE,
      criadoPor: admin, revisadoPor: revisor,
    });
    await ligarAssunto(sexo, 'GERAL');
    await inserirVideo({ sinalId: sexo }, 'sexo');

    const escola = await inserirSinal({
      palavra: 'ESCOLA', numero: 1,
      acepcao: 'Estabelecimento onde se ministra ensino.', exemplo: 'Vou à escola estudar.',
      exemploLibras: 'EU ESCOLA IR ESTUDAR.', classeGramatical: ClasseGramatical.SUBSTANTIVO,
      origem: OrigemSinal.NACIONAL, status: StatusSinal.PENDENTE,
      pontoArticulacao: PontoArticulacao.MAOS, configuracaoMao: 'Mãos abertas batendo palmas',
      disposicaoMao: 'Duas mãos', orientacaoMao: 'Palmas frente a frente', regiaoContato: 'Palmas',
      componentesNaoManuais: 'Expressão neutra',
      classificacao: ClassificacaoSinal.DOIS_MOVIMENTOS_IGUAIS,
      criadoPor: colaborador, revisadoPor: null,
    });
    await ligarAssunto(escola, 'EDUCAÇÃO');
    await inserirVideo({ sinalId: escola }, 'escola');

    await c.query(
      `INSERT INTO consent_record
        (usuario_id, sujeito, tipo_dado, contem_menor, consentimento_concedido, data_consentimento, base_legal)
       VALUES ($1,$2,$3,$4,$5, now(), $6)`,
      [
        colaborador,
        'Adulto sinalizante (autor do vídeo)',
        TipoDadoSensivel.VIDEO_PESSOA_IDENTIFICAVEL,
        false,
        true,
        'Consentimento do titular (art. 7º, I, LGPD)',
      ],
    );

    await c.query(
      `INSERT INTO revisao (sinal_id, revisor_id, decisao, comentario)
       VALUES ($1,$2,$3,$4)`,
      [mamae, revisor, DecisaoRevisao.APROVADO, 'Verbete completo e correto. Aprovado.'],
    );

    await c.query(
      `INSERT INTO audit_log (usuario_id, acao, entidade, entidade_id, detalhes)
       VALUES ($1,'PUBLICAR','sinal',$2,'Sinal MAMÃE publicado no seed inicial.')`,
      [revisor, mamae],
    );
  });

  console.log('[seed] concluído com sucesso.');
  console.log('[seed] Contas demo:');
  console.log('  Admin       -> admin@libras.gov.br / Admin@123');
  console.log('  Revisor     -> revisor@libras.gov.br / Revisor@123');
  console.log('  Colaborador -> colaborador@libras.gov.br / Colab@123');
  await pool.end();
}

main().catch((err) => {
  if (!explicarErroConexao(err)) console.error('[seed] erro:', err);
  process.exit(1);
});
