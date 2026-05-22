using VideoCall.Application.Interfaces;

namespace VideoCall.Infrastructure.Data
{
    public class InMemoryRepository<T> : List<T>, IRepository<T> where T : class
    {
        public InMemoryRepository(IEnumerable<T> initialData) : base(initialData) { }
        public IReadOnlyList<T> GetAll() => this.AsReadOnly();
    }
}
