export default function CreatePage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Создать новый модуль</h1>
        
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Название модуля</span>
              </label>
              <input
                type="text"
                placeholder="Введите название..."
                className="input input-bordered w-full"
              />
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Описание</span>
              </label>
              <textarea
                placeholder="Введите описание..."
                className="textarea textarea-bordered h-24"
              />
            </div>

            <div className="divider">Термины</div>

            <div className="text-center text-neutral-content py-8">
              Функционал создания терминов будет добавлен позже
            </div>

            <div className="card-actions justify-end mt-6">
              <button className="btn btn-ghost">Отмена</button>
              <button className="btn btn-primary">Создать модуль</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

