import { useMemo, useState } from "react";
import {
  getRegions,
  getMaterialsForRegion,
  getCategories,
} from "./lib/catalog.js";
import { buildRetentionOffer } from "./lib/retention.js";
import { buildOrderPayload, downloadOrderJson } from "./lib/order.js";
import "./App.css";

const STEPS = ["Регион", "Каталог", "Заказ", "Готово"];

function formatPrice(value) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export default function App() {
  const [step, setStep] = useState(0);
  const [region, setRegion] = useState(null);
  const [material, setMaterial] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("order");
  const [retentionOffer, setRetentionOffer] = useState(null);
  const [savedFilename, setSavedFilename] = useState("");
  const [quantityError, setQuantityError] = useState("");

  const regions = getRegions();
  const categories = getCategories();

  const materials = useMemo(() => {
    if (!region) return [];
    let list = getMaterialsForRegion(region.id);
    if (categoryFilter) {
      list = list.filter((m) => m.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }
    return list;
  }, [region, categoryFilter, search]);

  const unitPrice = material?.price ?? 0;
  const totalPrice = unitPrice * quantity;

  function goToCatalog(selectedRegion) {
    setRegion(selectedRegion);
    setMaterial(null);
    setCategoryFilter("");
    setSearch("");
    setStep(1);
  }

  function goToOrder() {
    if (!material) return;
    const q = Number(quantity);
    if (!Number.isInteger(q) || q < 1) {
      setQuantityError("Укажите целое количество не меньше 1");
      return;
    }
    setQuantityError("");
    setView("order");
    setRetentionOffer(null);
    setStep(2);
  }

  function resetAll() {
    setStep(0);
    setRegion(null);
    setMaterial(null);
    setQuantity(1);
    setCategoryFilter("");
    setSearch("");
    setView("order");
    setRetentionOffer(null);
    setSavedFilename("");
    setQuantityError("");
  }

  function finalizeOrder(orderMaterial, orderPrice, orderQuantity, retention) {
    const order = buildOrderPayload({
      region,
      material: orderMaterial,
      price: orderPrice,
      quantity: orderQuantity,
      retention,
    });
    const filename = downloadOrderJson(order);
    setSavedFilename(filename);
    setStep(3);
  }

  function handleConfirm() {
    finalizeOrder(material, unitPrice, quantity, null);
  }

  function handleDecline() {
    const offer = buildRetentionOffer(material, region.id);
    setRetentionOffer(offer);
    setView("retention");
  }

  function handleAcceptRetention() {
    if (!retentionOffer) return;
    finalizeOrder(
      retentionOffer.material,
      retentionOffer.price,
      quantity,
      retentionOffer,
    );
  }

  function handleDeclineRetention() {
    resetAll();
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Заявка на строительные материалы</h1>
        <p>Каталог по регионам и оформление заявки в JSON</p>
      </header>

      <div className="steps">
        {STEPS.map((label, index) => (
          <span
            key={label}
            className={`step-badge ${index === step ? "active" : ""} ${index < step ? "done" : ""}`}
          >
            {index + 1}.{" "}
            {index === 2 && view === "retention" && step === 2
              ? "Предложение"
              : label}
          </span>
        ))}
      </div>

      {step === 0 && (
        <section className="card">
          <h2>Выберите регион</h2>
          <div className="region-grid">
            {regions.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`region-btn ${region?.id === r.id ? "selected" : ""}`}
                onClick={() => goToCatalog(r)}
              >
                {r.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && region && (
        <section className="card">
          <h2>Каталог — {region.name}</h2>
          <div className="filters">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Категория"
            >
              <option value="">Все категории</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="material-list">
            {materials.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`material-item ${material?.id === m.id ? "selected" : ""}`}
                onClick={() => setMaterial(m)}
              >
                <span>
                  <span className="name">{m.name}</span>
                  <span className="meta">{m.category}</span>
                </span>
                <span className="price">{formatPrice(m.price)}</span>
              </button>
            ))}
          </div>

          {materials.length === 0 && <p className="error">Ничего не найдено</p>}

          <div className="quantity-row">
            <label htmlFor="qty">Количество (шт.)</label>
            <input
              id="qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          {quantityError && <p className="error">{quantityError}</p>}

          <div className="actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep(0)}
            >
              Назад
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!material}
              onClick={goToOrder}
            >
              К заказу
            </button>
          </div>
        </section>
      )}

      {step === 2 && region && material && view === "order" && (
        <section className="card order-summary">
          <h2>Ваш заказ</h2>
          <dl>
            <dt>Регион</dt>
            <dd>{region.name}</dd>
            <dt>Товар</dt>
            <dd>{material.name}</dd>
            <dt>Категория</dt>
            <dd>{material.category}</dd>
            <dt>Количество</dt>
            <dd>{quantity} шт.</dd>
            <dt>Цена за ед.</dt>
            <dd>{formatPrice(unitPrice)}</dd>
            <dt className="total">Итого: {formatPrice(totalPrice)}</dt>
          </dl>

          <p style={{ marginTop: "1.25rem", fontWeight: 600 }}>
            Оформляем заявку?
          </p>
          <div className="actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep(1)}
            >
              Назад
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDecline}
            >
              Нет
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirm}
            >
              Да, оформить
            </button>
          </div>
        </section>
      )}

      {step === 2 && region && retentionOffer && view === "retention" && (
        <section className="card retention-card">
          <h3>Специальное предложение</h3>
          {retentionOffer.type === "discount" ? (
            <>
              <p>
                Вы выбрали самый доступный товар в категории «
                {retentionOffer.material.category}».
              </p>
              <p>
                Скидка {retentionOffer.discountPercent}% на «
                {retentionOffer.material.name}»:{" "}
                {formatPrice(retentionOffer.originalPrice)} →{" "}
                {formatPrice(retentionOffer.price)}
              </p>
            </>
          ) : (
            <>
              <p>
                В категории «{retentionOffer.material.category}» есть более
                выгодный вариант:
              </p>
              <p>
                «{retentionOffer.material.name}» —{" "}
                {formatPrice(retentionOffer.price)} вместо «
                {retentionOffer.previousMaterial.name}» —{" "}
                {formatPrice(retentionOffer.originalPrice)}
              </p>
            </>
          )}

          <dl style={{ marginTop: "1rem" }}>
            <dt>Количество</dt>
            <dd>{quantity} шт.</dd>
            <dt>Итого</dt>
            <dd>{formatPrice(retentionOffer.price * quantity)}</dd>
          </dl>

          <p style={{ marginTop: "1rem", fontWeight: 600 }}>
            Принимаете предложение?
          </p>
          <div className="actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDeclineRetention}
            >
              Отказаться
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAcceptRetention}
            >
              Да, оформить заявку
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="card success">
          <div className="success-icon">✓</div>
          <h2>Заявка оформлена</h2>
          <p>
            Файл <strong>{savedFilename}</strong> скачан в папку «Загрузки».
          </p>
          <div className="actions" style={{ justifyContent: "center" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={resetAll}
            >
              Новая заявка
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
