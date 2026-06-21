export default function executarAssincrono(manipulador) {
  return async (req, res, next) => {
    try {
      await manipulador(req, res, next);
    } catch (erro) {
      next(erro);
    }
  };
}
