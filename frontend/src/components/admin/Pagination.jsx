import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ end, onPageChange, page, pageCount, start, total }) {
  if (pageCount <= 1 && total === 0) return null;

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)
    .filter((item) => item === 1 || item === pageCount || Math.abs(item - page) <= 1);

  return (
    <div className="admin-pagination">
      <span>
        {total ? `Mostrando ${start}-${end} de ${total}` : "Nenhum registro"}
      </span>
      <div>
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft aria-hidden="true" size={15} />
          <span>Anterior</span>
        </button>
        {pages.map((item, index) => {
          const previous = pages[index - 1];
          return (
            <span className="admin-pagination__item" key={item}>
              {previous && item - previous > 1 && <small>...</small>}
              <button
                type="button"
                aria-current={item === page ? "page" : undefined}
                className={item === page ? "is-active" : ""}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            </span>
          );
        })}
        <button type="button" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          <span>Próxima</span>
          <ChevronRight aria-hidden="true" size={15} />
        </button>
      </div>
    </div>
  );
}
