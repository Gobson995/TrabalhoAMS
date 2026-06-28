#!/usr/bin/env bash
# Exporta os documentos Markdown de docs/ para .docx.
# Usa pandoc se disponível; caso contrário, usa o caminho nativo do macOS
# (marked converte .md -> .html e textutil converte .html -> .docx).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS="$ROOT/docs"

# "arquivo-md relativo a docs | nome de saída (sem extensão)"
ITENS=(
  "01-engenharia-de-requisitos.md|01-engenharia-de-requisitos"
  "02-modelagem/README.md|02-modelagem"
  "03-projeto-arquitetura-mvc.md|03-projeto-arquitetura-mvc"
  "04-desenvolvimento-colaborativo-dod.md|04-desenvolvimento-colaborativo-dod"
  "05-descritivo-atividades-equipe.md|05-descritivo-atividades-equipe"
  "06-manual-do-usuario-handover.md|06-manual-do-usuario-handover"
)

exportar_pandoc () {
  local in="$1" out="$2"
  pandoc "$in" -o "$out" --resource-path="$(dirname "$in")" --toc --toc-depth=2 -V lang=pt-BR
}

exportar_textutil () {
  local in="$1" out="$2" dir tmp
  dir="$(dirname "$in")"
  tmp="${in%.md}.__tmp.html"
  {
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
    echo 'body{font-family:Helvetica,Arial,sans-serif;font-size:11pt;line-height:1.4}'
    echo 'h1,h2,h3{color:#0b4f8a} table{border-collapse:collapse;margin:8px 0}'
    echo 'th,td{border:1px solid #999;padding:4px 8px} code{background:#eee;padding:1px 3px}'
    echo 'img{max-width:620px}</style></head><body>'
    npx -y marked -i "$in"
    echo '</body></html>'
  } > "$tmp"
  ( cd "$dir" && textutil -convert docx -output "$out" "$(basename "$tmp")" )
  rm -f "$tmp"
}

if command -v pandoc >/dev/null 2>&1; then
  MOTOR="pandoc"
elif command -v textutil >/dev/null 2>&1; then
  MOTOR="textutil"
else
  echo "[docs] Nem pandoc nem textutil encontrados. Instale o pandoc: brew install pandoc"
  exit 1
fi
echo "[docs] gerando .docx com: $MOTOR"

for item in "${ITENS[@]}"; do
  src="$DOCS/${item%%|*}"
  out="$DOCS/${item##*|}.docx"
  echo "[docs] ${item%%|*} -> ${item##*|}.docx"
  if [ "$MOTOR" = "pandoc" ]; then exportar_pandoc "$src" "$out"; else exportar_textutil "$src" "$out"; fi
done

echo "[docs] concluído:"
ls -1 "$DOCS"/*.docx
