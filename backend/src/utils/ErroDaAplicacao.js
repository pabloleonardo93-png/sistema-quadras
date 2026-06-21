export default class ErroDaAplicacao extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.name = "ErroDaAplicacao";
    this.status = status;
  }
}
