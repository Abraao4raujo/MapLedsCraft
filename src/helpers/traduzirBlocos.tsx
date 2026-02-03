import ptBr from "../../public/pt_br.json";

const traduzirBlocos = (nomeIngles: string) => {
  const snakeCase = nomeIngles.toLowerCase().trim().replace(/\s+/g, '_');
  const chave = `block.minecraft.${snakeCase}`;

  return (ptBr as Record<string, string>)[chave] || nomeIngles;
}

export default traduzirBlocos