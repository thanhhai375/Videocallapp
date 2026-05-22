using VideoCall.Application.Interfaces;
using VideoCall.Domain.Entities;

namespace VideoCall.Application.Services
{
    public class FriendshipService : IFriendshipService
    {
        private readonly IRepository<Friendship> repo;

        public FriendshipService(IRepository<Friendship> repo) => this.repo = repo;

        public Task<bool> AreFriendsAsync(string userId1, string userId2)
        {
            var (a, b) = userId1.CompareTo(userId2) < 0 ? (userId1, userId2) : (userId2, userId1);
            return Task.FromResult(repo.GetAll().Any(f => f.User1Id == a && f.User2Id == b));
        }

        public async Task AddFriendshipAsync(string userId1, string userId2)
        {
            var (a, b) = userId1.CompareTo(userId2) < 0 ? (userId1, userId2) : (userId2, userId1);
            if (!await AreFriendsAsync(a, b))
            {
                repo.Add(new Friendship { User1Id = a, User2Id = b });
            }
        }
    }
}