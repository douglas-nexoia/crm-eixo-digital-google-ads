/**
 * Gerador de cenários factuais de urgência por nicho e especialidade da empresa.
 * Evita textos genéricos (ex: falar de geladeira para quem só conserta lava e seca).
 */

export interface CenarioUrgencia {
  /** Frase curta do problema: ex: "uma lava e seca trava com roupas e água dentro" */
  fraseProblema: string;
  /** Descrição vívida da urgência na Etapa 1 da Jornada do Consumidor */
  fraseDescricao: string;
  /** Termo de busca de alta intenção: ex: "conserto de lava e seca" */
  termoBuscaExemplo: string;
  /** Nome amigável do serviço: ex: "conserto de máquinas de lavar e lava e seca" */
  rotuloServico: string;
}

function normalizar(texto?: string | null): string {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function obterCenarioUrgencia(nicho?: string | null, nomeEmpresa?: string | null): CenarioUrgencia {
  const combinado = `${normalizar(nicho)} ${normalizar(nomeEmpresa)}`;

  // 1. Especialistas em Lava e Seca / Máquina de Lavar / Lavadoras
  if (
    combinado.includes('lava e seca') ||
    combinado.includes('lava-e-seca') ||
    combinado.includes('lavadora') ||
    combinado.includes('maquina de lavar') ||
    combinado.includes('lavar e seca') ||
    combinado.includes('lava roupas')
  ) {
    return {
      fraseProblema: 'uma máquina de lavar trava cheia de roupas ou uma lava e seca apresenta código de erro no painel',
      fraseDescricao: 'A máquina trava no meio da lavagem com o cesto cheio de água e sabão, não centrifuga ou a lava e seca apita com código de erro. A família fica com as roupas acumuladas e precisa de socorro técnico hoje.',
      termoBuscaExemplo: 'conserto de lava e seca',
      rotuloServico: 'conserto de máquinas de lavar e lava e seca',
    };
  }

  // 2. Especialistas em Climatização / Ar-Condicionado / Split
  if (
    combinado.includes('ar condicionado') ||
    combinado.includes('ar-condicionado') ||
    combinado.includes('climatiz') ||
    combinado.includes('split') ||
    combinado.includes('inverter') ||
    combinado.includes('hvac')
  ) {
    return {
      fraseProblema: 'o ar-condicionado para de gelar ou começa a pingar água no ambiente',
      fraseDescricao: 'O aparelho liga mas não resfria no calor intenso, o motor da unidade externa desarma ou começa a pingar água na parede. Em dias quentes, o cliente tem pressa e procura quem atende hoje.',
      termoBuscaExemplo: 'manutenção de ar-condicionado',
      rotuloServico: 'instalação e manutenção de ar-condicionado',
    };
  }

  // 3. Especialistas em Geladeira / Freezer / Refrigeração
  if (
    combinado.includes('geladeira') ||
    combinado.includes('freezer') ||
    combinado.includes('refrigerador') ||
    combinado.includes('refrigeracao')
  ) {
    return {
      fraseProblema: 'uma geladeira para de gelar e os alimentos correm risco de estragar',
      fraseDescricao: 'A geladeira esquenta de surpresa, o freezer começa a descongelar a carne e a família corre risco de perda imediata dos alimentos. O socorro precisa ser no mesmo dia.',
      termoBuscaExemplo: 'conserto de geladeira urgente',
      rotuloServico: 'conserto e manutenção de geladeiras e freezers',
    };
  }

  // 4. Assistência Técnica de Celular / Smartphone
  if (
    combinado.includes('celular') ||
    combinado.includes('smartphone') ||
    combinado.includes('iphone') ||
    combinado.includes('troca de tela')
  ) {
    return {
      fraseProblema: 'a tela do celular quebra ou o aparelho para de carregar de repente',
      fraseDescricao: 'O aparelho cai, o vidro trinca ou o conector para de responder. Como a pessoa usa o celular para trabalhar e falar com a família, o reparo precisa acontecer no mesmo dia.',
      termoBuscaExemplo: 'conserto de celular mais próximo',
      rotuloServico: 'assistência técnica de celulares e smartphones',
    };
  }

  // 5. Odontologia / Dentistas
  if (
    combinado.includes('odonto') ||
    combinado.includes('dentist') ||
    combinado.includes('implante') ||
    combinado.includes('aparelho dent')
  ) {
    return {
      fraseProblema: 'alguém sente uma dor de dente súbita ou quebra um dente de surpresa',
      fraseDescricao: 'Uma dor de dente aguda no meio do expediente ou uma emergência estética. O paciente procura atendimento imediato para resolver a dor.',
      termoBuscaExemplo: 'dentista em',
      rotuloServico: 'atendimento odontológico',
    };
  }

  // 6. Desentupidora / Dedetizadora / Encanador
  if (
    combinado.includes('desentup') ||
    combinado.includes('dedetiz') ||
    combinado.includes('encanador')
  ) {
    return {
      fraseProblema: 'um vaso sanitário, ralo ou pia entope e começa a transbordar',
      fraseDescricao: 'O esgoto retorna pelo ralo ou a pia da cozinha transborda. Trata-se de uma emergência sanitária que impede o uso do imóvel e exige atendimento imediato.',
      termoBuscaExemplo: 'desentupidora 24 horas',
      rotuloServico: 'serviços de desentupimento e hidrojateamento',
    };
  }

  // 7. Mecânica / Autocenter / Oficina
  if (
    combinado.includes('mecanic') ||
    combinado.includes('oficina') ||
    combinado.includes('autocenter') ||
    combinado.includes('centro automotivo')
  ) {
    return {
      fraseProblema: 'um veículo falha, a luz da injeção acende ou o motor não dá partida',
      fraseDescricao: 'O carro para de funcionar ou apresenta um barulho preocupante. O motorista precisa do veículo para a rotina diária e procura socorro rápido na região.',
      termoBuscaExemplo: 'oficina mecânica em',
      rotuloServico: 'serviços mecânicos e automotivos',
    };
  }

  // 8. Assistência Geral Multimarcas (Fallback equilibrado)
  return {
    fraseProblema: 'um aparelho essencial para de funcionar de repente em casa',
    fraseDescricao: 'Um eletrodoméstico ou equipamento indispensável para de funcionar de surpresa. O cliente não pode esperar dias e procura quem resolve com agilidade.',
    termoBuscaExemplo: 'assistência técnica em',
    rotuloServico: 'assistência técnica e manutenção',
  };
}
