"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Module } from "@/types/module";
import {
  createModule,
  getPublicApiUrl,
  lookupDictionary,
  updateModule,
  uploadFile,
  type DictionaryDefinition,
} from "@/lib/api";

interface TermCard {
  id: string;
  term: string;
  definition: string;
  image?: string;
}

interface ModuleFormProps {
  initialData?: Module;
  mode: "create" | "edit";
}

type ImportTermDefinitionSeparator = "tab" | "comma" | "custom";
type ImportCardSeparator = "newline" | "semicolon" | "custom";

export default function ModuleForm({ initialData, mode }: ModuleFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null);
  const [lookupCardId, setLookupCardId] = useState<string | null>(null);
  const [activeLookupCardId, setActiveLookupCardId] = useState<string | null>(null);
  const [lookupOptions, setLookupOptions] = useState<Record<string, DictionaryDefinition[]>>({});
  const [lookupErrors, setLookupErrors] = useState<Record<string, string>>({});
  const [lookupTerms, setLookupTerms] = useState<Record<string, string>>({});
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [termDefinitionSeparator, setTermDefinitionSeparator] =
    useState<ImportTermDefinitionSeparator>("tab");
  const [cardSeparator, setCardSeparator] =
    useState<ImportCardSeparator>("newline");
  const [customTermDefinitionSeparator, setCustomTermDefinitionSeparator] =
    useState("");
  const [customCardSeparator, setCustomCardSeparator] = useState("");
  
  // Инициализация карточек
  const [cards, setCards] = useState<TermCard[]>(() => {
    if (initialData?.terms && initialData.terms.length > 0) {
      return initialData.terms.map(t => ({
        id: t.id,
        term: t.term,
        definition: t.definition,
        image: t.image
      }));
    }
    return [
      { id: "1", term: "", definition: "" },
      { id: "2", term: "", definition: "" },
    ];
  });

  const addCard = () => {
    setCards([
      ...cards,
      { id: Date.now().toString(), term: "", definition: "" },
    ]);
  };

  const parsedImportCards = useMemo(
    () =>
      parseImportedCards({
        text: importText,
        termDefinitionSeparator,
        cardSeparator,
        customTermDefinitionSeparator,
        customCardSeparator,
      }),
    [
      importText,
      termDefinitionSeparator,
      cardSeparator,
      customTermDefinitionSeparator,
      customCardSeparator,
    ],
  );

  const removeCard = (id: string) => {
    if (cards.length > 0) {
      setCards(cards.filter((card) => card.id !== id));
    }
  };

  const updateCard = (id: string, field: "term" | "definition" | "image", value: string) => {
    setCards((currentCards) =>
      currentCards.map((card) =>
        card.id === id ? { ...card, [field]: value } : card
      )
    );
  };

  const updateTerm = (id: string, value: string) => {
    updateCard(id, "term", value);
    setLookupOptions((options) => {
      const nextOptions = { ...options };
      delete nextOptions[id];
      return nextOptions;
    });
    setLookupErrors((errors) => {
      const nextErrors = { ...errors };
      delete nextErrors[id];
      return nextErrors;
    });
    setLookupTerms((terms) => {
      const nextTerms = { ...terms };
      delete nextTerms[id];
      return nextTerms;
    });
  };

  const applyDefinition = (cardId: string, definition: string) => {
    updateCard(cardId, "definition", definition);
    setActiveLookupCardId(null);
    setLookupOptions((options) => {
      const nextOptions = { ...options };
      delete nextOptions[cardId];
      return nextOptions;
    });
    setLookupErrors((errors) => {
      const nextErrors = { ...errors };
      delete nextErrors[cardId];
      return nextErrors;
    });
  };

  const handleDictionaryLookup = async (card: TermCard) => {
    const term = card.term.trim();
    setActiveLookupCardId(card.id);

    if (!term) {
      setLookupErrors((errors) => ({
        ...errors,
        [card.id]: "Введите термин",
      }));
      return;
    }

    setLookupCardId(card.id);
    setLookupErrors((errors) => {
      const nextErrors = { ...errors };
      delete nextErrors[card.id];
      return nextErrors;
    });

    try {
      const result = await lookupDictionary(term);
      const definitions = result.definitions.filter((definition) => definition.text);

      if (definitions.length === 0) {
        setLookupOptions((options) => {
          const nextOptions = { ...options };
          delete nextOptions[card.id];
          return nextOptions;
        });
        setLookupErrors((errors) => ({
          ...errors,
          [card.id]: "Определение не найдено",
        }));
        return;
      }

      setLookupOptions((options) => ({
        ...options,
        [card.id]: definitions.slice(0, 5),
      }));
      setLookupTerms((terms) => ({
        ...terms,
        [card.id]: term,
      }));
    } catch (error) {
      console.error("Dictionary lookup failed", error);
      setLookupErrors((errors) => ({
        ...errors,
        [card.id]: "Не удалось получить определение",
      }));
    } finally {
      setLookupCardId(null);
    }
  };

  const openDefinitionDropdown = (card: TermCard) => {
    const term = card.term.trim();

    setActiveLookupCardId(card.id);

    if (!term || lookupCardId === card.id) {
      return;
    }

    if (lookupTerms[card.id] === term && lookupOptions[card.id]?.length) {
      return;
    }

    void handleDictionaryLookup(card);
  };

  const handleImageClick = (cardId: string) => {
    setUploadingCardId(cardId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingCardId) {
      try {
        const { url } = await uploadFile(file);
        const fullUrl = getPublicApiUrl(url);
        updateCard(uploadingCardId, "image", fullUrl);
      } catch (error) {
        console.error("Upload failed", error);
        alert("Ошибка загрузки изображения");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadingCardId(null);
  };

  const openImport = () => {
    setImportText("");
    setTermDefinitionSeparator("tab");
    setCardSeparator("newline");
    setCustomTermDefinitionSeparator("");
    setCustomCardSeparator("");
    setIsImportOpen(true);
  };

  const closeImport = () => {
    setIsImportOpen(false);
  };

  const handleImport = () => {
    if (parsedImportCards.length === 0) {
      return;
    }

    setCards((currentCards) => {
      const hasOnlyBlankCards = currentCards.every(
        (card) => !card.term.trim() && !card.definition.trim() && !card.image,
      );

      const importedCards = parsedImportCards.map((card, index) => ({
        ...card,
        id: `import-${Date.now()}-${index}`,
      }));

      return hasOnlyBlankCards ? importedCards : [...currentCards, ...importedCards];
    });

    closeImport();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Пожалуйста, введите название модуля");
      return;
    }

    // Фильтруем пустые карточки
    const validTerms = cards.filter(c => c.term.trim() || c.definition.trim()).map(c => ({
      term: c.term,
      definition: c.definition,
      image: c.image
    }));

    if (validTerms.length < 2) {
      alert("Добавьте как минимум 2 термина");
      return;
    }

    setIsSaving(true);

    try {
      const moduleData = {
        title,
        description,
        terms: validTerms
      };

      if (mode === "create") {
        await createModule(moduleData);
        router.push("/");
        router.refresh(); // Обновляем список модулей на главной
      } else if (initialData?.id) {
        await updateModule(initialData.id, moduleData);
        router.push(`/module/${initialData.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to save module:", error);
      alert("Ошибка при сохранении модуля");
    } finally {
      setIsSaving(false);
    }
  };

  const moduleInputClassName =
    "input w-full rounded-2xl border border-transparent bg-[var(--app-field)] px-5 text-lg font-medium text-[var(--app-text-strong)] placeholder:text-[var(--app-field-placeholder)] transition-[border-color,box-shadow,background-color] duration-150 hover:bg-[var(--app-field-hover)] focus:bg-[var(--app-field-focus)] focus:border-[var(--app-focus)] focus:shadow-[0_0_0_1px_var(--app-focus-shadow)] focus:outline-none";

  const moduleTextareaClassName =
    "textarea w-full min-h-[100px] rounded-2xl border border-transparent bg-[var(--app-field)] px-5 py-4 text-base text-[var(--app-text-strong)] placeholder:text-[var(--app-field-placeholder)] transition-[border-color,box-shadow,background-color] duration-150 hover:bg-[var(--app-field-hover)] focus:bg-[var(--app-field-focus)] focus:border-[var(--app-focus)] focus:shadow-[0_0_0_1px_var(--app-focus-shadow)] focus:outline-none";

  const termInputClassName =
    "input h-14 min-h-14 w-full rounded-xl border border-transparent bg-[var(--app-field-deep)] px-5 text-lg font-medium text-[var(--app-text-strong)] placeholder:text-[var(--app-field-placeholder)] transition-[border-color,box-shadow,background-color] duration-150 hover:bg-[var(--app-field-deep-hover)] focus:bg-[var(--app-field-focus)] focus:border-[var(--app-focus)] focus:shadow-[0_0_0_1px_var(--app-focus-shadow)] focus:outline-none";

  const definitionInputClassName =
    "input h-16 min-h-16 w-full rounded-2xl border-2 border-[var(--app-focus)] bg-[var(--app-field-active)] px-6 text-xl font-medium text-[var(--app-text-strong)] placeholder:text-[var(--app-field-placeholder)] transition-[border-color,box-shadow,background-color] duration-150 focus:bg-[var(--app-field-active)] focus:border-[var(--app-focus)] focus:shadow-none focus:outline-none";

  return (
    <div className="max-w-5xl mx-auto">
      {/* Хедер формы с действиями */}
      <div className="flex items-center justify-between mb-8 sticky top-[64px] z-10 bg-base-100/95 backdrop-blur py-4">
        {mode === "edit" ? (
           <Link href={`/module/${initialData?.id}`} className="btn btn-primary btn-sm px-6 rounded-full font-semibold">
             Назад к модулю
           </Link>
        ) : (
           <h1 className="text-2xl font-bold text-[var(--app-text-strong)]">Создать новый модуль</h1>
        )}
        
        <button 
          className="btn btn-primary btn-sm px-8 rounded-full font-semibold"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            mode === "create" ? "Создать" : "Готово"
          )}
        </button>
      </div>

      {/* Форма описания модуля */}
      <div className="space-y-4 mb-12">
        <div className="form-control">
          <label className="label pl-0 pb-1" hidden={mode === "create"}>
             <span className="label-text text-neutral-content text-xs font-semibold uppercase">Название</span>
          </label>
          <input
            type="text"
            placeholder="Название" // Для create
            className={moduleInputClassName}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-control">
          <textarea
            placeholder="Добавьте описание..."
            className={moduleTextareaClassName}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* Инструменты списка */}
      {mode === "edit" ? (
        <div className="flex justify-start mb-10">
          <button
            type="button"
            className="btn rounded-full border-none bg-[var(--app-panel-strong)] px-7 text-base font-semibold text-[var(--app-text-strong)] hover:bg-[var(--app-panel-strong-hover)]"
            onClick={openImport}
          >
            <span className="text-2xl leading-none">+</span>
            Импортировать
          </button>
        </div>
      ) : null}

      {/* Список карточек */}
      <div className="space-y-6">
        {cards.map((card, index) => (
          <div key={card.id} className="card rounded-[22px] border border-transparent bg-[var(--app-panel-strong)]">
            <div className="card-body p-6 sm:p-7">
              {/* Хедер карточки */}
              <div className="flex justify-between items-center mb-4 border-b border-neutral/10 pb-4">
                <span className="text-neutral-content font-medium">{index + 1}</span>
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost btn-xs btn-circle text-neutral-content cursor-move">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button 
                    className="btn btn-ghost btn-xs btn-circle text-neutral-content hover:text-error"
                    onClick={() => removeCard(card.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Поля ввода */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Термин */}
                <div className="flex-1 form-control w-full">
                  <input
                    type="text"
                    className={termInputClassName}
                    value={card.term}
                    onChange={(e) => updateTerm(card.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        openDefinitionDropdown(card);
                      }
                    }}
                  />
                  <label className="label px-0 pt-2">
                    <span className="label-text-alt text-neutral-content uppercase tracking-wider text-xs font-semibold">Термин</span>
                  </label>
                </div>

                {/* Определение */}
                <div className="flex-1 form-control w-full relative">
                  <div className="relative">
                    <input
                      type="text"
                      className={
                        activeLookupCardId === card.id &&
                        (lookupCardId === card.id ||
                          lookupErrors[card.id] ||
                          lookupOptions[card.id]?.length)
                          ? definitionInputClassName
                          : termInputClassName
                      }
                      value={card.definition}
                      onChange={(e) => updateCard(card.id, "definition", e.target.value)}
                      onFocus={() => openDefinitionDropdown(card)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setActiveLookupCardId(null);
                        }
                      }}
                    />
                    {lookupCardId === card.id ? (
                      <span className="loading loading-spinner loading-xs absolute right-4 top-1/2 -translate-y-1/2 text-[var(--app-focus)]"></span>
                    ) : null}
                  </div>
                  <label className="label px-0 pt-2">
                    <span className="label-text-alt text-neutral-content uppercase tracking-wider text-xs font-semibold">
                      Определение
                      {activeLookupCardId === card.id && lookupOptions[card.id]?.length
                        ? ` (${lookupOptions[card.id].length}/1850)`
                        : ""}
                    </span>
                    {activeLookupCardId === card.id &&
                    (lookupCardId === card.id ||
                      lookupErrors[card.id] ||
                      lookupOptions[card.id]?.length) ? (
                      <span className="label-text-alt text-[var(--app-focus)] uppercase tracking-wider text-xs font-semibold">
                        Английский
                      </span>
                    ) : null}
                  </label>

                  {activeLookupCardId === card.id &&
                  (lookupCardId === card.id ||
                    lookupErrors[card.id] ||
                    lookupOptions[card.id]?.length) ? (
                    <div className="z-30 mt-8 w-full rounded-none bg-transparent p-0">
                      {lookupCardId === card.id ? (
                        <div className="flex min-h-14 items-center gap-2 rounded-xl border border-[var(--app-border)] px-5 py-4 text-base font-normal text-[var(--app-text-strong)]">
                          <span className="loading loading-spinner loading-xs"></span>
                          Поиск определений...
                        </div>
                      ) : lookupErrors[card.id] ? (
                        <div className="rounded-xl border border-error/70 px-5 py-4 text-base font-normal text-error">
                          {lookupErrors[card.id]}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {lookupOptions[card.id].map((definition, definitionIndex) => (
                            <button
                              type="button"
                              key={`${definition.text}-${definitionIndex}`}
                              className="block min-h-14 w-full rounded-xl border border-[var(--app-border)] px-5 py-4 text-left text-base font-normal leading-relaxed text-[var(--app-text-strong)] transition-colors hover:bg-[var(--app-field-active)] focus:bg-[var(--app-field-active)] focus:outline-none"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => applyDefinition(card.id, definition.text)}
                            >
                              <span>{definition.text}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Загрузка изображения */}
                <div className="flex-none pt-1">
                   <button 
                     className="w-24 h-20 border-2 border-dashed border-neutral/30 hover:border-neutral/60 rounded-lg flex flex-col items-center justify-center gap-1 text-neutral-content hover:text-[var(--app-text-strong)] transition-colors overflow-hidden relative"
                     onClick={() => handleImageClick(card.id)}
                   >
                      {card.image ? (
                        <>
                            <img src={card.image} alt="term" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                               </svg>
                            </div>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[10px] uppercase font-semibold tracking-wide">Изображение</span>
                        </>
                      )}
                   </button>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Кнопка добавления карточки */}
      <div className="flex justify-center mt-12 mb-20">
        <button 
          className="btn btn-lg bg-base-300 hover:bg-base-200 text-[var(--app-text-strong)] border-neutral/20 min-w-[200px]"
          onClick={addCard}
        >
          <span className="font-semibold text-lg">+ Добавить карточку</span>
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleFileChange}
      />

      {isImportOpen ? (
        <ImportModal
          importText={importText}
          setImportText={setImportText}
          termDefinitionSeparator={termDefinitionSeparator}
          setTermDefinitionSeparator={setTermDefinitionSeparator}
          cardSeparator={cardSeparator}
          setCardSeparator={setCardSeparator}
          customTermDefinitionSeparator={customTermDefinitionSeparator}
          setCustomTermDefinitionSeparator={setCustomTermDefinitionSeparator}
          customCardSeparator={customCardSeparator}
          setCustomCardSeparator={setCustomCardSeparator}
          parsedCards={parsedImportCards}
          onClose={closeImport}
          onImport={handleImport}
        />
      ) : null}
    </div>
  );
}

function ImportModal({
  importText,
  setImportText,
  termDefinitionSeparator,
  setTermDefinitionSeparator,
  cardSeparator,
  setCardSeparator,
  customTermDefinitionSeparator,
  setCustomTermDefinitionSeparator,
  customCardSeparator,
  setCustomCardSeparator,
  parsedCards,
  onClose,
  onImport,
}: {
  importText: string;
  setImportText: (value: string) => void;
  termDefinitionSeparator: ImportTermDefinitionSeparator;
  setTermDefinitionSeparator: (value: ImportTermDefinitionSeparator) => void;
  cardSeparator: ImportCardSeparator;
  setCardSeparator: (value: ImportCardSeparator) => void;
  customTermDefinitionSeparator: string;
  setCustomTermDefinitionSeparator: (value: string) => void;
  customCardSeparator: string;
  setCustomCardSeparator: (value: string) => void;
  parsedCards: TermCard[];
  onClose: () => void;
  onImport: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[var(--app-modal-bg)] text-[var(--app-text-strong)]">
      <button
        type="button"
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--app-panel-strong)] text-[var(--app-text-strong)] transition-colors hover:bg-[var(--app-panel-strong-hover)]"
        onClick={onClose}
        aria-label="Закрыть импорт"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="flex-1 overflow-y-auto px-8 pb-28 pt-12">
        <div className="mb-6 text-base text-[var(--app-text-strong)]">
          <span className="font-semibold">Импортировать данные.</span>{" "}
          <span className="text-neutral-content">
            Скопируйте и вставьте свои данные (из Word, Excel, Google Docs и т.п.)
          </span>
        </div>

        <textarea
          className="h-60 w-full resize-y border-2 border-[var(--app-text-strong)] bg-transparent px-5 py-3 text-sm leading-6 text-[var(--app-text-strong)] placeholder:text-neutral-content focus:outline-none"
          placeholder={"Слово 1\tОпределение 1\nСлово 2\tОпределение 2\nСлово 3\tОпределение 3"}
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          autoFocus
        />

        <div className="mt-10 grid max-w-3xl grid-cols-1 gap-10 md:grid-cols-2">
          <ImportSeparatorGroup
            title="Между термином и определением"
            name="term-definition-separator"
            value={termDefinitionSeparator}
            onChange={setTermDefinitionSeparator}
            customValue={customTermDefinitionSeparator}
            onCustomValueChange={setCustomTermDefinitionSeparator}
            options={[
              { value: "tab", label: "Tab" },
              { value: "comma", label: "Запятая" },
              { value: "custom", label: "На выбор" },
            ]}
          />

          <ImportSeparatorGroup
            title="Между карточками"
            name="card-separator"
            value={cardSeparator}
            onChange={setCardSeparator}
            customValue={customCardSeparator}
            onCustomValueChange={setCustomCardSeparator}
            options={[
              { value: "newline", label: "Разрыв строки" },
              { value: "semicolon", label: "Точка с запятой" },
              { value: "custom", label: "На выбор" },
            ]}
          />
        </div>

        <div className="mt-4">
          <h2 className="text-xl font-semibold">
            Предварительный просмотр{" "}
            <span className="text-sm font-normal text-neutral-content">
              {parsedCards.length} карточек
            </span>
          </h2>

          {parsedCards.length ? (
            <div className="mt-4 max-h-[34vh] max-w-5xl overflow-y-auto pr-2">
              <div className="space-y-3">
              {parsedCards.map((card, index) => (
                <div
                  key={`${card.term}-${index}`}
                  className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-4 rounded-xl bg-[var(--app-panel-strong)] px-5 py-4 md:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)]"
                >
                  <div className="text-sm font-medium text-[var(--app-text-strong)]">{index + 1}</div>
                  <div>
                    <div className="rounded-lg bg-[var(--app-field-deep)] px-4 py-3 text-sm text-[var(--app-text-strong)]">
                      {card.term}
                    </div>
                    <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-neutral-content">
                      Термин
                    </div>
                  </div>
                  <div>
                    <div className="rounded-lg bg-[var(--app-field-deep)] px-4 py-3 text-sm text-neutral-content">
                      {card.definition}
                    </div>
                    <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-neutral-content">
                      Определение
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-base text-neutral-content">
              Пока нет данных для просмотра.
            </p>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex justify-end gap-4 border-t border-[var(--app-panel-strong)] bg-[var(--app-modal-bg)] px-8 py-4">
        <button
          type="button"
          className="btn rounded-full border border-[var(--app-border-strong)] bg-transparent px-7 text-base font-semibold text-[var(--app-text-strong)] hover:bg-[var(--app-panel)]"
          onClick={onClose}
        >
          Отменить импорт
        </button>
        <button
          type="button"
          className="btn btn-primary rounded-full px-8 text-base font-semibold"
          onClick={onImport}
          disabled={parsedCards.length === 0}
        >
          Импортировать
        </button>
      </div>
    </div>
  );
}

function ImportSeparatorGroup<T extends string>({
  title,
  name,
  value,
  onChange,
  customValue,
  onCustomValueChange,
  options,
}: {
  title: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  customValue: string;
  onCustomValueChange: (value: string) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <fieldset>
      <legend className="mb-5 text-base font-semibold text-[var(--app-text-strong)]">{title}</legend>
      <div className="space-y-5">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-3 text-base font-semibold text-[var(--app-text-strong)]"
          >
            <input
              type="radio"
              className="radio radio-sm border-[var(--app-text-strong)] bg-transparent checked:border-[var(--app-text-strong)] checked:bg-transparent checked:text-[var(--app-text-strong)]"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.value === "custom" ? (
              <input
                type="text"
                className="input h-12 min-h-12 w-48 rounded-md border-none bg-[var(--app-panel-strong)] px-4 text-base font-medium text-[var(--app-text-strong)] placeholder:text-neutral-content focus:outline-none"
                placeholder={option.label}
                value={customValue}
                onFocus={() => onChange(option.value)}
                onChange={(event) => onCustomValueChange(event.target.value)}
              />
            ) : (
              <span>{option.label}</span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function parseImportedCards({
  text,
  termDefinitionSeparator,
  cardSeparator,
  customTermDefinitionSeparator,
  customCardSeparator,
}: {
  text: string;
  termDefinitionSeparator: ImportTermDefinitionSeparator;
  cardSeparator: ImportCardSeparator;
  customTermDefinitionSeparator: string;
  customCardSeparator: string;
}) {
  const rows = splitImportRows(text, cardSeparator, customCardSeparator);

  return rows
    .map((row) =>
      splitImportRow(
        row,
        termDefinitionSeparator,
        customTermDefinitionSeparator,
      ),
    )
    .filter((card): card is TermCard => Boolean(card));
}

function splitImportRows(
  text: string,
  separator: ImportCardSeparator,
  customSeparator: string,
) {
  if (!text.trim()) {
    return [];
  }

  if (separator === "newline") {
    return text.split(/\r?\n/);
  }

  if (separator === "semicolon") {
    return text.split(";");
  }

  if (!customSeparator) {
    return [];
  }

  return text.split(customSeparator);
}

function splitImportRow(
  row: string,
  separator: ImportTermDefinitionSeparator,
  customSeparator: string,
) {
  const trimmedRow = row.trim();

  if (!trimmedRow) {
    return null;
  }

  const splitIndex = getTermDefinitionSplitIndex(
    trimmedRow,
    separator,
    customSeparator,
  );

  if (splitIndex.index < 0) {
    return null;
  }

  const term = trimmedRow.slice(0, splitIndex.index).trim();
  const definition = trimmedRow
    .slice(splitIndex.index + splitIndex.length)
    .trim();

  if (!term || !definition) {
    return null;
  }

  return {
    id: "",
    term,
    definition,
  };
}

function getTermDefinitionSplitIndex(
  row: string,
  separator: ImportTermDefinitionSeparator,
  customSeparator: string,
) {
  if (separator === "tab") {
    const tabIndex = row.indexOf("\t");

    if (tabIndex >= 0) {
      return { index: tabIndex, length: 1 };
    }

    const multiSpaceMatch = /\s{2,}/.exec(row);

    if (multiSpaceMatch?.index !== undefined) {
      return {
        index: multiSpaceMatch.index,
        length: multiSpaceMatch[0].length,
      };
    }

    return { index: -1, length: 0 };
  }

  if (separator === "comma") {
    return { index: row.indexOf(","), length: 1 };
  }

  if (!customSeparator) {
    return { index: -1, length: 0 };
  }

  return {
    index: row.indexOf(customSeparator),
    length: customSeparator.length,
  };
}
