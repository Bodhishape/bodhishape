# Pasta de Áudios do Cronômetro de Daimoku

Cole os 3 arquivos de áudio reais nesta pasta com os seguintes nomes exatos:

1. `daimoku_lento.mp3`
2. `daimoku_vibrante.mp3`
3. `daimoku_sensei.mp3`

### Por que esta pasta?
Arquivos estáticos dentro da pasta `/public` são empacotados diretamente na imagem Docker do contêiner durante o build de produção (`npm run build`). 
Isso garante que:
- Os áudios fiquem disponíveis permanentemente para o aplicativo.
- Não sejam deletados em reinicializações ou atualizações do contêiner no Cloud Run.
- Não sofram com o limite de tamanho de 1 MB do Firestore (que inviabiliza salvar músicas/áudios em Base64).
